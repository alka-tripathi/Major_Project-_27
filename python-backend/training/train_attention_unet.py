"""
===========================================================
Train Attention U-Net for Brain Tumor Segmentation
===========================================================

Purpose:
--------
This script trains the Attention U-Net model
using the MRI segmentation dataset.
===========================================================
"""

import os
import sys

from sklearn.model_selection import train_test_split

from tensorflow.keras.callbacks import (
    ModelCheckpoint,
    EarlyStopping,
    ReduceLROnPlateau
)

# ---------------------------------------------------------
# Add Project Paths
# ---------------------------------------------------------

CURRENT_DIR = os.path.dirname(__file__)

sys.path.append(CURRENT_DIR)
sys.path.append(os.path.join(CURRENT_DIR, "..", "models"))

# ---------------------------------------------------------
# Import Custom Files
# ---------------------------------------------------------

from data_loader import load_segmentation_dataset
from attention_unet import build_attention_unet

# ---------------------------------------------------------
# Dataset Path
# ---------------------------------------------------------

DATASET_PATH = "../dataset/Segmentation/kaggle_3m"

print("=" * 60)
print("Loading Segmentation Dataset...")
print("=" * 60)

# ---------------------------------------------------------
# Load Dataset
# ---------------------------------------------------------

X, Y = load_segmentation_dataset(DATASET_PATH)

print("\nDataset Loaded Successfully!")

print(f"\nImages Shape : {X.shape}")
print(f"Masks Shape  : {Y.shape}")

# ---------------------------------------------------------
# Train Test Split
# ---------------------------------------------------------

X_train, X_val, Y_train, Y_val = train_test_split(
    X,
    Y,
    test_size=0.20,
    random_state=42
)

print("\nTraining Images :", X_train.shape)
print("Validation Images :", X_val.shape)

# ---------------------------------------------------------
# Build Model
# ---------------------------------------------------------

print("\nBuilding Attention U-Net...\n")

model = build_attention_unet(
    input_shape=(256, 256, 3)
)

# ---------------------------------------------------------
# Compile Model
# ---------------------------------------------------------

model.compile(

    optimizer="adam",

    loss="binary_crossentropy",

    metrics=["accuracy"]

)

# Show Model Summary
model.summary()

# ---------------------------------------------------------
# Create Folder for Saved Models
# ---------------------------------------------------------

os.makedirs("../saved_models", exist_ok=True)

# ---------------------------------------------------------
# Callbacks
# ---------------------------------------------------------

checkpoint = ModelCheckpoint(

    filepath="../saved_models/attention_unet_best.keras",

    monitor="val_loss",

    save_best_only=True,

    verbose=1

)

early_stop = EarlyStopping(

    monitor="val_loss",

    patience=5,

    restore_best_weights=True,

    verbose=1

)

reduce_lr = ReduceLROnPlateau(

    monitor="val_loss",

    factor=0.1,

    patience=3,

    verbose=1

)

# ---------------------------------------------------------
# Train Model
# ---------------------------------------------------------

print("\nStarting Training...\n")

history = model.fit(

    X_train,

    Y_train,

    validation_data=(X_val, Y_val),

    epochs=20,

    batch_size=4,

    callbacks=[

        checkpoint,

        early_stop,

        reduce_lr

    ]

)

# ---------------------------------------------------------
# Save Final Model
# ---------------------------------------------------------

model.save("../saved_models/attention_unet_final.keras")

print("\n" + "=" * 60)
print("Training Completed Successfully!")
print("Model Saved Successfully!")
print("=" * 60)