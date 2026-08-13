import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Doctor from "@/models/Doctor";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const firebaseUid = searchParams.get("firebaseUid");

    if (!firebaseUid) {
      return NextResponse.json(
        { success: false, message: "Missing firebaseUid" },
        { status: 400 }
      );
    }

    const doctor = await Doctor.findOne({ firebaseUid });
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "Doctor not found" },
        { status: 404 }
      );
    }

    // Handle legacy schema where 'name' was used instead of 'firstName' and 'lastName'
    let responseDoctor = doctor.toObject() as any;
    if (responseDoctor.name && !responseDoctor.firstName && !responseDoctor.lastName) {
      const parts = responseDoctor.name.split(" ");
      responseDoctor.firstName = parts[0] || "";
      responseDoctor.lastName = parts.slice(1).join(" ") || "";
    }

    return NextResponse.json({ success: true, doctor: responseDoctor });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { firebaseUid, email, firstName, lastName, phone, hospitalName, specialization, profilePic } = body;

    if (!firebaseUid) {
      return NextResponse.json(
        { success: false, message: "Missing firebaseUid" },
        { status: 400 }
      );
    }

    const doctor = await Doctor.findOneAndUpdate(
      { firebaseUid },
      {
        $set: {
          firstName,
          lastName,
          phone,
          hospitalName,
          specialization,
          profilePic,
        },
        $setOnInsert: {
          email, // Only set email if creating a new document
        },
      },
      { new: true, runValidators: true, upsert: true }
    );

    return NextResponse.json({ success: true, doctor });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
