import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Patient from "@/models/Patient";
import Doctor from "@/models/Doctor";

// get patients
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");

    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: "doctorId is required" },
        { status: 400 }
      );
    }

    const patients = await Patient.find({
      doctorId,
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: patients,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}

// create patient
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const patient = await Patient.create(body);

    // Link the patient to the Doctor document as an embedded subdocument
    await Doctor.findOneAndUpdate(
      { firebaseUid: body.doctorId },
      { $push: { patients: patient.toObject() } }
    );

    return NextResponse.json({
      success: true,
      data: patient,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
