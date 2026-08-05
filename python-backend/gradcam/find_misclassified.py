# """
# Finds Misclassified Test Images
# =================================
# Runs the trained model on the full test set and prints/saves the exact
# filenames of misclassified images, grouped by (true_class -> predicted_class).

# Also copies them into a folder so gradcam.py can point straight at them.

# Run this from inside python-backend/gradcam/, e.g.:
#     python find_misclassified.py
# """

# import os
# import shutil
# import numpy as np
# import tensorflow as tf
# from tensorflow.keras.models import load_model
# from tensorflow.keras.preprocessing.image import ImageDataGenerator
# from tensorflow.keras.applications.efficientnet import preprocess_input

# # ----------------------------------------------------------------------------
# # CONFIG
# # ----------------------------------------------------------------------------
# MODEL_PATH = "../models/brain_tumor_efficientnetb3.h5"
# TEST_DIR = "../dataset/Testing"
# IMG_SIZE = 300
# BATCH_SIZE = 16
# CLASS_NAMES = ["glioma", "meningioma", "notumor", "pituitary"]  # alphabetical, matches training

# OUTPUT_DIR = "misclassified_samples"   # misclassified images get copied here, organized by pair


# # ----------------------------------------------------------------------------
# # LOAD MODEL AND TEST DATA
# # ----------------------------------------------------------------------------
# print("Loading model...")
# model = load_model(MODEL_PATH)

# test_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)
# test_gen = test_datagen.flow_from_directory(
#     TEST_DIR,
#     target_size=(IMG_SIZE, IMG_SIZE),
#     batch_size=BATCH_SIZE,
#     class_mode="categorical",
#     shuffle=False,   # IMPORTANT: must stay False so filenames line up with predictions
# )

# print("Running predictions on full test set...")
# pred_probs = model.predict(test_gen, verbose=1)
# y_pred = np.argmax(pred_probs, axis=1)
# y_true = test_gen.classes
# filenames = test_gen.filenames   # e.g. "glioma/Te-gl_0012.jpg"

# # ----------------------------------------------------------------------------
# # FIND MISCLASSIFIED SAMPLES
# # ----------------------------------------------------------------------------
# if os.path.exists(OUTPUT_DIR):
#     shutil.rmtree(OUTPUT_DIR)   # clean slate each run
# os.makedirs(OUTPUT_DIR, exist_ok=True)

# mis_count = 0
# summary = {}

# for i in range(len(y_true)):
#     true_idx = y_true[i]
#     pred_idx = y_pred[i]

#     if true_idx != pred_idx:
#         mis_count += 1
#         true_class = CLASS_NAMES[true_idx]
#         pred_class = CLASS_NAMES[pred_idx]
#         confidence = pred_probs[i][pred_idx]

#         pair_key = f"{true_class}_as_{pred_class}"
#         summary[pair_key] = summary.get(pair_key, 0) + 1

#         # Copy the actual misclassified image into a labeled subfolder
#         pair_dir = os.path.join(OUTPUT_DIR, pair_key)
#         os.makedirs(pair_dir, exist_ok=True)

#         src_path = os.path.join(TEST_DIR, filenames[i])
#         dst_filename = f"{os.path.basename(filenames[i])}__conf{confidence:.2f}.jpg"
#         dst_path = os.path.join(pair_dir, dst_filename)
#         shutil.copy(src_path, dst_path)

# # ----------------------------------------------------------------------------
# # PRINT SUMMARY
# # ----------------------------------------------------------------------------
# print(f"\nTotal misclassified: {mis_count} / {len(y_true)}")
# print("\nBreakdown by (true -> predicted):")
# for pair_key, count in sorted(summary.items(), key=lambda x: -x[1]):
#     print(f"  {pair_key}: {count}")

# print(f"\nMisclassified images copied into '{OUTPUT_DIR}/', organized by subfolder.")
# print("Point gradcam.py's TEST_IMAGES_DIR at any of these subfolders, e.g.:")
# print(f'  TEST_IMAGES_DIR = "../gradcam/{OUTPUT_DIR}/glioma_as_meningioma"')





