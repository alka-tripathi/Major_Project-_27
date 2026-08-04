// src/app/api/doctors/sync/route.js

import connectDB from "@/lib/mongodb";
import Doctor from "@/models/Doctor";

export async function POST(req) {
  await connectDB();

  const { firebaseUid, email, name } = await req.json();

  let doctor = await Doctor.findOne({ firebaseUid });

  if (!doctor) {
    doctor = await Doctor.create({
      firebaseUid,
      email,
      name,
    });
  }

  return Response.json(doctor);
}