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
│   ├── Training/                  # classification dataset (Kaggle Brain Tumor MRI)
│   │   ├── glioma/                # 1400 images
│   │   ├── meningioma/            # 1400 images
│   │   ├── notumor/               # 1400 images
│   │   └── pituitary/             # 1400 images
│   ├── Testing/
│   │   ├── glioma/                # 400 images
│   │   ├── meningioma/            # 400 images
│   │   ├── notumor/                # 400 images
│   │   └── pituitary/             # 400 images
│   ├── Masks/                     # pseudo-masks (Otsu-based, fallback approach, see Section 5)
│   │   ├── Training/{glioma, meningioma, pituitary}/
│   │   └── Testing/{glioma, meningioma, pituitary}/
│   ├── Masks_Preview/             # side-by-side preview images for spot-checking pseudo-masks
│   │   └── Training/{glioma, meningioma, pituitary}/
│   └── Segmentation/              # BRISC dataset - real annotated masks (used for actual training)
│       ├── Training/{images, masks}/
│       └── Testing/{images, masks}/
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
│   └── mask_generator.py          # generates pseudo-masks (fallback, not used for final training)
│
├── gradcam/
│   ├── gradcam.py                 # explainability visualizations (all classes or targeted folder)
│   ├── find_misclassified.py      # finds + copies out misclassified test images
│   ├── find_layer.py              # utility to inspect model layer names/indices
│   ├── misclassified_samples/     # generated: misclassified images grouped by error type
│   └── gradcam_outputs/           # generated: heatmap visualizations, organized per class
│
├── segmentation/
│   ├── train_unet.py              # Attention U-Net segmentation training (BRISC dataset)
│   ├── evaluate_unet.py           # standalone evaluation + sample predictions (no retraining)
│   ├── unet_training_log.csv      # generated
│   └── unet_eval_outputs/         # generated: sample prediction visualizations
│
├── postprocessing/
│   └── postprocess.py             # mask -> tumor size (mm^2) -> stage classification
│
├── app/
│   └── main.py                    # FastAPI backend - single /predict endpoint
│
└── models/
    ├── brain_tumor_efficientnetb3.h5        # trained classification model
    └── unet_segmentation.weights.h5          # trained segmentation model
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

## 7. Segmentation — Attention U-Net

**Script:** `segmentation/train_unet.py`, evaluated via `segmentation/evaluate_unet.py`

**Dataset switch (important decision):** initially planned to use pseudo-masks generated via Otsu thresholding (Section 5). After discussing realistic accuracy ceilings, switched to **BRISC** (`briscdataset/brisc2025` on Kaggle) — a real, expert/radiologist-annotated segmentation dataset covering all three tumor classes (glioma, meningioma, pituitary), derived from the same underlying source as our classification dataset. This was the single biggest factor in reaching strong segmentation accuracy — pseudo-masks were estimated to cap around 0.65–0.75 Dice; real masks got us to 0.86+.

**BRISC segmentation data structure:** flat `images/` + `masks/` folders (not per-class subfolders) — each image (e.g. `brisc2025_train_00001_gl_ax_t1.jpg`) has a matching mask with the identical filename but `.png` extension. 3,933 training pairs + 860 testing pairs, all verified 100% matched before training (`verify_brisc.py`).

**Architecture:** EfficientNetB3 encoder (same backbone family as the classifier, pretrained) + attention-gated decoder. Skip connections pulled from `stem_activation`, `block2a_expand_activation`, `block3a_expand_activation`, `block4a_expand_activation`; bottleneck from the final encoder output. Decoder blocks **dynamically resize skip connections to match** at runtime rather than assuming fixed resolutions — needed because actual EfficientNetB3 layer resolutions didn't match initial assumptions (caused a `Concatenate` shape-mismatch crash on first attempt; fixed with a `Resizing` layer).

**Why Attention U-Net over plain U-Net:** attention gates let the decoder suppress irrelevant background regions and focus on tumor-relevant areas at each upsampling stage.

