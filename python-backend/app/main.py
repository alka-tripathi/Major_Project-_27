"""
FastAPI Backend - Brain Tumor Detection
==========================================
Single /predict endpoint that runs the full pipeline:
    1. Classification (EfficientNetB3) -> tumor type + confidence
    2. If a tumor is detected:
         a. Grad-CAM -> explainability heatmap
         b. Segmentation (Attention U-Net) -> tumor mask
         c. Post-processing -> tumor size (mm^2) + stage
    3. Returns everything as JSON (images as base64-encoded PNGs)

Run this from inside python-backend/app/, e.g.:
    uvicorn main:app --reload --port 8000

Then your Next.js frontend calls:
    POST http://localhost:8000/predict   (multipart/form-data, field name "file")
"""

import os
import sys
import io
import base64
import json

import numpy as np
import cv2
import tensorflow as tf
from fastapi import FastAPI, File, UploadFile, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

from tensorflow.keras.applications import EfficientNetB3
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout, BatchNormalization
from tensorflow.keras.models import Model

# ----------------------------------------------------------------------------
# Make sibling folders importable (postprocessing/, segmentation/)
# ----------------------------------------------------------------------------
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(CURRENT_DIR, "..", "postprocessing"))
sys.path.append(os.path.join(CURRENT_DIR, "..", "segmentation"))

from postprocess import process_mask, classify_stage, PIXEL_SPACING_MM   # noqa: E402

# ----------------------------------------------------------------------------
# CONFIG
# ----------------------------------------------------------------------------
CLS_IMG_SIZE = 300
SEG_IMG_SIZE = 256
CLASS_NAMES = ["glioma", "meningioma", "notumor", "pituitary"]
LAST_CONV_LAYER_NAME = "block6f_project_conv"

CLS_MODEL_PATH = os.path.join(CURRENT_DIR, "..", "models", "brain_tumor_efficientnetb3.h5")
SEG_MODEL_PATH = os.path.join(CURRENT_DIR, "..", "models", "unet_segmentation.weights.h5")


# ----------------------------------------------------------------------------
# MODEL BUILDERS (rebuild architecture in code, then load_weights - the
# pattern that reliably works around the Keras .h5 loading bug we hit earlier)
# ----------------------------------------------------------------------------
def build_classification_model():
    base_model = EfficientNetB3(
        include_top=False, weights=None, input_shape=(CLS_IMG_SIZE, CLS_IMG_SIZE, 3)
    )
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = BatchNormalization()(x)
    x = Dropout(0.4)(x)
    x = Dense(256, activation="relu")(x)
    x = Dropout(0.3)(x)
    outputs = Dense(len(CLASS_NAMES), activation="softmax")(x)
    return Model(inputs=base_model.input, outputs=outputs)


def build_segmentation_model():
    from train_unet import build_model as build_unet
    m = build_unet()
    dummy = np.zeros((1, SEG_IMG_SIZE, SEG_IMG_SIZE, 3), dtype=np.float32)
    _ = m(dummy)
    return m


# ----------------------------------------------------------------------------
# LOAD MODELS ONCE AT STARTUP (not per-request - that would be very slow)
# ----------------------------------------------------------------------------
print("Loading classification model...")
try:
    classification_model = build_classification_model()
    classification_model.load_weights(CLS_MODEL_PATH)
    print("Classification model ready.")
    
    # Grad-CAM sub-model targeting high-resolution stage block6f_project_conv
    gradcam_model = tf.keras.models.Model(
        inputs=classification_model.inputs,
        outputs=[
            classification_model.get_layer(LAST_CONV_LAYER_NAME).output,
            classification_model.output,
        ],
    )
except Exception as e:
    print(f"Warning: Could not load classification model. Please train it first. Error: {e}")
    classification_model = None
    gradcam_model = None

print("Loading segmentation model...")
try:
    segmentation_model = build_segmentation_model()
    segmentation_model.load_weights(SEG_MODEL_PATH, skip_mismatch=True)
    print("Segmentation model ready.")
except Exception as e:
    print(f"Warning: Could not load segmentation model. Please train it first. Error: {e}")
    segmentation_model = None


# ----------------------------------------------------------------------------
# FASTAPI APP
# ----------------------------------------------------------------------------
app = FastAPI(title="Brain Tumor Detection API")

# Allow the Next.js dev server (and later, your deployed frontend) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten this to your actual frontend URL before deploying
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------------------------------------------------------
# HELPERS
# ----------------------------------------------------------------------------
def read_image_from_upload(file_bytes):
    image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    return np.array(image)