"""
Finds Misclassified Test Images
=================================
Runs the trained model on the full test set and prints/saves the exact
filenames of misclassified images, grouped by (true_class -> predicted_class).

Also copies them into a folder so gradcam.py can point straight at them.

Run this from inside python-backend/gradcam/, e.g.:
    python find_misclassified.py
"""

import os
import shutil
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications.efficientnet import preprocess_input


# ----------------------------------------------------------------------------
# COMPATIBILITY PATCH (see gradcam.py for full explanation)
# ----------------------------------------------------------------------------
from keras.src.initializers.random_initializers import VarianceScaling as _RealVarianceScaling

_original_init = _RealVarianceScaling.__init__

def _patched_init(self, scale=1.0, mode="fan_in", distribution="truncated_normal", seed=None, **kwargs):
    kwargs.pop("input_axes", None)
    kwargs.pop("output_axes", None)
    _original_init(self, scale=scale, mode=mode, distribution=distribution, seed=seed)

_RealVarianceScaling.__init__ = _patched_init

# ----------------------------------------------------------------------------
# CONFIG
# ----------------------------------------------------------------------------
MODEL_PATH = "../models/brain_tumor_efficientnetb3.h5"
TEST_DIR = "../dataset/Testing"
IMG_SIZE = 300
BATCH_SIZE = 16
CLASS_NAMES = ["glioma", "meningioma", "notumor", "pituitary"]  # alphabetical, matches training

OUTPUT_DIR = "misclassified_samples"   # misclassified images get copied here, organized by pair


# ----------------------------------------------------------------------------
# LOAD MODEL AND TEST DATA
# ----------------------------------------------------------------------------
print("Loading model...")
model = load_model(MODEL_PATH)

test_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)
test_gen = test_datagen.flow_from_directory(
    TEST_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    shuffle=False,   # IMPORTANT: must stay False so filenames line up with predictions
)

print("Running predictions on full test set...")
pred_probs = model.predict(test_gen, verbose=1)
y_pred = np.argmax(pred_probs, axis=1)
y_true = test_gen.classes
filenames = test_gen.filenames   # e.g. "glioma/Te-gl_0012.jpg"

# ----------------------------------------------------------------------------
# FIND MISCLASSIFIED SAMPLES
# ----------------------------------------------------------------------------
if os.path.exists(OUTPUT_DIR):
    shutil.rmtree(OUTPUT_DIR)   # clean slate each run
os.makedirs(OUTPUT_DIR, exist_ok=True)

mis_count = 0
summary = {}

for i in range(len(y_true)):
    true_idx = y_true[i]
    pred_idx = y_pred[i]

    if true_idx != pred_idx:
        mis_count += 1
        true_class = CLASS_NAMES[true_idx]
        pred_class = CLASS_NAMES[pred_idx]
        confidence = pred_probs[i][pred_idx]

        pair_key = f"{true_class}_as_{pred_class}"
        summary[pair_key] = summary.get(pair_key, 0) + 1

        # Copy the actual misclassified image into a labeled subfolder
        pair_dir = os.path.join(OUTPUT_DIR, pair_key)
        os.makedirs(pair_dir, exist_ok=True)

        src_path = os.path.join(TEST_DIR, filenames[i])
        dst_filename = f"{os.path.basename(filenames[i])}__conf{confidence:.2f}.jpg"
        dst_path = os.path.join(pair_dir, dst_filename)
        shutil.copy(src_path, dst_path)

# ----------------------------------------------------------------------------
# PRINT SUMMARY
# ----------------------------------------------------------------------------
print(f"\nTotal misclassified: {mis_count} / {len(y_true)}")
print("\nBreakdown by (true -> predicted):")
for pair_key, count in sorted(summary.items(), key=lambda x: -x[1]):
    print(f"  {pair_key}: {count}")

print(f"\nMisclassified images copied into '{OUTPUT_DIR}/', organized by subfolder.")
print("Point gradcam.py's TEST_IMAGES_DIR at any of these subfolders, e.g.:")
print(f'  TEST_IMAGES_DIR = "../gradcam/{OUTPUT_DIR}/glioma_as_meningioma"')