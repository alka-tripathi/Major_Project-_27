"""
Grad-CAM++ Visualization for Brain Tumor Classification Model
================================================================
Loads the trained EfficientNetB3 model and generates Grad-CAM++ heatmaps
showing which region of the MRI image influenced the classification decision.

Targets the 'top_conv' layer (last convolutional layer before pooling) —
this is the layer with the richest class-specific spatial features.

Run this from inside python-backend/gradcam/, e.g.:
    python gradcam.py
"""

import os
import numpy as np
import tensorflow as tf
import cv2
import matplotlib.pyplot as plt
from tensorflow.keras.applications import EfficientNetB3
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout, BatchNormalization
from tensorflow.keras.models import Model


# ----------------------------------------------------------------------------
# WHY WE REBUILD THE MODEL INSTEAD OF USING load_model()
# ----------------------------------------------------------------------------
# The saved .h5 file's config includes fields (input_axes/output_axes on
# VarianceScaling) that this Keras version's deserializer rejects. This is a
# genuine bug in how Keras 3.14.1 round-trips the legacy HDF5 format, and
# monkey-patching the initializer class did not resolve it (the deserializer
# looks it up through an internal registry path that bypasses direct class
# patches). The reliable fix: reconstruct the exact same architecture used
# during training in code, then load ONLY the weights (not the config/layer
# definitions) via load_weights(). Loading weights matches tensors by layer
# name/order and never touches the broken initializer config path at all.
def build_model():
    base_model = EfficientNetB3(
        include_top=False,
        weights=None,   # weights will come from our saved file, not ImageNet
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        pooling=None,
    )
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = BatchNormalization()(x)
    x = Dropout(0.4)(x)
    x = Dense(256, activation="relu")(x)
    x = Dropout(0.3)(x)
    outputs = Dense(len(CLASS_NAMES), activation="softmax")(x)
    return Model(inputs=base_model.input, outputs=outputs)

# ----------------------------------------------------------------------------
# CONFIG
# ----------------------------------------------------------------------------
MODEL_PATH = "../models/brain_tumor_efficientnetb3.h5"
IMG_SIZE = 300
LAST_CONV_LAYER_NAME = "top_conv"   # last conv layer in EfficientNetB3, before GAP
CLASS_NAMES = ["glioma", "meningioma", "notumor", "pituitary"]  # must match training order (alphabetical)

# Folder of test images to run Grad-CAM on
# Set RUN_ALL_CLASSES = True to process every class automatically into its own
# subfolder (e.g. gradcam_outputs/glioma/, gradcam_outputs/notumor/, etc.)
# Set RUN_ALL_CLASSES = False to run on just one specific folder instead
# (e.g. a misclassified_samples subfolder) using TEST_IMAGES_DIR below.
RUN_ALL_CLASSES = True

TEST_DATASET_ROOT = "../dataset/Testing"        # used when RUN_ALL_CLASSES = True
TEST_IMAGES_DIR = "../dataset/Testing/glioma"   # used when RUN_ALL_CLASSES = False
OUTPUT_DIR = "gradcam_outputs"
NUM_SAMPLES = 10   # how many images per folder to process


# ----------------------------------------------------------------------------
# STEP 1: Load and preprocess an image
# ----------------------------------------------------------------------------
def load_and_preprocess_image(img_path):
    img = tf.keras.utils.load_img(img_path, target_size=(IMG_SIZE, IMG_SIZE))
    img_array = tf.keras.utils.img_to_array(img)
    img_array_expanded = np.expand_dims(img_array, axis=0)
    preprocessed = preprocess_input(img_array_expanded.copy())
    return img_array, preprocessed   # raw (for display) + preprocessed (for model input)


