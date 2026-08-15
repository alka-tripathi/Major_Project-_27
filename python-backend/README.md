# BrainTumorAI — Python Deep Learning Backend

This backend provides real-time **AI-Powered** brain tumor detection, classification, explainable visualization, and segmentation capabilities for neuro-oncological MRI scans.

---

## Why BrainTumorAI is "AI-Powered"

BrainTumorAI relies on three integrated deep learning architectures working in tandem inside an end-to-end inference pipeline:

```
                          Uploaded Brain MRI Scan
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │ Step 1: EfficientNetB3          │
                    │ Multi-Class Classifier          │
                    └────────────────┬────────────────┘
                                     │
            ┌────────────────────────┼────────────────────────┐
            │                        │                        │
            ▼                        ▼                        ▼
 ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
 │ Tumor Classification│  │ Step 2: Grad-CAM    │  │ Step 3: Attention   │
 │ & Confidence Scores │  │ Thermal Heatmaps    │  │ U-Net Segmentation  │
 └─────────────────────┘  └─────────────────────┘  └──────────┬──────────┘
                                                              │
                                                              ▼
                                                   ┌─────────────────────┐
                                                   │ Step 4: Morphometrics│
                                                   │ Lesion Area (mm²)   │
                                                   └─────────────────────┘
```

### 1. 🧠 Multi-Class Classification (`EfficientNetB3`)
* **Architecture**: EfficientNetB3 backbone with GlobalAveragePooling2D, Batch Normalization, Dropout, 256-Dense ReLU, and Softmax activation.
* **Function**: Accepts $300 \times 300 \times 3$ RGB MRI scans and classifies them into **4 diagnostic categories**:
  1. `glioma` — Glioma Tumor
  2. `meningioma` — Meningioma
  3. `pituitary` — Pituitary Tumor
  4. `notumor` — Healthy Tissue / No Tumor
* **Output**: Primary class label, overall confidence score, and exact 4-class probability vector.

---

### 2. 🔥 Explainable AI Thermal Maps (`Grad-CAM`)
* **Technology**: Gradient-weighted Class Activation Mapping (Grad-CAM).
* **Function**: Extracts feature gradients from the final convolutional layer (`top_conv`) of EfficientNetB3. Computes weighted class activation maps and applies an OpenCV Jet Colormap overlay.
* **Clinical Purpose**: Highlights exact visual hotspots on the brain MRI, allowing doctors to understand *why* the neural network made a specific diagnostic classification.

---

### 3. 🎯 Deep Learning Tumor Segmentation (`Attention U-Net`)
* **Architecture**: Attention U-Net featuring an encoder-decoder network augmented with Attention Gates to focus feature learning on tumor regions while suppressing irrelevant brain tissue background.
* **Function**: Processes $256 \times 256 \times 1$ inputs to produce binary pixel-level segmentation masks isolating the precise lesion boundary.

---

### 4. 📐 Morphological Lesion Analytics & Staging
* **Function**: Post-processes raw segmentation masks to calculate real-world physical metrics:
  * **Surface Area**: Physical tumor size in $\text{mm}^2$.
  * **Bounding Box**: Precise spatial bounding box coordinates $(x, y, w, h)$.
  * **Severity Staging**: Automated severity categorization (*Low*, *Moderate*, *High*) based on lesion surface area.

---

## FastAPI Backend Architecture

* **Primary Endpoint**: `POST /predict` (Accepts multipart image files, returns JSON with class probabilities, base64-encoded Grad-CAM overlays, binary mask overlays, surface area in $mm^2$, and severity stage).
* **Training WebSocket**: `WS /ws/train/{model_type}` (Streams real-time training epoch metrics and logs to the doctor workstation for model fine-tuning).
* **Health Check**: `GET /health`

---

## Setup & Running Locally

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Download pre-trained model weights into `python-backend/models/`:
   * `brain_tumor_efficientnetb3.h5`
   * `unet_segmentation.weights.h5`

3. Start FastAPI server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
