# Brain Tumor Detection — Backend Process Documentation

This document tracks everything done inside `python-backend/` so far, in order.
Read this before touching the code — it explains *why* things are structured
the way they are, not just *what* exists.

---

## 1. Project Goal

Build a brain tumor detection system with three parts:
1. **Classification** — identify tumor type from an MRI slice (Glioma, Meningioma, Pituitary, No Tumor)
2. **Explainability** — visualize *why* the model made its decision (Grad-CAM)
3. **Segmentation** — outline the tumor's exact boundary and estimate its size (Attention U-Net)

These feed into a FastAPI backend, which a Next.js frontend calls.

---

## 2. Folder Structure

```
python-backend/
├── venv/                          # Python virtual environment (not committed to git)
├── requirements.txt
│
├── dataset/
│   ├── Training/
│   │   ├── glioma/                # 1400 images
│   │   ├── meningioma/            # 1400 images
│   │   ├── notumor/               # 1400 images
│   │   └── pituitary/             # 1400 images
│   ├── Testing/
│   │   ├── glioma/                # 400 images
│   │   ├── meningioma/            # 400 images
│   │   ├── notumor/               # 400 images
│   │   └── pituitary/             # 400 images
│   ├── Masks/                     # auto-generated pseudo-masks (see Section 5)
│   │   ├── Training/{glioma, meningioma, pituitary}/
│   │   └── Testing/{glioma, meningioma, pituitary}/
│   └── Masks_Preview/             # side-by-side preview images for spot-checking masks
│       └── Training/{glioma, meningioma, pituitary}/
│
├── training/
│   ├── train_efficientnetb3.py    # classification training script
│   ├── check_dataset.py           # verifies dataset folder structure/counts
│   ├── stage1_log.csv             # training logs (generated)
│   ├── stage2_log.csv
│   ├── confusion_matrix.png       # generated after training
│   └── training_curves.png
│
├── mask_generator/
│   └── mask_generator.py          # generates pseudo-masks for segmentation training
│
├── gradcam/
│   ├── gradcam.py                 # explainability visualizations
│   ├── find_misclassified.py      # finds + copies out misclassified test images
│   ├── find_layer.py              # utility to inspect model layer names/indices
│   ├── misclassified_samples/     # generated: misclassified images grouped by error type
│   └── gradcam_outputs/           # generated: heatmap visualizations
│
├── segmentation/
│   └── train_unet.py              # Attention U-Net segmentation training (not yet run)
│
└── models/
    ├── brain_tumor_efficientnetb3.h5   # trained classification model
    └── unet_segmentation.weights.h5     # (to be generated)
```

---

## 3. Environment Setup

