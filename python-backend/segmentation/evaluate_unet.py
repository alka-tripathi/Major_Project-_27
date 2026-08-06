"""
Evaluate Trained U-Net (standalone - no retraining)
======================================================
Loads the already-trained weights and:
  1. Runs evaluation on the BRISC test set (real Dice/IoU numbers)
  2. Saves a few sample predictions (image | true mask | predicted mask)
  3. Prints a summary you can drop straight into your report

Run this from inside python-backend/segmentation/, e.g.:
    python evaluate_unet.py
"""

import os
import glob
import numpy as np
import cv2
import tensorflow as tf
import matplotlib.pyplot as plt

# Reuse the exact same build_model(), losses, and generator from train_unet.py
# so the architecture matches EXACTLY what the saved weights expect.
from train_unet import (
    build_model, collect_pairs, SegmentationDataGenerator,
    dice_coefficient, iou_metric, combined_bce_dice_loss,
    IMG_SIZE, BATCH_SIZE, TEST_IMG_ROOT, TEST_MASK_ROOT, MODEL_WEIGHTS_OUT
)

# postprocessing/ is a sibling folder to segmentation/ - add it to the path so
# we can import process_mask() and demo it directly on a real predicted mask
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "postprocessing"))
from postprocess import process_mask   # noqa: E402

OUTPUT_DIR = "unet_eval_outputs"
RAW_MASK_DIR = os.path.join(OUTPUT_DIR, "raw_predicted_masks")   # clean, single-channel masks only
NUM_SAMPLE_PREDICTIONS = 8


def main():
    print(f"Loading weights from {MODEL_WEIGHTS_OUT} ...")
    model = build_model()
    model.load_weights(MODEL_WEIGHTS_OUT)
    print("Weights loaded successfully.\n")

    model.compile(
        optimizer="adam",   # optimizer state doesn't matter for evaluation, just needs to compile
        loss=combined_bce_dice_loss,
        metrics=[dice_coefficient, iou_metric],
    )

    print("Collecting test image/mask pairs...")
    test_imgs, test_masks = collect_pairs(TEST_IMG_ROOT, TEST_MASK_ROOT)
    print(f"Found {len(test_imgs)} test pairs\n")

    if len(test_imgs) == 0:
        print("No test pairs found - check TEST_IMG_ROOT/TEST_MASK_ROOT paths in train_unet.py")
        return

    test_gen = SegmentationDataGenerator(
        test_imgs, test_masks, BATCH_SIZE, IMG_SIZE, augment=False, shuffle=False
    )

    print("Running evaluation on test set...")
    results = model.evaluate(test_gen, verbose=1, return_dict=True)

    print("\n" + "=" * 50)
    print("TEST SET RESULTS")
    print("=" * 50)
    for name, value in results.items():
        print(f"  {name}: {value:.4f}")
    print("=" * 50)

    # ------------------------------------------------------------------------
    # Save a handful of sample predictions for visual inspection / report
    # ------------------------------------------------------------------------
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(RAW_MASK_DIR, exist_ok=True)
    print(f"\nSaving {NUM_SAMPLE_PREDICTIONS} sample predictions to '{OUTPUT_DIR}/' ...")
    print(f"Raw single-channel predicted masks also saved to '{RAW_MASK_DIR}/' (for postprocess.py testing)")

    sample_indices = np.random.RandomState(42).choice(
        len(test_imgs), size=min(NUM_SAMPLE_PREDICTIONS, len(test_imgs)), replace=False
    )

    from tensorflow.keras.applications.efficientnet import preprocess_input

    for i, idx in enumerate(sample_indices):
        img_path = test_imgs[idx]
        mask_path = test_masks[idx]

        raw_img = cv2.imread(img_path, cv2.IMREAD_COLOR)
        raw_img = cv2.resize(raw_img, (IMG_SIZE, IMG_SIZE))
        raw_img_rgb = cv2.cvtColor(raw_img, cv2.COLOR_BGR2RGB)

        true_mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
        true_mask = cv2.resize(true_mask, (IMG_SIZE, IMG_SIZE), interpolation=cv2.INTER_NEAREST)
        true_mask = (true_mask > 127).astype(np.float32)

        model_input = preprocess_input(raw_img_rgb.astype(np.float32))[np.newaxis, ...]
        pred_mask = model.predict(model_input, verbose=0)[0, :, :, 0]
        pred_mask_binary = (pred_mask > 0.5).astype(np.float32)

        sample_dice = (2 * np.sum(true_mask * pred_mask_binary) + 1e-6) / \
                      (np.sum(true_mask) + np.sum(pred_mask_binary) + 1e-6)

        # ---- Save the RAW single-channel predicted mask (0/255, clean PNG) ----
        # This is the file to point postprocess.py at - a real mask, not the
        # 4-panel comparison image below.
        raw_mask_out = (pred_mask_binary * 255).astype(np.uint8)
        raw_mask_filename = f"mask_{i}_{os.path.splitext(os.path.basename(img_path))[0]}.png"
        raw_mask_path = os.path.join(RAW_MASK_DIR, raw_mask_filename)
        cv2.imwrite(raw_mask_path, raw_mask_out)

        # ---- Live post-processing demo: size + stage, right here ----
        pp_result = process_mask(pred_mask)
        print(f"  Sample {i}: {os.path.basename(img_path)} -> Dice: {sample_dice:.3f} "
              f"| Area: {pp_result['area_mm2']} mm^2 | Stage: {pp_result['stage']}")

        fig, axes = plt.subplots(1, 4, figsize=(16, 4))
        axes[0].imshow(raw_img_rgb)
        axes[0].set_title("Original MRI")
        axes[0].axis("off")

        axes[1].imshow(true_mask, cmap="gray")
        axes[1].set_title("Ground Truth Mask")
        axes[1].axis("off")

        axes[2].imshow(pred_mask_binary, cmap="gray")
        axes[2].set_title(f"Predicted Mask\nDice: {sample_dice:.3f}")
        axes[2].axis("off")

        overlay = raw_img_rgb.copy()
        overlay[pred_mask_binary > 0.5] = [255, 0, 0]
        blended = cv2.addWeighted(raw_img_rgb, 0.6, overlay, 0.4, 0)
        axes[3].imshow(blended)
        axes[3].set_title("Overlay")
        axes[3].axis("off")

        plt.tight_layout()
        out_path = os.path.join(OUTPUT_DIR, f"sample_{i}_{os.path.basename(img_path)}.png")
        plt.savefig(out_path, dpi=150)
        plt.close()

    print(f"\nDone. Check '{OUTPUT_DIR}/' for visual samples.")


if __name__ == "__main__":
    main()