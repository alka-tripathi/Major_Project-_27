

import connectDB from "@/lib/mongodb";
import Patient from "@/models/Patient";

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const patient = await Patient.findById(id);

    if (!patient) {
      return Response.json(
        {
          success: false,
          error: "Patient not found",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const patient = await Patient.findByIdAndDelete(id);

    if (!patient) {
      return Response.json(
        {
          success: false,
          error: "Patient not found",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Patient deleted successfully",
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}