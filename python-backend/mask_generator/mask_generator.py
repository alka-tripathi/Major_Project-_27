"""
Pseudo-Mask Generator for Brain Tumor Segmentation
====================================================
Generates approximate tumor masks from classification-only MRI images
(glioma, meningioma, pituitary) using classical image processing:
    1. Preprocessing (grayscale, denoise)
    2. Skull stripping (removes bright skull/bone regions before thresholding)
    3. Otsu's thresholding (auto-picks brightness cutoff per image)
    4. Morphological cleanup (removes noise, keeps largest tumor blob)

NOTE: "notumor" class is skipped entirely — there is nothing to segment.

Input expected structure:
    dataset/Training/glioma/*.jpg
    dataset/Training/meningioma/*.jpg
    dataset/Training/pituitary/*.jpg
    dataset/Testing/glioma/*.jpg
    ... etc (same as classification dataset, notumor folders ignored)

Output structure (created by this script):
    dataset/Masks/Training/glioma/img1_mask.png
    dataset/Masks/Training/meningioma/img1_mask.png
    dataset/Masks/Training/pituitary/img1_mask.png
    dataset/Masks/Testing/...

Run this from inside python-backend/ (one level above dataset/), e.g.:
    python3 mask_generator/mask_generator.py
"""

import os
import cv2
import numpy as np
from pathlib import Path

# ----------------------------------------------------------------------------
# CONFIG
# ----------------------------------------------------------------------------
DATASET_ROOT = "../dataset"                      # contains Training/ and Testing/
MASK_OUTPUT_ROOT = "../dataset/Masks"             # where generated masks are saved
SPLITS = ["Training", "Testing"]
TUMOR_CLASSES = ["glioma", "meningioma", "pituitary"]   # "notumor" intentionally excluded

# Morphological kernel sizes — tune these if masks look too noisy or too aggressive
SKULL_STRIP_KERNEL = 5
CLEANUP_KERNEL = 5
MIN_BLOB_AREA_RATIO = 0.002   # ignore blobs smaller than 0.2% of image area (noise)

# Set to True to save side-by-side preview images for manual spot-checking
SAVE_PREVIEWS = True
PREVIEW_OUTPUT_ROOT = "../dataset/Masks_Preview"
PREVIEW_SAMPLE_EVERY_N = 10   # save 1 preview per N images per class (avoid saving thousands)


# ----------------------------------------------------------------------------
# STEP 1: Preprocessing
# ----------------------------------------------------------------------------
def preprocess_image(img_path, target_size=(256, 256)):
    """Load image, convert to grayscale, resize, denoise."""
    img = cv2.imread(str(img_path), cv2.IMREAD_GRAYSCALE)
    if img is None:
        return None
    img = cv2.resize(img, target_size, interpolation=cv2.INTER_AREA)
    # Denoise while preserving edges (important — don't blur tumor boundaries away)
    img = cv2.bilateralFilter(img, d=5, sigmaColor=50, sigmaSpace=50)
    return img


