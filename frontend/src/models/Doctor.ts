import mongoose, { Document, Model, Schema } from "mongoose";
import { patientSchema, IPatient } from "./Patient";

export interface IDoctor extends Document {
  firebaseUid: string;
  firstName: string;
  lastName?: string;
  email: string;
  hospitalName?: string;
  specialization: string;
  phone?: string;
  profilePic?: string;
  patients: IPatient[];
  createdAt: Date;
  updatedAt: Date;
}

const doctorSchema = new Schema<IDoctor>(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    hospitalName: {
      type: String,
    },
    specialization: {
      type: String,
      default: "Neurology",
    },
    phone: {
      type: String,
    },
    profilePic: {
      type: String,
    },
    patients: [patientSchema],
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.Doctor) {
  delete mongoose.models.Doctor;
}

const Doctor: Model<IDoctor> = mongoose.models.Doctor || mongoose.model<IDoctor>("Doctor", doctorSchema);
export default Doctor;
