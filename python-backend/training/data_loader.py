# work of this file 
# data_loader.py loads the MRI images and their corresponding segmentation masks, preprocesses them, and provides the prepared data to the Attention U-Net model for training



"""
data_loader.py

Purpose:
--------
Loads Brain MRI images and corresponding segmentation masks
from the LGG MRI Segmentation dataset.

Dataset Structure:
dataset/
└── Segmentation/
    └── kaggle_3m/
        ├── TCGA_XXXX/
        │   ├── image1.tif
        │   ├── image1_mask.tif
        │   ├── image2.tif
        │   └── ...
"""

import os
import cv2
import numpy as np


# Image size used for Attention U-Net
IMG_SIZE = 256


def load_segmentation_dataset(dataset_path):
    """
    Loads all MRI images and segmentation masks.

    Parameters
    ----------
    dataset_path : str
        Path of kaggle_3m folder.

    Returns
    -------
    X : numpy array
        MRI Images

    Y : numpy array
        Tumor Masks
    """

    images = []
    masks = []

    # Iterate through every patient folder
    for patient_folder in os.listdir(dataset_path):

        patient_path = os.path.join(dataset_path, patient_folder)

        if not os.path.isdir(patient_path):
            continue

        # Read every file
        for file in os.listdir(patient_path):

            # Ignore mask files
            if "_mask" in file:
                continue

            image_path = os.path.join(patient_path, file)

            # Create corresponding mask filename
            mask_path = os.path.join(
                patient_path,
                file.replace(".tif", "_mask.tif")
            )

            # Skip if mask doesn't exist
            if not os.path.exists(mask_path):
                continue

            # Read MRI image
            image = cv2.imread(image_path)

            # Read Mask in grayscale
            mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)

            # Resize
            image = cv2.resize(image, (IMG_SIZE, IMG_SIZE))
            mask = cv2.resize(mask, (IMG_SIZE, IMG_SIZE))

            # Normalize image
            image = image.astype(np.float32) / 255.0

            # Normalize mask
            mask = mask.astype(np.float32) / 255.0

            # Convert mask to binary
            mask = (mask > 0.5).astype(np.float32)

            # Add channel dimension
            mask = np.expand_dims(mask, axis=-1)

            images.append(image)
            masks.append(mask)

    X = np.array(images, dtype=np.float32)
    Y = np.array(masks, dtype=np.float32)

    print(f"Loaded Images : {len(X)}")
    print(f"Loaded Masks  : {len(Y)}")

    return X, Y