# ----------------------------------------------------------------------------
# STEP 2: Skull Stripping
# ----------------------------------------------------------------------------
def strip_skull(img):
    """
    Removes the bright skull ring so it doesn't get picked up by Otsu thresholding
    as a false 'tumor' region.

    Approach: the brain tissue forms one large, roughly-central connected blob.
    The skull is a thin bright ring around the OUTSIDE of that blob.
    We isolate the largest central blob and discard everything outside it.
    """
    # Rough initial threshold to separate "head region" from black background
    _, head_mask = cv2.threshold(img, 20, 255, cv2.THRESH_BINARY)

    kernel = np.ones((SKULL_STRIP_KERNEL, SKULL_STRIP_KERNEL), np.uint8)
    head_mask = cv2.morphologyEx(head_mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    head_mask = cv2.morphologyEx(head_mask, cv2.MORPH_OPEN, kernel, iterations=1)

    # Erode inward — this shaves off the thin bright skull ring specifically,
    # since skull is a thin border around the brain tissue blob
    erode_kernel = np.ones((9, 9), np.uint8)
    brain_only_mask = cv2.erode(head_mask, erode_kernel, iterations=2)

    # Keep only the largest connected component (the brain itself, not stray specks)
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(brain_only_mask, connectivity=8)
    if num_labels > 1:
        largest_label = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        brain_only_mask = np.uint8(labels == largest_label) * 255

    stripped = cv2.bitwise_and(img, img, mask=brain_only_mask)
    return stripped, brain_only_mask


# ----------------------------------------------------------------------------
# STEP 3: Otsu's Thresholding
# ----------------------------------------------------------------------------
def apply_otsu_threshold(img, brain_mask):
    """
    Applies Otsu's method to auto-select the best brightness cutoff,
    restricted to the skull-stripped brain region only.
    """
    # Otsu only makes sense computed over the actual brain pixels, so mask first
    brain_pixels = img[brain_mask > 0]
    if brain_pixels.size == 0:
        return np.zeros_like(img)

    # cv2.threshold with THRESH_OTSU ignores masked-out (black) pixels poorly,
    # so we compute Otsu's threshold value manually on brain pixels only:
    otsu_thresh_val, _ = cv2.threshold(
        brain_pixels, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )

    # Apply that computed threshold to the full (masked) image
    _, tumor_mask = cv2.threshold(img, otsu_thresh_val, 255, cv2.THRESH_BINARY)
    tumor_mask = cv2.bitwise_and(tumor_mask, tumor_mask, mask=brain_mask)

    return tumor_mask


# ----------------------------------------------------------------------------
# STEP 4: Morphological Cleanup
# ----------------------------------------------------------------------------
def cleanup_mask(mask, image_area):
    """Removes small noise blobs, keeps only the largest plausible tumor region."""
    kernel = np.ones((CLEANUP_KERNEL, CLEANUP_KERNEL), np.uint8)
    cleaned = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel, iterations=2)

    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(cleaned, connectivity=8)
    if num_labels <= 1:
        return cleaned  # nothing found

    min_area = image_area * MIN_BLOB_AREA_RATIO
    final_mask = np.zeros_like(cleaned)

    # Keep the largest blob only (assumption: one tumor per image, matches your dataset)
    areas = stats[1:, cv2.CC_STAT_AREA]
    if areas.max() >= min_area:
        largest_label = 1 + np.argmax(areas)
        final_mask[labels == largest_label] = 255

    return final_mask


# ----------------------------------------------------------------------------
# FULL PIPELINE FOR ONE IMAGE
# ----------------------------------------------------------------------------
def generate_mask(img_path):
    img = preprocess_image(img_path)
    if img is None:
        return None, None

    stripped_img, brain_mask = strip_skull(img)
    raw_tumor_mask = apply_otsu_threshold(stripped_img, brain_mask)
    final_mask = cleanup_mask(raw_tumor_mask, image_area=img.shape[0] * img.shape[1])

    return img, final_mask


# ----------------------------------------------------------------------------
# BATCH PROCESS ENTIRE DATASET
# ----------------------------------------------------------------------------
def process_dataset():
    for split in SPLITS:
        for cls in TUMOR_CLASSES:
            src_dir = Path(DATASET_ROOT) / split / cls
            if not src_dir.exists():
                print(f"[SKIP] {src_dir} not found")
                continue

            out_dir = Path(MASK_OUTPUT_ROOT) / split / cls
            out_dir.mkdir(parents=True, exist_ok=True)

            preview_dir = Path(PREVIEW_OUTPUT_ROOT) / split / cls
            if SAVE_PREVIEWS:
                preview_dir.mkdir(parents=True, exist_ok=True)

            image_files = sorted([
                f for f in src_dir.iterdir()
                if f.suffix.lower() in (".jpg", ".jpeg", ".png")
            ])

            print(f"\nProcessing {split}/{cls}: {len(image_files)} images")

            for i, img_path in enumerate(image_files):
                img, mask = generate_mask(img_path)
                if img is None:
                    print(f"  [WARN] could not read {img_path.name}, skipping")
                    continue

                mask_filename = f"{img_path.stem}_mask.png"
                cv2.imwrite(str(out_dir / mask_filename), mask)

                # Save a side-by-side preview every N images so you can spot-check quality
                if SAVE_PREVIEWS and i % PREVIEW_SAMPLE_EVERY_N == 0:
                    mask_colored = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR)
                    mask_colored[:, :, 0] = 0   # zero out blue/green -> mask shows red
                    mask_colored[:, :, 1] = 0
                    img_colored = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
                    overlay = cv2.addWeighted(img_colored, 0.7, mask_colored, 0.5, 0)
                    side_by_side = np.hstack([img_colored, mask_colored, overlay])
                    cv2.imwrite(str(preview_dir / f"{img_path.stem}_preview.png"), side_by_side)

                if (i + 1) % 100 == 0:
                    print(f"  ...{i + 1}/{len(image_files)} done")

            print(f"  Done: {len(image_files)} masks saved to {out_dir}")

    print("\nAll classes processed.")
    if SAVE_PREVIEWS:
        print(f"Spot-check preview images saved under: {PREVIEW_OUTPUT_ROOT}")
        print("Open a few of these BEFORE training U-Net — verify masks roughly match visible tumors.")


if __name__ == "__main__":
    process_dataset()