- **Python version:** 3.13.2
- **Key packages:** `tensorflow==2.21.0` (auto-resolved; `2.15.0` in requirements.txt isn't available for Python 3.13), `keras==3.14.1`, `opencv-python`, `scikit-learn`, `matplotlib`, `seaborn`
- **Virtual environment:** `python-backend/venv/`

**Known Windows-specific issue:** `venv\Scripts\activate` sometimes doesn't correctly update PATH in Command Prompt sessions, causing `python`, `where`, `deactivate` etc. to be "not recognized." Workaround used throughout: call the venv's Python directly by full path when this happens:
```bash
..\venv\Scripts\python.exe script_name.py
```
VS Code's integrated terminal has generally *not* had this problem — prefer running scripts from there.

---

## 4. Classification — EfficientNetB3 (Transfer Learning)

**Script:** `training/train_efficientnetb3.py`
**Dataset:** Kaggle "Brain Tumor MRI Dataset" (Masoud Nickparvar) — 4 classes, pre-split Training/Testing folders

**Why EfficientNetB3:** compound-scaled architecture (balances depth/width/resolution), fewer parameters than ResNet101 (~12M vs ~44M) which reduces overfitting risk on our ~5,600 image dataset, and squeeze-and-excitation blocks give channel-wise attention useful for subtle tumor texture differences.

**Architecture:** EfficientNetB3 backbone (ImageNet pretrained, `include_top=False`) → GlobalAveragePooling2D → BatchNorm → Dropout(0.4) → Dense(256, relu) → Dropout(0.3) → Dense(4, softmax)

**Training strategy — two stages:**
- **Stage 1:** backbone frozen, train head only, 12 epochs, lr=1e-3
- **Stage 2:** unfreeze last ~30% of backbone layers (BatchNorm layers kept frozen even here), fine-tune, 25 epochs, lr=1e-5

**Input:** 300×300×3 (EfficientNetB3's native resolution), `efficientnet.preprocess_input` normalization (not `/255`)

**Class imbalance handling:** `compute_class_weight("balanced", ...)` — though our dataset turned out to be perfectly balanced (1400/1400/1400/1400) so this had minimal practical effect this time.

### Results (on held-out test set, 1600 images)

```
              precision    recall  f1-score   support
      glioma       0.99      0.80      0.89       400
  meningioma       0.88      0.97      0.92       400
     notumor       0.92      1.00      0.96       400
   pituitary       0.98      1.00      0.99       400
    accuracy                           0.94      1600
```

**Overall test accuracy: 94.2%**

**Confusion matrix summary:** of 400 glioma cases, 320 correct, 50 misclassified as meningioma, 29 misclassified as notumor, 1 as pituitary. All other classes near-perfect (single-digit errors).

**Known limitation, documented for the report:** Glioma has the lowest recall (0.80) — expected given glioma's diffuse, less clearly-defined tumor boundaries compared to the other classes (see Grad-CAM analysis, Section 6, for visual confirmation of *why*).

**Model saved to:** `models/brain_tumor_efficientnetb3.h5` (full model, via `model.save()`)

⚠️ **Important gotcha discovered:** loading this `.h5` file back via `load_model()` fails with a `VarianceScaling.__init__() got an unexpected keyword argument 'input_axes'` error — a genuine bug in how Keras 3.14.1 round-trips the legacy HDF5 config format. **Workaround used everywhere downstream:** rebuild the exact model architecture in code, then use `model.load_weights(MODEL_PATH)` instead of `load_model(MODEL_PATH)`. This bypasses the broken config deserialization entirely since weight-loading only matches tensors by layer name, not by reconstructing layer configs from JSON. See `build_model()` in `gradcam.py` for the reference implementation of this pattern — **reuse this pattern in any future script that needs to load this model.**

---

## 5. Mask Generation (for Segmentation)

**Script:** `mask_generator/mask_generator.py`

**Why this exists:** the Kaggle classification dataset has no ground-truth tumor masks, but segmentation training needs them. Rather than downloading BraTS (which only contains glioma cases, not meningioma/pituitary — a dealbreaker for our 4-class use case), we generate **pseudo-masks** using classical image processing.

**Pipeline per image:**
1. Grayscale, resize to 256×256, bilateral filter (denoise while preserving edges)
2. **Skull stripping** — isolates the brain as the largest central connected blob, erodes inward to remove the bright skull ring (critical: skull is often brighter than tumor tissue, so without this step Otsu thresholding picks up skull as false "tumor")
3. **Otsu's thresholding** — computed only on brain pixels (post skull-strip) to auto-select the brightness cutoff separating tumor from healthy tissue
4. **Morphological cleanup** — removes small noise blobs, keeps only the largest connected region (assumes one tumor per image)

**Classes covered:** glioma, meningioma, pituitary. `notumor` is intentionally skipped — nothing to segment.

**Known limitation (documented honestly, not hidden):** these are pseudo-masks, not expert-annotated ground truth. Accuracy varies by class:
- Pituitary: reasonably reliable (small, well-defined, consistent location)
- Meningioma: moderate reliability (near skull/lining, some risk of confusion with bone)
- Glioma: least reliable (diffuse, blurry boundaries — inherently hard even for thresholding-based methods, and for radiologists)

**Output:** `dataset/Masks/{Training,Testing}/{class}/*_mask.png`, plus `dataset/Masks_Preview/` — side-by-side (original | mask | overlay) images saved every 10th file for manual spot-checking before trusting the masks for training.

**Status:** generated successfully — 4,200 training masks + 1,200 testing masks. Preview images were spot-checked before proceeding.

---

## 6. Explainability — Grad-CAM

**Scripts:** `gradcam/gradcam.py`, `gradcam/find_misclassified.py`, `gradcam/find_layer.py`

**Target layer:** `top_conv` — the last convolutional layer in EfficientNetB3, right before pooling. Chosen because Grad-CAM needs spatial structure (still present in conv layers, lost after GlobalAveragePooling2D), and the last conv layer holds the most class-specific, high-level features.

**Method used:** standard Grad-CAM (single first-order gradient), **not** Grad-CAM++.

**Why not Grad-CAM++:** initially implemented Grad-CAM++ (triple-nested gradient tapes for higher-order weighting), but on a network this deep (EfficientNetB3, 260+ layers), the third-order gradients were numerically unstable — produced inverted/meaningless heatmaps (hot zones on black background corners instead of the tumor). Switched to standard Grad-CAM, which is far more numerically robust on deep backbones and gave correct, trustworthy localization.

**`find_misclassified.py`:** runs the trained model on the full test set, identifies every misclassified image, copies them into `gradcam_outputs/../misclassified_samples/<true>_as_<predicted>/` subfolders — lets us run Grad-CAM specifically on failure cases instead of random samples.

### Explainability findings (for report)

**Correct predictions:** heatmaps correctly localize on the visible tumor region, confirming the model learned genuine tumor-relevant features rather than spurious correlations.

**Glioma → Meningioma misclassifications:** heatmap still focuses correctly on the actual tumor region — the model is looking in the right place but choosing the wrong tumor type. This supports a genuine visual-similarity explanation (glioma and meningioma can look alike in certain slices) rather than a broken model.

**Glioma → No Tumor misclassifications:** mixed pattern. Some cases show the heatmap focused on non-tumor/background regions despite a visibly present tumor (a real weakness). Other cases show no obvious visible tumor in that specific 2D slice at all (a labeling/dataset limitation inherited from per-slice 2D extraction of a 3D tumor volume, not a model failure).

**`gradcam.py` supports two modes** (`RUN_ALL_CLASSES` flag):
- `True` (default): loops all 4 classes automatically, saves to `gradcam_outputs/<class>/`
- `False`: targets one specific folder via `TEST_IMAGES_DIR` (used for the misclassified-sample deep-dives above)

---

## 7. Segmentation — Attention U-Net (Next Step, Not Yet Run)

**Script:** `segmentation/train_unet.py`

**Architecture:** EfficientNetB3 encoder (same backbone family as the classifier, pretrained) + attention-gated decoder. Skip connections pulled from `stem_activation`, `block2a_expand_activation`, `block3a_expand_activation`, `block4a_expand_activation`; bottleneck from the final encoder output.

**Why Attention U-Net over plain U-Net:** attention gates let the decoder suppress irrelevant background regions and focus on tumor-relevant areas at each upsampling stage — generally improves Dice score by a few points over plain U-Net, particularly helpful given our masks are pseudo-generated (not expert-annotated) and therefore noisier than ideal.

**Input size:** 256×256 (matches `mask_generator.py`'s output — **note this differs from the classifier's 300×300**, these are independent models with independently chosen resolutions).

**Loss:** combined BCE + Dice loss (standard for segmentation, handles the class imbalance of "mostly background, small tumor region" better than BCE alone).

**Data pairing:** custom `SegmentationDataGenerator` (not the standard `ImageDataGenerator`) — needed to guarantee identical random augmentation (flips/rotation) is applied to both image and mask together; otherwise they'd desync.

**Model saving:** weights-only (`save_weights_only=True`), same pattern as the classification model's loading workaround — avoids the same `.h5` full-model deserialization bug preemptively.

**Expected outcome (realistic, for report framing):** Dice scores likely lower than literature benchmarks trained on expert-annotated data (e.g., BraTS-trained U-Nets hit 0.85–0.93 Dice) since our masks are pseudo-generated. Expect roughly: pituitary ~0.75–0.85, meningioma ~0.65–0.78, glioma ~0.55–0.70. This should be stated as a known, explained limitation in the report — not hidden.

**Status:** script written, not yet executed.

---

## 8. Known Issues Log (for team reference)

| Issue | Cause | Fix / Workaround |
|---|---|---|
| `python3` not recognized (Windows) | Windows only registers `python`, not `python3` | Use `python` everywhere on this project |
| `.py` scripts silently doing nothing | File saved as 0 bytes (copy-paste/save glitch in VS Code) | Always run `dir filename.py` to confirm byte count before running |
| `python`/`where`/`deactivate` "not recognized" after `venv\Scripts\activate` | venv activation not updating PATH correctly in some CMD sessions | Call venv Python directly: `..\venv\Scripts\python.exe script.py`, or use VS Code's integrated terminal |
| `load_model()` fails with `VarianceScaling` / `input_axes` TypeError | Keras 3.14.1 bug in legacy `.h5` config round-trip | Rebuild architecture in code + `model.load_weights()` instead of `load_model()` — see `build_model()` pattern in `gradcam.py` |
| Grad-CAM++ heatmaps inverted (hot on background, cold on tumor) | Numerical instability in triple-nested gradients on a 260+ layer network | Switched to standard (single-gradient) Grad-CAM |
| `python -c "multi-line code"` fails in Windows CMD | CMD doesn't parse multi-line quoted strings like bash | Save as a `.py` file and run `python file.py` instead |

---

## 9. What's Next

1. Run `train_unet.py`, evaluate Dice/IoU on test set
2. Post-processing script: convert segmentation mask → tumor size (mm²) using pixel spacing, bucket into Small/Medium/Large stage
3. Build FastAPI backend (`app/main.py`) wiring classification + Grad-CAM + segmentation + post-processing into one `/predict` endpoint
4. Connect Next.js frontend to the FastAPI endpoint
5. (Optional, time-permitting) Test-Time Augmentation or ensemble (EfficientNetB3 + Xception) to squeeze additional classification accuracy