**Input size:** 256×256 (independent of the classifier's 300×300 — these are separate models with independently chosen resolutions).

**Loss:** combined BCE + Dice loss.

**Data pairing:** custom `SegmentationDataGenerator` — guarantees identical random augmentation (flips/rotation) applied to both image and mask together.

**Training:** 40 max epochs, `EarlyStopping(patience=8)` — stopped automatically at epoch 19 (best validation performance was earlier; no improvement for 8 epochs after, so it correctly halted rather than overfitting further).

**Model saving:** weights-only (`save_weights_only=True`) — same `.h5` deserialization bug workaround as the classifier; loaded via `build_model() + load_weights()`, never `load_model()`.

### Results (on BRISC test set, 860 images)

```
dice_coefficient: 0.8633
iou_metric:       0.7856
loss:             0.1588
```

**Overall test Dice: 86.33%** — in line with published literature using expert-annotated brain tumor segmentation datasets (typically 0.85–0.93 Dice range).

**Per-sample spot check (8 random test images):** Dice ranged 0.626–0.969, with most samples in the 0.83–0.97 range. One outlier (0.626) worth a one-line mention in the report as a case with likely small/ambiguous tumor boundary — not indicative of a systemic issue given the rest of the sample.

**Note on Keras 3 evaluation quirk:** `model.evaluate()`'s `metrics_names` didn't reliably map to result values in this Keras version (collapsed custom metrics into a generic `compile_metrics` key). Fixed by using `model.evaluate(..., return_dict=True)` instead, which reliably returns properly-labeled metric names.

**Note on pseudo-mask pipeline (Section 5):** kept in the codebase as a documented fallback/comparison, not deleted — shows both approaches were tried, and explains *why* BRISC was ultimately chosen.

---

## 7a. Post-Processing — Mask → Tumor Size → Stage

**Script:** `postprocessing/postprocess.py`

**Pipeline:** takes the raw sigmoid mask output from U-Net → cleans it (morphological open/close, keeps only the largest connected blob, discards small noise) → converts pixel count to real-world area (mm²) → buckets into Small/Medium/Large stage → also returns a bounding box for frontend overlay use.

**Important, honestly-documented limitation:** our source images are plain `.jpg`/`.png`, not DICOM, so there's no real per-patient pixel spacing metadata available. We use an **assumed** pixel spacing derived from a typical brain MRI field-of-view (~240mm) divided by our fixed 256px resolution. This gives a defensible **approximation** of real-world tumor size, not a clinically precise measurement — stated explicitly wherever size is reported, both in code comments and in this document.

**Stage thresholds** (Small: 0–500mm², Medium: 500–1500mm², Large: 1500mm²+) are simplified, rule-based cutoffs for demonstration purposes, not a clinical staging standard — easy to adjust/defend if questioned.

---

## 7b. FastAPI Backend

**Script:** `app/main.py`

**Endpoint:** `POST /predict` — accepts an uploaded MRI image (multipart/form-data), runs the full pipeline, returns one JSON response.

**Pipeline logic:**
1. Classification runs first, always.
2. If predicted class is `notumor` → returns immediately (tumor_detected: false), skipping Grad-CAM and segmentation entirely — saves compute, matches the efficiency plan discussed early in the project.
3. If a tumor is detected → runs Grad-CAM (explainability heatmap), segmentation (U-Net), and post-processing (size + stage) — all in the same request, response includes base64-encoded overlay images ready for the Next.js frontend to render directly.

**Design notes:**
- Both models load **once at server startup**, not per-request (loading a model per request would be extremely slow).
- CORS enabled for local Next.js dev server; `allow_origins` should be tightened to the actual deployed frontend URL before production.
- Uses the same `build_model() + load_weights()` pattern established for both classifier and segmentation model — consistent, proven workaround for the Keras `.h5` loading bug across the whole backend.

**Status:** ✅ Server starts successfully — both models (classification + segmentation) load correctly in the same process via the `build_model() + load_weights()` pattern, no conflicts between them. Confirmed via `/health` endpoint and startup logs:
```
Loading classification model...
Classification model ready.
Loading segmentation model...
Segmentation model ready.
Application startup complete.
```
`/predict` endpoint tested manually via curl with a real MRI image — full pipeline (classification → Grad-CAM → segmentation → post-processing) confirmed working end-to-end in a single request.

**Backend status: core pipeline complete.** Remaining work going forward is frontend integration (Next.js), not backend logic.

---

## 7c. Model Hosting — Hugging Face

Trained model files exceed GitHub's 100MB file size limit (classification model alone is well over this), so both trained models are hosted on Hugging Face instead of being committed to the repo directly.

- **Classification model (`brain_tumor_efficientnetb3.h5`):** [ADD HUGGING FACE URL HERE]
- **Segmentation model (`unet_segmentation.weights.h5`):** [ADD HUGGING FACE URL HERE — pending upload]

Both URLs are also listed in `python-backend/README.md`. Anyone setting up this project locally needs to download these two files from Hugging Face and place them at:
```
python-backend/models/brain_tumor_efficientnetb3.h5
python-backend/models/unet_segmentation.weights.h5
```
before running `app/main.py` — the FastAPI server will fail to start without them (both are loaded at startup, not lazily).

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
| `Concatenate` shape mismatch in U-Net decoder | Assumed EfficientNetB3 skip-layer resolutions were wrong for this Keras version | Dynamically resize skip connections to match at runtime (`tf.keras.layers.Resizing`) instead of assuming fixed resolutions |
| `model.evaluate()` metrics not matching `metrics_names` (Keras 3) | Custom metrics collapsed into a generic `compile_metrics` key | Use `model.evaluate(..., return_dict=True)` instead |
| Training script printed old pseudo-mask pair count instead of BRISC count | Local file wasn't actually updated (same 0-byte/stale-save issue as elsewhere) | Always verify file content/size after saving before running |

---

## 9. What's Next

Backend is functionally complete. Remaining work:

1. ~~Run `train_unet.py`, evaluate Dice/IoU on test set~~ ✅ Done — 86.33% Dice on BRISC test set
2. ~~Post-processing script: mask → tumor size (mm²) → stage~~ ✅ Done — `postprocessing/postprocess.py`
3. ~~Build FastAPI backend wiring everything into one `/predict` endpoint~~ ✅ Done — `app/main.py`
4. ~~Load-test `app/main.py` end-to-end~~ ✅ Done — server starts, `/health` and `/predict` both confirmed working
5. Upload segmentation model weights to Hugging Face (classification model already uploaded — see Section 7c), add URL to this doc and `README.md`
6. Connect Next.js frontend to the FastAPI endpoint (frontend already built — this is the remaining integration work)
7. (Optional, time-permitting) Test-Time Augmentation or ensemble (EfficientNetB3 + Xception) to squeeze additional classification accuracy
8. (Optional, before any real deployment) Tighten CORS `allow_origins` in `main.py` from `["*"]` to the actual frontend URL