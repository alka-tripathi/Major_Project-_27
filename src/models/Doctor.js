// src/models/Doctor.js

import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    // 🔗 Firebase UID (MOST IMPORTANT)
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
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

    // optional profile image
    profilePic: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Doctor ||
  mongoose.model("Doctor", doctorSchema);