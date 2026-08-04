## Prediction Result

**Purpose**

View the AI analysis of MRI scans.

What it does

After uploading an MRI image, this page displays:

Whether a tumor is present or not.
Tumor type:
Glioma
Meningioma
Pituitary
No Tumor
Confidence score.
Probability of each class.
Heatmap (Grad-CAM) showing where the model focused.
Downloadable PDF report.
Example
Tumor Detected : Yes

Tumor Type : Glioma

Confidence : 98.4%

Probabilities:
Glioma      98%
Meningioma  1%
Pituitary   0.5%
No Tumor    0.5%


## Patient Records

**Purpose**

Store and manage previous diagnoses.

What it does

Displays all patients added by the doctor.

For each patient:

Name
Age
Gender
Scan date
Tumor type
Confidence
Status

The doctor can:

Search patients.
View old reports.
Download PDF reports.
Compare scans over time.
Delete records.

Example:

Rahul Sharma
Age: 45

Tumor Type:
Glioma

Confidence:
98%

Status:
Completed


## Add Patient

**Purpose**

Add a new patient and upload MRI scans.

What it does
Step 1: Fill patient details
Name
Age
Gender
Step 2: Upload MRI image
brain_scan_001.jpg
Step 3: Click
Analyze MRI
Step 4: Python AI model processes image
Preprocessing
Tumor detection
Classification
Heatmap generation
Step 5: Save everything in MongoDB