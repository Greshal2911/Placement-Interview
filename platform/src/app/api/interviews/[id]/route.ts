import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: interviewId } = await params;

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { module: true, user: true },
    });

    if (!interview) {
      return errorResponse("Interview not found", undefined, 404);
    }

    return successResponse(
      interview,
      "Interview details fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get interview error:", error);
    return errorResponse("Failed to fetch interview", String(error), 500);
  }
}
