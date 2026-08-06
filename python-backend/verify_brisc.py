import os

for split in ["Training", "Testing"]:
    img_dir = f"dataset/Segmentation/{split}/images"
    mask_dir = f"dataset/Segmentation/{split}/masks"

    if not os.path.exists(img_dir):
        print(f"[MISSING] {img_dir}")
        continue
    if not os.path.exists(mask_dir):
        print(f"[MISSING] {mask_dir}")
        continue

    images = sorted(os.listdir(img_dir))
    masks = sorted(os.listdir(mask_dir))

    print(f"\n{split}: {len(images)} images, {len(masks)} masks")

    # Check first 3 pairs match
    matched = 0
    unmatched_examples = []
    for img_file in images:
        stem = os.path.splitext(img_file)[0]
        expected_mask = f"{stem}.png"
        if expected_mask in masks:
            matched += 1
        else:
            if len(unmatched_examples) < 3:
                unmatched_examples.append(img_file)

    print(f"  Matched pairs: {matched}/{len(images)}")
    if unmatched_examples:
        print(f"  Example unmatched images: {unmatched_examples}")

    if images:
        print(f"  Sample image filename: {images[0]}")
    if masks:
        print(f"  Sample mask filename: {masks[0]}")