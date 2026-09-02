# EfficientNetB3 Classification Model — Technical Specification & Training Guide

## 1. Overview & Diagnostic Purpose
The **EfficientNetB3 Multi-Class Classifier** is the primary diagnostic engine of **BrainTumorAI**. It evaluates axial/sagittal/coronal brain MRI scans to determine whether a tumor exists and classifies detected lesions into one of four clinically recognized categories:

1. **`glioma`** — Infiltrative glial cell tumors (Astrocytoma, Oligodendroglioma, Glioblastoma).
2. **`meningioma`** — Dural-based, predominantly extra-axial meningeal tumors.
3. **`pituitary`** — Sellar and parasellar pituitary neuroendocrine tumors.
4. **`notumor`** — Normal neuroanatomy with absence of intracranial masses.

---

## 2. Core Hyperparameters & Configuration
Located in [`python-backend/training/train_efficientnetb3.py`](file:///C:/Projects/Major_Project-_27/python-backend/training/train_efficientnetb3.py):

| Parameter | Value | Rationale |
|---|---|---|
| **Input Resolution (`IMG_SIZE`)** | $300 \times 300 \times 3$ | Native input resolution calibrated for EfficientNetB3 compound scaling. |
| **Batch Size (`BATCH_SIZE`)** | `16` | Optimized balance for GPU/CPU RAM capacity and gradient stability. |
| **Number of Classes (`NUM_CLASSES`)** | `4` | `glioma`, `meningioma`, `notumor`, `pituitary` (alphabetical order). |
| **Stage 1 Epochs** | `12` | Head warmup with frozen convolutional base ($LR = 10^{-3}$). |
| **Stage 2 Epochs** | `25` | End-to-end fine-tuning of top conv stages ($LR = 10^{-5}$). |
| **Validation Split** | `15%` | Stratified split from the training dataset for evaluation and checkpointing. |
| **Weights Output** | `models/brain_tumor_efficientnetb3.h5` | Final trained model weights used by the FastAPI backend. |

---

## 3. Deep Learning Architecture Pipeline

```
                       Input Brain MRI Scan (300 x 300 x 3)
                                        │
                                        ▼
                  ┌───────────────────────────────────────────┐
                  │   EfficientNetB3 Backbone (Pretrained)    │
                  │   - 384 Convolutional Layers             │
                  │   - MBConv Blocks (Inverted Residuals)   │
                  │   - Squeeze-and-Excitation (SE) Units     │
                  └─────────────────────┬─────────────────────┘
                                        │
                                        ▼  Feature Maps (10 x 10 x 1536)
                  ┌───────────────────────────────────────────┐
                  │         GlobalAveragePooling2D            │
                  │       (Reduces 10x10x1536 -> 1536)        │
                  └─────────────────────┬─────────────────────┘
                                        │
                                        ▼
                  ┌───────────────────────────────────────────┐
                  │          Batch Normalization              │
                  │            Dropout (p = 0.4)              │
                  └─────────────────────┬─────────────────────┘
                                        │
                                        ▼
                  ┌───────────────────────────────────────────┐
                  │       Dense (256 units, ReLU)             │
                  │            Dropout (p = 0.3)              │
                  └─────────────────────┬─────────────────────┘
                                        │
                                        ▼
                  ┌───────────────────────────────────────────┐
                  │       Dense (4 units, Softmax)            │
                  │   [p(glioma), p(men), p(no), p(pit)]      │
                  └───────────────────────────────────────────┘
```

---

## 4. Two-Stage Transfer Learning Strategy

### Stage 1: Feature Head Pre-Training
* **Backbone Status:** Frozen (`base_model.trainable = False`).
* **Learning Rate:** $1 \times 10^{-3}$ using the Adam optimizer.
* **Objective:** Train newly initialized classification head layers (Dense-256, Dropout, Softmax) without destabilizing or corrupting the pre-trained ImageNet feature representations.

### Stage 2: Fine-Tuning Top Convolutional Blocks
* **Backbone Status:** Top layers unfrozen (`base_model.trainable = True`, keeping bottom 80% frozen).
* **Learning Rate:** $1 \times 10^{-5}$ (ultra-low learning rate with learning rate decay).
* **Objective:** Fine-tune high-level semantic filters (such as layer `top_conv` and `block6f_project_conv`) specifically on neurological MRI textures, boundary hyperintensities, and contrast patterns.

---

## 5. Data Augmentation Pipeline
Applied dynamically per batch via `ImageDataGenerator`:
* **Rotation:** $\pm 20^\circ$ (simulates head tilt inside MRI gantry).
* **Width & Height Shifts:** $\pm 10\%$ (simulates field-of-view centering differences).
* **Zoom Range:** $\pm 15\%$ (simulates slice magnification variations).
* **Horizontal Flip:** `True` (maintains anatomical symmetry).
* **Brightness Range:** $[0.85, 1.15]$ (simulates MRI radiofrequency coil gain fluctuations).

---

## 6. Real-Time Streaming & WebSocket Integration
During training, epoch metrics are parsed and broadcast in real time over WebSockets:
* **Command:** `python train_efficientnetb3.py --stream`
* **WebSocket Endpoint:** `WS /ws/train/classification` in [`app/main.py`](file:///C:/Projects/Major_Project-_27/python-backend/app/main.py)
* **Emitted JSON Payload:**
```json
{
  "epoch": 14,
  "total_epochs": 25,
  "loss": 0.1245,
  "accuracy": 0.9632,
  "val_loss": 0.1812,
  "val_accuracy": 0.9450,
  "lr": 0.00001
}
```

---

## 7. Explainable AI Integration (Grad-CAM)
The model directly powers Gradient-weighted Class Activation Mapping:
* **Target Layer:** `block6f_project_conv` / `top_conv`
* **Output:** Gradients of the predicted class score are extracted with respect to the final convolutional feature maps, normalized, and mapped onto an OpenCV Jet colormap.
* **Clinical Purpose:** Proves to neurosurgeons and radiologists exactly which anatomical features (necrotic cores, dural tails, microcalcifications) justified the classification.
