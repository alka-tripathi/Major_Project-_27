import connectDB from "@/lib/mongodb";
import Doctor from "@/models/Doctor";
import { isAdmin } from "@/lib/adminAuth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email || !isAdmin(email)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 403 }
      );
    }

    const doctors = await Doctor.find({}).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: doctors,
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
