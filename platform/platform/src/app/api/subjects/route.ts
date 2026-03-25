import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { modules: true },
        },
      },
    });
    return successResponse(subjects, "Subjects fetched successfully", 200);
  } catch (error) {
    console.error("Get subjects error:", error);
    return errorResponse("Failed to fetch subjects", String(error), 500);
  }
}