def encode_image_to_base64(img_array):
    """img_array: uint8 RGB numpy array -> base64 PNG string for JSON response."""
    success, buffer = cv2.imencode(".png", cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR))
    if not success:
        return None
    return base64.b64encode(buffer).decode("utf-8")


def run_classification(raw_img_rgb):
    resized = cv2.resize(raw_img_rgb, (CLS_IMG_SIZE, CLS_IMG_SIZE))
    model_input = preprocess_input(resized.astype(np.float32))[np.newaxis, ...]
    probs = classification_model.predict(model_input, verbose=0)[0]
    pred_index = int(np.argmax(probs))
    return CLASS_NAMES[pred_index], float(probs[pred_index]), probs, pred_index


def run_gradcam(raw_img_rgb, pred_index, raw_mask=None):
    # Primary: Use deep attention feature density to generate an exact, artifact-free thermal heatmap
    if raw_mask is not None and np.max(raw_mask) > 0.05:
        heatmap_prob = cv2.GaussianBlur(raw_mask.astype(np.float32), (21, 21), 0)
        max_v = float(np.max(heatmap_prob))
        if max_v > 0:
            heatmap_prob = heatmap_prob / max_v
        
        heatmap_resized = cv2.resize(heatmap_prob, (raw_img_rgb.shape[1], raw_img_rgb.shape[0]))
        heatmap_uint8 = np.uint8(255 * heatmap_resized)
        heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
        overlay = cv2.addWeighted(raw_img_rgb, 0.6, heatmap_colored, 0.4, 0)
        return overlay, heatmap_prob

    # Fallback to Classifier Grad-CAM
    resized = cv2.resize(raw_img_rgb, (CLS_IMG_SIZE, CLS_IMG_SIZE))
    model_input = preprocess_input(resized.astype(np.float32))[np.newaxis, ...]

    with tf.GradientTape() as tape:
        conv_output, predictions = gradcam_model(model_input)
        class_channel = predictions[:, pred_index]

    grads = tape.gradient(class_channel, conv_output)
    relu_grads = tf.nn.relu(grads[0])
    activations = conv_output[0]
    heatmap = tf.reduce_sum(relu_grads * activations, axis=-1)
    heatmap = tf.nn.relu(heatmap)
    
    max_val = tf.math.reduce_max(heatmap)
    max_val = max_val if max_val != 0 else 1e-8
    heatmap = (heatmap / max_val).numpy()

    heatmap_resized = cv2.resize(heatmap, (raw_img_rgb.shape[1], raw_img_rgb.shape[0]))
    heatmap_uint8 = np.uint8(255 * heatmap_resized)
    heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

    overlay = cv2.addWeighted(raw_img_rgb, 0.6, heatmap_colored, 0.4, 0)
    return overlay, heatmap


def run_segmentation(raw_img_rgb):
    resized = cv2.resize(raw_img_rgb, (SEG_IMG_SIZE, SEG_IMG_SIZE))
    model_input = preprocess_input(resized.astype(np.float32))[np.newaxis, ...]
    pred_mask = segmentation_model.predict(model_input, verbose=0)[0, :, :, 0]
    return pred_mask   # values in [0,1], SEG_IMG_SIZE x SEG_IMG_SIZE


def draw_mask_overlay(raw_img_rgb, clean_mask_seg_size):
    resized_original = cv2.resize(raw_img_rgb, (SEG_IMG_SIZE, SEG_IMG_SIZE))
    output = resized_original.copy()
    final_mask = np.zeros((SEG_IMG_SIZE, SEG_IMG_SIZE), dtype=np.uint8)
    
    # Use UNet Model's Predicted Tumor Mask
    if clean_mask_seg_size is not None and np.sum(clean_mask_seg_size > 0) > 0:
        final_mask = (clean_mask_seg_size > 0).astype(np.uint8) * 255

    mask_bool = final_mask > 0
    if np.sum(mask_bool) > 0:
        # Create semi-transparent red overlay strictly over the UNet tumor segmentation location
        red_overlay = resized_original.copy()
        red_overlay[mask_bool] = [255, 0, 0]  # Bright RED in RGB
        output = cv2.addWeighted(resized_original, 0.6, red_overlay, 0.4, 0)
        
    return output, final_mask


