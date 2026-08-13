import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Patient from "@/models/Patient";
import Doctor from "@/models/Doctor";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    await connectDB();

    const { id } = await context.params;

    const patient = await Patient.findOne({ _id: id });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: "Patient not found",
        },
        { status: 404 }
      );
    }

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
      { status: 500 }
    );
  }
}

// api for delete patient details
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    await connectDB();

    const { id } = await context.params;

    const patient = await Patient.findByIdAndDelete(id);

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: "Patient not found",
        },
        { status: 404 }
      );
    }

    // Remove the patient from the Doctor's patients list
    await Doctor.findOneAndUpdate(
      { firebaseUid: patient.doctorId },
      { $pull: { patients: { _id: id } } }
    );

    return NextResponse.json({
      success: true,
      message: "Patient deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
