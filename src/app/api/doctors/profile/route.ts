import connectDB from "@/lib/mongodb";
import Doctor from "@/models/Doctor";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const firebaseUid = searchParams.get("firebaseUid");

    if (!firebaseUid) {
      return NextResponse.json({ success: false, error: "Missing firebaseUid" }, { status: 400 });
    }

    const doctor = await Doctor.findOne({ firebaseUid });

    if (!doctor) {
      return NextResponse.json({ success: false, error: "Doctor not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, doctor });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { firebaseUid, firstName, lastName, ...rest } = body;

    if (!firebaseUid) {
      return NextResponse.json({ success: false, error: "Missing firebaseUid" }, { status: 400 });
    }

    const name = `${firstName} ${lastName}`.trim();

    const updatedDoctor = await Doctor.findOneAndUpdate(
      { firebaseUid },
      { name, ...rest },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, doctor: updatedDoctor });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