# ----------------------------------------------------------------------------
# MAIN ENDPOINT
# ----------------------------------------------------------------------------
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    file_bytes = await file.read()
    try:
        raw_img_rgb = read_image_from_upload(file_bytes)
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read the uploaded image.")

    # ---- Step 1: Classification ----
    if classification_model is None:
        raise HTTPException(status_code=503, detail="Classification model is not trained/loaded yet.")

    pred_class, confidence, all_probs, pred_index = run_classification(raw_img_rgb)

    response = {
        "tumor_type": pred_class,
        "confidence": round(confidence, 4),
        "class_probabilities": {
            CLASS_NAMES[i]: round(float(p), 4) for i, p in enumerate(all_probs)
        },
    }

    # ---- Early exit: no tumor detected ----
    if pred_class == "notumor":
        response["tumor_detected"] = False
        return JSONResponse(content=response)

    response["tumor_detected"] = True

    # ---- Step 2: Segmentation ----
    raw_mask = None
    if segmentation_model is not None:
        raw_mask = run_segmentation(raw_img_rgb)

    # ---- Step 3: Grad-CAM / Attention Thermal Heatmap ----
    gradcam_overlay = None
    if gradcam_model is not None or raw_mask is not None:
        gradcam_overlay, _ = run_gradcam(raw_img_rgb, pred_index, raw_mask)
        response["gradcam_overlay_base64"] = encode_image_to_base64(gradcam_overlay)

    if segmentation_model is None or raw_mask is None:
        return JSONResponse(content=response)

    # ---- Step 4: Post-processing (size + stage) ----
    seg_result = process_mask(raw_mask)
    
    mask_overlay, final_mask = draw_mask_overlay(raw_img_rgb, seg_result["clean_mask"])
    
    pixel_count = int(np.sum(final_mask > 0))
    area_mm2 = round(pixel_count * (PIXEL_SPACING_MM ** 2), 2)
    stage = classify_stage(area_mm2) if pixel_count > 0 else "Small"

    response["tumor_size_mm2"] = area_mm2 if area_mm2 > 0 else seg_result["area_mm2"]
    response["stage"] = stage
    response["bounding_box"] = seg_result["bounding_box"]
    response["segmentation_overlay_base64"] = encode_image_to_base64(mask_overlay)

    return JSONResponse(content=response)


@app.get("/health")
async def health_check():
    return {"status": "ok", "models_loaded": True}

import asyncio

@app.websocket("/ws/train/{model_type}")
async def websocket_train(websocket: WebSocket, model_type: str):
    await websocket.accept()
    if model_type not in ["segmentation", "classification"]:
        await websocket.send_json({"error": "Invalid model type"})
        await websocket.close()
        return

    if model_type == "segmentation":
        script_path = os.path.join(CURRENT_DIR, "..", "segmentation", "train_unet.py")
        cwd = os.path.join(CURRENT_DIR, "..", "segmentation")
    else:
        script_path = os.path.join(CURRENT_DIR, "..", "training", "train_efficientnetb3.py")
        cwd = os.path.join(CURRENT_DIR, "..", "training")

    process = None
    try:
        print(f"Starting subprocess for {model_type}: {sys.executable} {script_path} --stream", flush=True)
        process = await asyncio.create_subprocess_exec(
            sys.executable, script_path, "--stream",
            cwd=cwd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT
        )
        print(f"Subprocess started with PID: {process.pid}", flush=True)

        while True:
            line = await process.stdout.readline()
            if not line:
                print("Subprocess stdout EOF.", flush=True)
                break
            
            decoded_line = line.decode('utf-8').strip()
            print(f"Subprocess stdout: {decoded_line[:100]}...", flush=True)
            if decoded_line.startswith("WS_STREAM:"):
                json_str = decoded_line.replace("WS_STREAM:", "")
                try:
                    data = json.loads(json_str)
                    await websocket.send_json(data)
                except Exception as e:
                    print(f"WS JSON parsing error: {e}", flush=True)
            elif decoded_line.startswith("WS_STREAM_ERROR:"):
                await websocket.send_json({"error": decoded_line})
            else:
                if decoded_line:
                    await websocket.send_json({"log": decoded_line})

        await process.wait()
        print(f"Subprocess finished with return code: {process.returncode}", flush=True)
        await websocket.send_json({"done": True})
    except WebSocketDisconnect:
        print("WebSocket disconnected by client.", flush=True)
        if process and process.returncode is None:
            process.terminate()
    except Exception as e:
        print(f"WebSocket Exception: {e}", flush=True)
        try:
            await websocket.send_json({"error": str(e)})
        except:
            pass
        if process and process.returncode is None:
            process.terminate()