# ----------------------------------------------------------------------------
# STEP 2: Grad-CAM++ heatmap generation
# ----------------------------------------------------------------------------
def make_gradcam_heatmap(img_array, model, last_conv_layer_name, pred_index=None):
    """
    Generates a standard Grad-CAM heatmap (single first-order gradient).

    NOTE: Grad-CAM++ (triple-nested gradients) was tried first, but on a network
    this deep (EfficientNetB3, 260+ layers), third-order gradients became
    numerically unstable and produced inverted/meaningless heatmaps (hot zones
    on background instead of the tumor). Standard Grad-CAM is far more robust
    for deep backbones and still gives reliable, trustworthy localization.
    """
    grad_model = tf.keras.models.Model(
        inputs=model.inputs,
        outputs=[model.get_layer(last_conv_layer_name).output, model.output]
    )

    with tf.GradientTape() as tape:
        conv_output, predictions = grad_model(img_array)
        if pred_index is None:
            pred_index = tf.argmax(predictions[0])
        class_channel = predictions[:, pred_index]

    grads = tape.gradient(class_channel, conv_output)

    # Global average pool the gradients -> importance weight per channel
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    conv_output = conv_output[0]
    heatmap = conv_output @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)

    heatmap = tf.nn.relu(heatmap)   # only keep positive contributions

    # Normalize to 0-1 using max (with small epsilon to avoid divide-by-zero)
    max_val = tf.math.reduce_max(heatmap)
    max_val = max_val if max_val != 0 else 1e-8
    heatmap = heatmap / max_val

    return heatmap.numpy(), int(pred_index), predictions.numpy()[0]


# ----------------------------------------------------------------------------
# STEP 3: Overlay heatmap on original image
# ----------------------------------------------------------------------------
def overlay_heatmap(raw_img, heatmap, alpha=0.45):
    heatmap_resized = cv2.resize(heatmap, (raw_img.shape[1], raw_img.shape[0]))
    heatmap_uint8 = np.uint8(255 * heatmap_resized)
    heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

    raw_img_uint8 = np.uint8(raw_img)
    overlayed = cv2.addWeighted(raw_img_uint8, 1 - alpha, heatmap_colored, alpha, 0)
    return overlayed, heatmap_colored


# ----------------------------------------------------------------------------
# STEP 4: Process one folder of images, save into its own output subfolder
# ----------------------------------------------------------------------------
def process_folder(model, images_dir, output_subdir, num_samples):
    os.makedirs(output_subdir, exist_ok=True)

    if not os.path.exists(images_dir):
        print(f"[SKIP] {images_dir} not found")
        return

    image_files = sorted([
        f for f in os.listdir(images_dir)
        if f.lower().endswith((".jpg", ".jpeg", ".png"))
    ])[:num_samples]

    if not image_files:
        print(f"No images found in {images_dir}")
        return

    for fname in image_files:
        img_path = os.path.join(images_dir, fname)
        raw_img, preprocessed_img = load_and_preprocess_image(img_path)

        heatmap, pred_index, pred_probs = make_gradcam_heatmap(
            preprocessed_img, model, LAST_CONV_LAYER_NAME
        )

        overlayed, heatmap_colored = overlay_heatmap(raw_img, heatmap)

        pred_class = CLASS_NAMES[pred_index]
        confidence = pred_probs[pred_index]

        fig, axes = plt.subplots(1, 3, figsize=(12, 4))
        axes[0].imshow(raw_img.astype("uint8"))
        axes[0].set_title("Original MRI")
        axes[0].axis("off")

        axes[1].imshow(heatmap_colored)
        axes[1].set_title("Grad-CAM Heatmap")
        axes[1].axis("off")

        axes[2].imshow(overlayed)
        axes[2].set_title(f"Overlay\nPred: {pred_class} ({confidence:.2%})")
        axes[2].axis("off")

        plt.tight_layout()
        out_path = os.path.join(output_subdir, f"gradcam_{fname}")
        plt.savefig(out_path, dpi=150)
        plt.close()

        print(f"  {fname} -> predicted: {pred_class} ({confidence:.2%})")

    print(f"  Saved {len(image_files)} visualizations to '{output_subdir}/'")


# ----------------------------------------------------------------------------
# STEP 5: Main entry point
# ----------------------------------------------------------------------------
def run_gradcam():
    print(f"Building model architecture and loading weights from {MODEL_PATH} ...")
    model = build_model()
    model.load_weights(MODEL_PATH)
    print("Model loaded.\n")

    if RUN_ALL_CLASSES:
        for cls in CLASS_NAMES:
            print(f"Processing class: {cls}")
            images_dir = os.path.join(TEST_DATASET_ROOT, cls)
            output_subdir = os.path.join(OUTPUT_DIR, cls)
            process_folder(model, images_dir, output_subdir, NUM_SAMPLES)
        print(f"\nDone. Outputs organized under '{OUTPUT_DIR}/<class_name>/'")
    else:
        print(f"Processing folder: {TEST_IMAGES_DIR}")
        process_folder(model, TEST_IMAGES_DIR, OUTPUT_DIR, NUM_SAMPLES)
        print(f"\nDone. Outputs saved to '{OUTPUT_DIR}/'")


if __name__ == "__main__":
    run_gradcam()