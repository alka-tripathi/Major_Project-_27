import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPatient extends Document {
  doctorId: string;
  patientName: string;
  patientAge: number;
  patientGender: "Male" | "Female" | "Other";
  imagePath: string;
  heatmapPath?: string;
  segmentationPath?: string;
  tumorDetected: boolean;
  tumorType?: "Glioma" | "Meningioma" | "Pituitary" | "No Tumor";
  confidence?: number;
  probabilities?: {
    glioma?: number;
    meningioma?: number;
    pituitary?: number;
    noTumor?: number;
  };
  tumorSize?: {
    width?: number;
    height?: number;
    area?: number;
  };
  location?: {
    x?: number;
    y?: number;
    region?: string;
  };
  severity?: "None" | "Needs Review" | "Low" | "Medium" | "High";
  recommendation?: string;
  notes?: string;
  reportPdf?: string;
  status: "Processing" | "Completed" | "Failed";
  scanDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const patientSchema = new Schema<IPatient>(
  {
    doctorId: {
      type: String,
      required: true,
    },
    patientName: {
      type: String,
      required: true,
    },
    patientAge: {
      type: Number,
      required: true,
    },
    patientGender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    imagePath: {
      type: String,
      required: true,
    },
    heatmapPath: String,
    segmentationPath: String,
    tumorDetected: {
      type: Boolean,
      default: false,
    },
    tumorType: {
      type: String,
      enum: ["Glioma", "Meningioma", "Pituitary", "No Tumor"],
    },
    confidence: Number,
    probabilities: {
      glioma: Number,
      meningioma: Number,
      pituitary: Number,
      noTumor: Number,
    },
    tumorSize: {
      width: Number,
      height: Number,
      area: Number,
    },
    location: {
      x: Number,
      y: Number,
      region: String,
    },
    severity: {
      type: String,
      enum: ["None", "Needs Review", "Low", "Medium", "High"],
    },
    recommendation: String,
    notes: String,
    reportPdf: String,
    status: {
      type: String,
      enum: ["Processing", "Completed", "Failed"],
      default: "Processing",
    },
    scanDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Patient: Model<IPatient> = mongoose.models.Patient || mongoose.model<IPatient>("Patient", patientSchema);
export default Patient;
