import cv2
import numpy as np
import os


# -------------------------------
# Load MRI Image
# -------------------------------
def load_image(image_path):
    """
    Reads the MRI image from the given path.
    """

    image = cv2.imread(image_path)

    # Check if image exists
    if image is None:
        raise ValueError("Image not found!")

    return image


# -------------------------------
# Resize Image
# -------------------------------
def resize_image(image, size=(512, 512)):
    """
    Resize MRI image to 512x512.
    """
    return cv2.resize(image, size)


# -------------------------------
# Normalize Image
# -------------------------------
def normalize_image(image):
    """
    Normalize pixel values to the range [0,1].
    """

    image = image.astype(np.float32) / 255.0

    return image


# -------------------------------
# Apply CLAHE
# -------------------------------
def apply_clahe(image):
    """
    Improve image contrast using
    Contrast Limited Adaptive Histogram Equalization.
    """

    # Convert image back to uint8
    image = (image * 255).astype(np.uint8)

    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Create CLAHE object
    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    # Apply CLAHE
    enhanced = clahe.apply(gray)

    # Convert back to RGB
    enhanced = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)

    # Normalize again
    enhanced = enhanced.astype(np.float32) / 255.0

    return enhanced


# -------------------------------
# Denoise Image
# -------------------------------
def denoise_image(image):
    """
    Remove noise using Gaussian Blur.
    """

    image = (image * 255).astype(np.uint8)

    denoised = cv2.GaussianBlur(
        image,
        (5, 5),
        0
    )

    denoised = denoised.astype(np.float32) / 255.0

    return denoised


# -------------------------------
# Complete Preprocessing Pipeline
# -------------------------------
def preprocess_image(image_path):
    """
    Complete preprocessing pipeline:
    1. Load Image
    2. Resize
    3. Normalize
    4. Apply CLAHE
    5. Denoise
    """

    image = load_image(image_path)

    image = resize_image(image)

    image = normalize_image(image)

    image = apply_clahe(image)

    image = denoise_image(image)

    return image