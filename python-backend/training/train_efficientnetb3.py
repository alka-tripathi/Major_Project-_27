"""
Brain Tumor Classification - EfficientNetB3 (Transfer Learning)
==================================================================
4-class classification: Glioma, Meningioma, Pituitary, No Tumor

Expected dataset folder structure:
    dataset/
        Training/
            glioma/
            meningioma/
            pituitary/
            notumor/
        Testing/
            glioma/
            meningioma/
            pituitary/
            notumor/

(This matches the standard Kaggle "Brain Tumor MRI Dataset" layout.
 If yours differs, just point TRAIN_DIR / TEST_DIR below to the right folders.)
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB3
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.layers import (
    GlobalAveragePooling2D, Dense, Dropout, BatchNormalization
)
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import (
    ModelCheckpoint, EarlyStopping, ReduceLROnPlateau, CSVLogger
)
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.utils.class_weight import compute_class_weight
import matplotlib.pyplot as plt

# ----------------------------------------------------------------------------
# 1. CONFIG
# ----------------------------------------------------------------------------
IMG_SIZE = 300          # EfficientNetB3's native input resolution
BATCH_SIZE = 16         # lower if you hit GPU memory issues, raise if you have headroom
NUM_CLASSES = 4
CLASS_NAMES = ["glioma", "meningioma", "notumor", "pituitary"]  # alphabetical (Keras default)

TRAIN_DIR = "../dataset/Training"
TEST_DIR = "../dataset/Testing"

STAGE1_EPOCHS = 12      # train head only (frozen base)
STAGE2_EPOCHS = 25      # fine-tune unfrozen top layers
STAGE1_LR = 1e-3
STAGE2_LR = 1e-5

MODEL_OUT = "../models/brain_tumor_efficientnetb3.h5"

# ----------------------------------------------------------------------------
# 2. DATA PIPELINE
# ----------------------------------------------------------------------------
# EfficientNet's preprocess_input handles scaling internally -> don't also do rescale=1/255
train_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    rotation_range=20,
    width_shift_range=0.1,
    height_shift_range=0.1,
    zoom_range=0.15,
    horizontal_flip=True,
    brightness_range=[0.85, 1.15],
    validation_split=0.15,   # carve validation set out of training data
)

test_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)

train_gen = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    subset="training",
    shuffle=True,
    seed=42,
)

val_gen = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    subset="validation",
    shuffle=False,
    seed=42,
)

test_gen = test_datagen.flow_from_directory(
    TEST_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    shuffle=False,
)

print("Class indices:", train_gen.class_indices)

# ----------------------------------------------------------------------------
# 3. HANDLE CLASS IMBALANCE (common in medical datasets)
# ----------------------------------------------------------------------------
labels = train_gen.classes
class_weights = compute_class_weight(
    class_weight="balanced",
    classes=np.unique(labels),
    y=labels,
)
class_weight_dict = dict(enumerate(class_weights))
print("Class weights:", class_weight_dict)

# ----------------------------------------------------------------------------
# 4. BUILD MODEL — EfficientNetB3 backbone + custom classification head
# ----------------------------------------------------------------------------
base_model = EfficientNetB3(
    include_top=False,
    weights="imagenet",
    input_shape=(IMG_SIZE, IMG_SIZE, 3),
    pooling=None,
)
base_model.trainable = False  # freeze for stage 1

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = BatchNormalization()(x)
x = Dropout(0.4)(x)
x = Dense(256, activation="relu")(x)
x = Dropout(0.3)(x)
outputs = Dense(NUM_CLASSES, activation="softmax")(x)

model = Model(inputs=base_model.input, outputs=outputs)

model.summary()

# ----------------------------------------------------------------------------
# 5. STAGE 1 — Train the new head only (backbone frozen)
# ----------------------------------------------------------------------------
model.compile(
    optimizer=Adam(learning_rate=STAGE1_LR),
    loss="categorical_crossentropy",
    metrics=["accuracy", tf.keras.metrics.AUC(name="auc")],
)

callbacks_stage1 = [
    ModelCheckpoint("stage1_best.h5", monitor="val_accuracy", save_best_only=True, mode="max"),
    EarlyStopping(monitor="val_loss", patience=4, restore_best_weights=True),
    ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2, min_lr=1e-7),
    CSVLogger("stage1_log.csv"),
]

history1 = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=STAGE1_EPOCHS,
    class_weight=class_weight_dict,
    callbacks=callbacks_stage1,
)

# ----------------------------------------------------------------------------
# 6. STAGE 2 — Fine-tune: unfreeze last ~30% of base model layers
# ----------------------------------------------------------------------------
base_model.trainable = True

fine_tune_at = int(len(base_model.layers) * 0.7)  # freeze first 70%, unfreeze last 30%
for layer in base_model.layers[:fine_tune_at]:
    layer.trainable = False

# Keep BatchNorm layers frozen even in the unfrozen section — standard practice,
# prevents BN statistics from being wrecked by the small medical-image batch size
for layer in base_model.layers[fine_tune_at:]:
    if isinstance(layer, BatchNormalization):
        layer.trainable = False

model.compile(
    optimizer=Adam(learning_rate=STAGE2_LR),
    loss="categorical_crossentropy",
    metrics=["accuracy", tf.keras.metrics.AUC(name="auc")],
)

callbacks_stage2 = [
    ModelCheckpoint(MODEL_OUT, monitor="val_accuracy", save_best_only=True, mode="max"),
    EarlyStopping(monitor="val_loss", patience=6, restore_best_weights=True),
    ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3, min_lr=1e-8),
    CSVLogger("stage2_log.csv"),
]

history2 = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=STAGE2_EPOCHS,
    class_weight=class_weight_dict,
    callbacks=callbacks_stage2,
)

# ----------------------------------------------------------------------------
# 7. EVALUATE ON TEST SET
# ----------------------------------------------------------------------------
test_loss, test_acc, test_auc = model.evaluate(test_gen)
print(f"\nTest Accuracy: {test_acc:.4f} | Test AUC: {test_auc:.4f}")

# Detailed report
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns

test_gen.reset()
y_pred_probs = model.predict(test_gen)
y_pred = np.argmax(y_pred_probs, axis=1)
y_true = test_gen.classes

print("\nClassification Report:\n")
print(classification_report(y_true, y_pred, target_names=list(test_gen.class_indices.keys())))

cm = confusion_matrix(y_true, y_pred)
plt.figure(figsize=(6, 5))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=list(test_gen.class_indices.keys()),
            yticklabels=list(test_gen.class_indices.keys()))
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.title("Confusion Matrix - EfficientNetB3")
plt.tight_layout()
plt.savefig("confusion_matrix.png", dpi=150)
plt.close()

# ----------------------------------------------------------------------------
# 8. PLOT TRAINING CURVES
# ----------------------------------------------------------------------------
def combine_history(h1, h2, key):
    return h1.history[key] + h2.history[key]

acc = combine_history(history1, history2, "accuracy")
val_acc = combine_history(history1, history2, "val_accuracy")
loss = combine_history(history1, history2, "loss")
val_loss = combine_history(history1, history2, "val_loss")

fig, axes = plt.subplots(1, 2, figsize=(12, 4))
axes[0].plot(acc, label="Train Acc")
axes[0].plot(val_acc, label="Val Acc")
axes[0].axvline(x=STAGE1_EPOCHS, color="gray", linestyle="--", label="Fine-tuning starts")
axes[0].set_title("Accuracy")
axes[0].legend()

axes[1].plot(loss, label="Train Loss")
axes[1].plot(val_loss, label="Val Loss")
axes[1].axvline(x=STAGE1_EPOCHS, color="gray", linestyle="--", label="Fine-tuning starts")
axes[1].set_title("Loss")
axes[1].legend()

plt.tight_layout()
plt.savefig("training_curves.png", dpi=150)
plt.close()

# ----------------------------------------------------------------------------
# 9. SAVE FINAL MODEL
# ----------------------------------------------------------------------------
model.save(MODEL_OUT)
print(f"\nModel saved to {MODEL_OUT}")