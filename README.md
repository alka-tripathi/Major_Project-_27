## Model Weights

Trained model files are too large for GitHub (>100MB) and are hosted on Hugging Face instead. The `models/` folder is empty by default in this repo — you must download the files below before running the app.

| Model | File | Download |
|---|---|---|
| Classification (EfficientNetB3) | `brain_tumor_efficientnetb3.h5` | https://huggingface.co/tripathialka/brain-tumor-efficientnetb3 |
| Segmentation (Attention U-Net) | `unet_segmentation.weights.h5` | https://huggingface.co/tripathialka/brain-tumor-attentionUnet |

### Setup

1. Download both files from the links above.
2. Place them here, with these **exact filenames**:
```
python-backend/models/brain_tumor_efficientnetb3.h5
python-backend/models/unet_segmentation.weights.h5
```
3. Do not rename or convert the files — the app expects `.h5` files loaded via `load_weights()`, not the native `.keras` format.

Once both files are in place, `app/main.py` will load them automatically on server startup.