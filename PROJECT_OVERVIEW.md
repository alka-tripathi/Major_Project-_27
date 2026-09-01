# BrainTumorAI — Project Overview

## Table of Contents

- [Why Uvicorn?](#why-uvicorn)
- [Project Modules Breakdown](#project-modules-breakdown)
  - [Python Backend](#-python-backend-python-backend--8-modules)
  - [Next.js Frontend](#%EF%B8%8F-nextjs-frontend-frontendsrc--4-modules)
- [Getting Started](#getting-started)

---

## Why Uvicorn?

The backend (`python-backend/app/main.py`) is built with **FastAPI**, which is an **ASGI** (Asynchronous Server Gateway Interface) framework. **Uvicorn** is the ASGI server that actually runs it.

| Reason              | Explanation                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ASGI server**     | FastAPI doesn't have a built-in server. Uvicorn is a lightning-fast ASGI server that serves FastAPI apps — similar to how Gunicorn serves Flask/Django (WSGI).                       |
| **Async support**   | Uvicorn handles async `await` calls natively, which is critical for the `/predict` endpoint (image processing can be I/O heavy).                                                    |
| **WebSocket support** | The project has a `WS /ws/train/{model_type}` endpoint for streaming real-time training metrics. Uvicorn supports WebSockets out of the box, which a traditional WSGI server cannot. |
| **Hot reload**      | The `--reload` flag gives live code reloading during development.                                                                                                                   |

> **In short:** FastAPI needs an ASGI server to run, and Uvicorn is the standard, high-performance choice for that.

---

## Project Modules Breakdown

The project has **2 major parts** with **~12 distinct modules** total.

### 🐍 Python Backend (`python-backend/`) — 8 Modules

| #   | Module            | Key Files                                            | Purpose                                                          |
| --- | ----------------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | `app/`            | `main.py`                                            | FastAPI server — `/predict` endpoint, `/health`, WebSocket for training |
| 2   | `preprocessing/`  | `preprocess.py`                                      | MRI image preprocessing pipeline                                 |
| 3   | `gradcam/`        | `gradcam.py`, `find_layer.py`, `find_misclassified.py` | Grad-CAM explainability heatmaps                                 |
| 4   | `segmentation/`   | `train_unet.py`, `evaluate_unet.py`                  | Attention U-Net tumor segmentation                               |
| 5   | `postprocessing/` | `postprocess.py`                                     | Morphometric analysis (area, bounding box, severity staging)     |
| 6   | `mask_generator/` | `mask_generator.py`                                  | Binary mask generation for training data                         |
| 7   | `training/`       | `train_efficientnetb3.py`, `data_loader.py`          | EfficientNetB3 classifier training                               |
| 8   | `models/`         | `.h5` weight files                                   | Pre-trained model weights storage                                |

### ⚛️ Next.js Frontend (`frontend/src/`) — 4 Modules

| #   | Module      | Key Files                                | Purpose                                                                       |
| --- | ----------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| 9   | `app/`      | `page.tsx`, `layout.tsx`                 | Pages — Landing, Login, Signup, Dashboard (with patients, profile, add-patient) |
| 10  | `app/api/`  | `doctors/`, `patients/`                  | Next.js API routes (server-side MongoDB CRUD)                                 |
| 11  | `models/`   | `Doctor.ts`, `Patient.ts`                | Mongoose schema definitions                                                   |
| 12  | `lib/`      | `mongodb.ts`, `firebase.ts`, `opencvUtils.ts` | Shared utilities — DB connection, Firebase auth, OpenCV helpers               |

---

## Getting Started

### Backend (Python / FastAPI)

```bash
cd python-backend
pip install -r requirements.txt        # first time only
python -m uvicorn app.main:app --reload --port 8000
```

> **Note:** Make sure the pre-trained model weights (`brain_tumor_efficientnetb3.h5` and `unet_segmentation.weights.h5`) are placed in `python-backend/models/` before starting the backend.

### Frontend (Next.js)

```bash
cd frontend
npm install       # first time only
npm run dev
```
