"""
Post-Processing: Mask -> Tumor Size -> Stage
===============================================
Takes a raw segmentation mask (model output) and:
  1. Cleans it (removes noise, keeps the largest connected tumor region)
  2. Converts pixel area -> real-world area (mm^2)
  3. Buckets that area into a Small / Medium / Large stage

IMPORTANT LIMITATION (be upfront about this in your report):
Our source images are plain .jpg/.png files, NOT DICOM, so we have no real
per-patient pixel spacing metadata (DICOM files normally embed this - how many
mm each pixel represents). We therefore use an ASSUMED, documented pixel
spacing based on a typical brain MRI field-of-view (~240mm) divided by our
fixed image resolution. This gives a reasonable, defensible APPROXIMATION of
real-world size, not a clinically precise measurement. State this clearly
wherever tumor size is reported.

This module is meant to be imported by app/main.py - it has no model code,
just pure post-processing logic on an already-predicted mask.
"""

import numpy as np
import cv2


# ----------------------------------------------------------------------------
# CONFIG
# ----------------------------------------------------------------------------
IMG_SIZE = 256                  # must match the segmentation model's input/output size
ASSUMED_FOV_MM = 240.0          # typical brain MRI field-of-view width, in mm (documented assumption)
PIXEL_SPACING_MM = ASSUMED_FOV_MM / IMG_SIZE   # mm represented by one pixel edge

# Stage thresholds in mm^2 (cross-sectional area on this 2D slice).
# These are simplified, rule-based cutoffs for demonstration purposes - not a
# clinical staging standard. Documented and easy to defend/adjust in your report.
STAGE_THRESHOLDS_MM2 = {
    "Small": (0, 500),
    "Medium": (500, 1500),
    "Large": (1500, float("inf")),
}

MIN_BLOB_AREA_RATIO = 0.002   # ignore blobs smaller than 0.2% of image area (noise)


# ----------------------------------------------------------------------------
# STEP 1: Clean the raw predicted mask
# ----------------------------------------------------------------------------
def clean_mask(raw_mask, img_size=IMG_SIZE):
    """
    raw_mask: 2D numpy array, values in [0, 1] (model's sigmoid output) or
              already binarized (0/255 or 0/1).
    Returns a clean binary mask (0/255 uint8) with only the largest tumor blob.
    """
    if raw_mask.dtype != np.uint8:
        binary = (raw_mask > 0.5).astype(np.uint8) * 255
    else:
        binary = raw_mask.copy()
        if binary.max() == 1:
            binary = binary * 255

    kernel = np.ones((5, 5), np.uint8)
    cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=1)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel, iterations=2)

    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(cleaned, connectivity=8)
    if num_labels <= 1:
        return cleaned   # nothing found, return as-is (all zeros)

    min_area = (img_size * img_size) * MIN_BLOB_AREA_RATIO
    final_mask = np.zeros_like(cleaned)

    areas = stats[1:, cv2.CC_STAT_AREA]
    if areas.max() >= min_area:
        largest_label = 1 + np.argmax(areas)
        final_mask[labels == largest_label] = 255

    return final_mask


# ----------------------------------------------------------------------------
# STEP 2: Convert mask -> real-world area
# ----------------------------------------------------------------------------
def compute_tumor_area(clean_binary_mask, pixel_spacing_mm=PIXEL_SPACING_MM):
    """
    Returns:
        pixel_count: number of tumor pixels in the mask
        area_mm2: approximate real-world cross-sectional area
    """
    pixel_count = int(np.sum(clean_binary_mask > 0))
    area_mm2 = pixel_count * (pixel_spacing_mm ** 2)
    return pixel_count, round(area_mm2, 2)


# ----------------------------------------------------------------------------
# STEP 3: Bucket area into a stage
# ----------------------------------------------------------------------------
def classify_stage(area_mm2, thresholds=STAGE_THRESHOLDS_MM2):
    for stage, (low, high) in thresholds.items():
        if low <= area_mm2 < high:
            return stage
    return "Unknown"


# ----------------------------------------------------------------------------
# STEP 4: Bounding box (useful for drawing a localization box on the frontend)
# ----------------------------------------------------------------------------
def get_bounding_box(clean_binary_mask):
    """Returns (x, y, w, h) of the tumor region, or None if no tumor found."""
    coords = cv2.findNonZero(clean_binary_mask)
    if coords is None:
        return None
    x, y, w, h = cv2.boundingRect(coords)
    return {"x": int(x), "y": int(y), "width": int(w), "height": int(h)}


# ----------------------------------------------------------------------------
# STEP 5: Full pipeline in one call - this is what app/main.py will import
# ----------------------------------------------------------------------------
def process_mask(raw_mask, img_size=IMG_SIZE, pixel_spacing_mm=PIXEL_SPACING_MM):
    """
    Full post-processing pipeline: raw model mask -> cleaned mask + size + stage.

    Returns a dict ready to drop straight into an API response:
        {
            "clean_mask": <uint8 binary mask array>,
            "pixel_count": int,
            "area_mm2": float,
            "stage": "Small" | "Medium" | "Large" | "Unknown",
            "bounding_box": {"x":.., "y":.., "width":.., "height":..} or None,
            "tumor_detected": bool
        }
    """
    clean_binary_mask = clean_mask(raw_mask, img_size)
    pixel_count, area_mm2 = compute_tumor_area(clean_binary_mask, pixel_spacing_mm)
    stage = classify_stage(area_mm2) if pixel_count > 0 else "N/A"
    bbox = get_bounding_box(clean_binary_mask)

    return {
        "clean_mask": clean_binary_mask,
        "pixel_count": pixel_count,
        "area_mm2": area_mm2,
        "stage": stage,
        "bounding_box": bbox,
        "tumor_detected": pixel_count > 0,
    }


# ----------------------------------------------------------------------------
# Standalone demo / quick test
# ----------------------------------------------------------------------------
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python postprocess.py <path_to_mask_image>")
        print("(Test it on one of the predicted masks in segmentation/unet_eval_outputs/, "
              "or any binary mask .png)")
        sys.exit(0)

    mask_path = sys.argv[1]
    raw_mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
    if raw_mask is None:
        print(f"Could not read image at {mask_path}")
        sys.exit(1)

    result = process_mask(raw_mask)
    print("\nPost-processing result:")
    print(f"  Tumor detected : {result['tumor_detected']}")
    print(f"  Pixel count    : {result['pixel_count']}")
    print(f"  Area (mm^2)    : {result['area_mm2']}")
    print(f"  Stage          : {result['stage']}")
    print(f"  Bounding box   : {result['bounding_box']}")