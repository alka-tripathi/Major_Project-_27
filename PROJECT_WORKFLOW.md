# BrainTumorAI — Comprehensive End-to-End System Workflow

## 1. System Architecture Overview

BrainTumorAI is an enterprise medical decision support system for neuro-oncological MRI diagnostics. The platform integrates a Next.js App Router frontend, a FastAPI deep learning Python backend, Firebase Authentication & Cloud Storage, and MongoDB Atlas database persistence.

```
                  +------------------------------------------------+
                  |         Next.js Frontend (Port 3000)          |
                  |     Doctor Dashboard & Diagnostic UI           |
                  +-------+-------------------+--------------------+
                          |                   |
            Auth & Images |                   | API Predictions
                          v                   v
     +--------------------+-----+   +---------+--------------------+
     |   Firebase Cloud Services |   |   FastAPI Python Backend   |
     |  - Auth (Email/Google)   |   |        (Port 8000)          |
     |  - Storage (Per-Doctor)  |   | - EfficientNetB3 Classifier|
     +--------------------------+   | - Grad-CAM Heatmap         |
                                    | - Attention U-Net Segmenter|
                                    +------------------------------+
                                                  |
                                                  | Saved Metadata & URLs
                                                  v
                                    +-------------+----------------+
                                    |       MongoDB Atlas DB       |
                                    | - Doctor Collection          |
                                    | - Patient Collection         |
                                    +------------------------------+
```

---

## 2. Authentication & Doctor Synchronization Flow

1. **Registration & Sign-In**:
   - Doctors authenticate via **Email/Password** or **Google One-Tap Sign-In**.
   - Upon registration, a verification email is dispatched via Firebase Auth.
2. **MongoDB Profile Sync (`/api/doctors/sync`)**:
   - Immediately after authentication, the frontend invokes `POST /api/doctors/sync`.
   - The doctor's `firebaseUid`, `email`, `firstName`, `lastName`, and Google avatar (`profilePic`) are saved/updated in the MongoDB `Doctor` collection.
3. **Patients Counter**:
   - MongoDB tracks patient count per doctor dynamically (`totalPatients`), displayed as a badge on the Doctor Profile page.

---

## 3. Cloud Storage Folder Hierarchy (Firebase Storage)

Image files are never stored inside MongoDB to prevent database bloat. Instead, binary image files are uploaded to Firebase Storage inside human-readable per-doctor per-patient trees:

```
gs://major-project-55fe0.firebasestorage.app/
└── doctors/
    └── doctor@gmail.com/
        └── patients/
            └── john_doe_1786639390123/
                ├── input_mri_brain_scan.png       (Original Input MRI)
                ├── output_gradcam_heatmap.png     (Grad-CAM Heatmap Overlay)
                └── output_segmentation_mask.png   (Attention U-Net Tumor Mask)
```

---

## 4. Deep Learning AI Inference Pipeline (FastAPI / TensorFlow)

When a doctor uploads an MRI scan on the **Add Patient** page, the following pipeline executes:

### Step A: Input MRI Upload & Cloud Sync
1. The original MRI image is uploaded directly to Firebase Storage (`input_mri_brain_scan.png`).
2. The public HTTPS download URL is retrieved.

### Step B: Python Backend Prediction (`POST http://127.0.0.1:8000/predict`)
1. **Classification (`EfficientNetB3`)**:
   - Image resized to $300 \times 300 \times 3$ and normalized.
   - Passed through EfficientNetB3 backbone + GlobalAveragePooling2D + Dense(256) + Softmax(4).
   - Outputs primary tumor type (`glioma`, `meningioma`, `pituitary`, `notumor`) and confidence percentage.
2. **Explainability (`Grad-CAM`)**:
   - Gradient activation maps extracted from layer `top_conv`.
   - Processed with OpenCV Jet Colormap overlay onto the MRI scan to highlight AI attention hotspot.
3. **Segmentation (`Attention U-Net`)**:
   - Image resized to $256 \times 256 \times 1$.
   - Attention U-Net model predicts binary tumor contour mask.
   - Post-processing calculates morphological surface area ($mm^2$) and severity stage.

### Step C: Demonstration Fallback Mode
If model weight files (`.h5`) are missing or the Python backend is offline:
- The frontend triggers an HTML5 Canvas generator (`generateVisualOverlay()`).
- Generates visual thermal heatmap and red contour mask overlays directly from the uploaded MRI file, ensuring zero downtime during demonstration or UI testing.

---

## 5. MongoDB Atlas Data Persistence (`/api/patients`)

The patient's demographic details, AI diagnostic metrics, and Firebase Storage URLs are stored in the MongoDB `Patient` collection:

```json
{
  "_id": "6a7df0ec979da0eff783cfe8",
  "doctorId": "GguccfDu5iTyCNYPKvW2TBj7Hq23",
  "patientName": "John Doe",
  "patientAge": 45,
  "patientGender": "Male",
  "scanDate": "2026-08-13T16:29:32.391Z",
  "status": "Completed",

  "imagePath": "https://firebasestorage.googleapis.com/.../input_mri_brain_scan.png",
  "heatmapPath": "https://firebasestorage.googleapis.com/.../output_gradcam_heatmap.png",
  "segmentationPath": "https://firebasestorage.googleapis.com/.../output_segmentation_mask.png",

  "tumorDetected": true,
  "tumorType": "Glioma",
  "confidence": 96,
  "probabilities": {
    "glioma": 0.958,
    "meningioma": 0.026,
    "pituitary": 0.011,
    "noTumor": 0.005
  },
  "tumorSize": {
    "area": 348.5
  },
  "severity": "Low"
}
```

---

## 6. Frontend UI Diagnostics Workstation

The Next.js frontend contains 5 core medical workstation modules:

1. **Landing Page (`/`)**:
   - Medical workstation overview, 3-card product pipeline preview, and 4 brain tumor classification category descriptions.
2. **Doctor Dashboard (`/dashboard`)**:
   - Clinical analytics banner (**Total Patients**, **Tumors Detected**, **Normal Scans**), quick action modules, and recent patient reports feed.
3. **MRI Scan Analysis (`/dashboard/add-patient`)**:
   - Demographic details form, drag-and-drop file dropzone, live model inspection drawer, and 3-card image viewer (**Original MRI**, **Grad-CAM**, **Attention U-Net**).
4. **Patient Directory (`/dashboard/patients`)**:
   - Real-time search filtering by patient name or tumor classification, status pills, and record deletion controls.
5. **Patient Diagnostic Details (`/dashboard/patient/[id]`)**:
   - Full diagnostic breakdown with class probability distribution progress bars, morphological measurements ($mm^2$), and recommended clinical action plans.

---

## 7. Execution & Setup Instructions

### 1. Start Python FastAPI Server (Backend)
```bash
cd python-backend/app
python -m uvicorn main:app --reload --port 8000
```

### 2. Start Next.js Frontend Server
```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` in your web browser to access the complete BrainTumorAI Clinical Workstation.
