# Attention U-Net Segmentation Model — Technical Specification & Training Guide

## 1. Overview & Diagnostic Purpose
The **Attention U-Net** is the pixel-level morphological segmentation engine of **BrainTumorAI**. It isolates the exact boundaries of brain tumors from MRI scans and calculates vital quantitative metrics:
* **Lesion Surface Area ($mm^2$)**
* **Spatial Bounding Box ($x, y, w, h$)**
* **Clinical Severity Staging (Low / Moderate / High)**

Classes segmented: `glioma`, `meningioma`, and `pituitary` (`notumor` is bypassed as healthy scans have zero tumor pixels).

---

## 2. Core Hyperparameters & Configuration
Located in [`python-backend/segmentation/train_unet.py`](file:///C:/Projects/Major_Project-_27/python-backend/segmentation/train_unet.py):

| Parameter | Value | Rationale |
|---|---|---|
| **Input Resolution (`IMG_SIZE`)** | $256 \times 256 \times 3$ | Aligns with standard medical segmentation grid dimensions and mask generators. |
| **Batch Size (`BATCH_SIZE`)** | `8` | Memory-optimized for multi-level skip connection caching during backprop. |
| **Epochs (`EPOCHS`)** | `40` | Allows fine convergence on complex tumor margins. |
| **Learning Rate (`LEARNING_RATE`)** | $1 \times 10^{-4}$ | Adam optimizer with ReduceLROnPlateau decay. |
| **Loss Function** | Combined BCE + Dice Loss | Solves severe foreground-background class imbalance. |
| **Weights Output** | `models/unet_segmentation.weights.h5` | Loaded on server startup via `build_segmentation_model()`. |

---

## 3. Architecture & Attention Gate Mechanism

### Network Layout:
```
Encoder (EfficientNetB3 Backbone)                 Decoder (Upsampling & Convolutions)
---------------------------------                 -----------------------------------
s1 (128x128) ──────► [ Attention Gate 4 ] ──────► Concat ──► ConvBlock ──► Output (256x256x1)
                             ▲
s2 (64x64)   ──────► [ Attention Gate 3 ] ──────► Concat ──► ConvBlock
                             ▲
s3 (32x32)   ──────► [ Attention Gate 2 ] ──────► Concat ──► ConvBlock
                             ▲
s4 (16x16)   ──────► [ Attention Gate 1 ] ──────► Concat ──► ConvBlock
                             ▲
Bottleneck (8x8) ────────────┘
```

### The Attention Gate Formula:
$$\theta_x = W_x^T x_l, \quad \phi_g = W_g^T g$$
$$\psi = \sigma\left(\psi^T \cdot \text{ReLU}(\theta_x + \phi_g)\right)$$
$$\hat{x}_l = x_l \odot \psi$$

* $x_l$: Spatial feature map from the encoder skip connection.
* $g$: Coarse gating vector from the deeper decoder layer.
* $\psi$: Pixel attention coefficient map between $0$ and $1$.
* **Why it matters:** Standard U-Net passes all encoder noise (skull, eyes, healthy ventricles) into the decoder. Attention Gates dynamically suppress background noise and amplify tumor boundary regions.

---

## 4. Loss Function: Combined BCE + Dice Loss
Medical image segmentation has a vast class imbalance (the tumor often occupies $< 5\%$ of the total slice pixels). Standard Cross-Entropy alone biases the model toward predicting background.

### Combined Loss:
$$\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{BCE}} + (1 - \text{Dice})$$

$$\text{Dice}(Y, \hat{Y}) = \frac{2 \sum Y \cdot \hat{Y} + \epsilon}{\sum Y + \sum \hat{Y} + \epsilon}$$

---

## 5. Morphological Post-Processing Pipeline
Implemented in [`python-backend/postprocessing/postprocess.py`](file:///C:/Projects/Major_Project-_27/python-backend/postprocessing/postprocess.py):
1. **Binarization:** Sigmoid probabilities thresholded at $\tau = 0.5$.
2. **Morphological Opening & Closing:** Removes isolated single-pixel false positives.
3. **Physical Surface Area Calculation:**
   $$\text{Area}_{\text{mm}^2} = \sum \text{Tumor Pixels} \times (\text{Pixel Spacing})^2$$
   *(Default calibration: $0.0576\text{ mm}^2$ per pixel).*
4. **Clinical Staging:**
   * **Low:** $< 300\text{ mm}^2$
   * **Moderate:** $300\text{ mm}^2 - 800\text{ mm}^2$
   * **High:** $> 800\text{ mm}^2$
