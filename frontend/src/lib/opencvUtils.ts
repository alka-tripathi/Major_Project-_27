"use client";

declare global {
  interface Window {
    cv: any;
  }
}

/**
 * Initializes OpenCV and returns a promise that resolves when it's ready.
 */
export const waitForOpenCV = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const check = () => {
      if (typeof window !== 'undefined' && window.cv && window.cv.Mat) {
        resolve(window.cv);
      } else {
        setTimeout(check, 100);
      }
    };
    check();
    setTimeout(() => reject(new Error("OpenCV timeout")), 10000);
  });
};

/**
 * Preprocesses the uploaded MRI scan image using OpenCV.
 * It applies grayscale conversion, Gaussian blur, and Canny edge detection.
 * Then it draws the contours on a new image.
 */
export const processMRIImage = async (
  imageElement: HTMLImageElement,
  canvasElement: HTMLCanvasElement
): Promise<boolean> => {
  try {
    const cv = await waitForOpenCV();
    
    // Read the image from the HTML Image Element
    let src = cv.imread(imageElement);
    let dst = new cv.Mat();
    
    // 1. Convert to Grayscale
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    
    // 2. Apply Gaussian Blur to reduce noise
    let ksize = new cv.Size(5, 5);
    cv.GaussianBlur(src, src, ksize, 0, 0, cv.BORDER_DEFAULT);
    
    // 3. Apply Canny Edge Detection
    cv.Canny(src, dst, 50, 100, 3, false);
    
    // 4. Optionally, find contours and draw them to highlight the tumor or brain structure
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(dst, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    
    // Draw the contours on the original image (converted back to BGR for color drawing)
    let output = new cv.Mat();
    cv.cvtColor(src, output, cv.COLOR_GRAY2RGBA, 0);
    for (let i = 0; i < contours.size(); ++i) {
        let color = new cv.Scalar(0, 255, 0, 255); // Green color for contours
        cv.drawContours(output, contours, i, color, 1, cv.LINE_8, hierarchy, 100);
    }
    
    // Show the result on the provided canvas
    cv.imshow(canvasElement, output);
    
    // Clean up memory
    src.delete();
    dst.delete();
    output.delete();
    contours.delete();
    hierarchy.delete();
    
    return true;
  } catch (error) {
    console.error("Error processing image with OpenCV:", error);
    return false;
  }
};
