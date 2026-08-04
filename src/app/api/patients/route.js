// import connectDB from "@/lib/mongodb";
// import Patient from "@/models/Patient";

// export async function POST(req) {
//   try {
//     await connectDB();

//     const body = await req.json();

//     const patient = await Patient.create(body);

//     return Response.json({
//       success: true,
//       data: patient,
//     });
//   } catch (error) {
//     return Response.json(
//       { success: false, error: error.message },
//       { status: 500 }
//     );
//   }
// }

import connectDB from "@/lib/mongodb";
import Patient from "@/models/Patient";

// get patients
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");

    const patients = await Patient.find({
      doctorId,
    }).sort({ createdAt: -1 });

    return Response.json({
      success: true,
      data: patients,
    });
  } catch (error) {
    return Response.json(
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
export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const patient = await Patient.create(body);

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
      {
        status: 500,
      }
    );
  }
}