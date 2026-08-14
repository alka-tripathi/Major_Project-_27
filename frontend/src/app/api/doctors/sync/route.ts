import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Doctor from "@/models/Doctor";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { firebaseUid, email, name, firstName, lastName, profilePic, photoURL } = body || {};
    const doctorProfilePic = profilePic || photoURL || "";

    if (!firebaseUid || !email) {
      return NextResponse.json(
        { success: false, message: "firebaseUid and email are required" },
        { status: 400 }
      );
    }

    let doctor = await Doctor.findOne({ firebaseUid });

    if (!doctor) {
      let finalFirstName = firstName?.trim() || "";
      let finalLastName = lastName?.trim() || "";
      
      if (!finalFirstName && name) {
        const parts = name.trim().split(" ");
        finalFirstName = parts[0];
        finalLastName = parts.slice(1).join(" ");
      }

      if (!finalFirstName) {
        finalFirstName = email.split("@")[0] || "Doctor";
      }

      doctor = await Doctor.create({
        firebaseUid,
        email,
        firstName: finalFirstName,
        lastName: finalLastName,
        profilePic: doctorProfilePic,
      });
    } else if (doctorProfilePic && !doctor.profilePic) {
      // Update profile picture if missing
      doctor.profilePic = doctorProfilePic;
      await doctor.save();
    }

    return NextResponse.json(doctor);
  } catch (error: any) {
    console.error("Error syncing doctor to MongoDB:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
