import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    const [overallProgress, moduleProgress] = await Promise.all([
      prisma.progress.findUnique({
        where: { userId },
      }),
      prisma.moduleProgress.findMany({
        where: { userId },
        include: { module: true },
        orderBy: { module: { order: "asc" } },
      }),
    ]);

    if (!overallProgress) {
      return errorResponse("Progress not found", undefined, 404);
    }

    return successResponse(
      {
        overall: overallProgress,
        modules: moduleProgress,
      },
      "Progress fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get progress error:", error);
    return errorResponse("Failed to fetch progress", String(error), 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { moduleId, completed, score } = body;

    if (!moduleId) {
      return errorResponse("Missing moduleId", undefined, 400);
    }

    const moduleProgress = await prisma.moduleProgress.updateMany({
      where: { userId, moduleId },
      data: {
        completed,
        score,
        completedAt: completed ? new Date() : null,
      },
    });

    return successResponse(
      moduleProgress,
      "Progress updated successfully",
      200,
    );
  } catch (error) {
    console.error("Update progress error:", error);
    return errorResponse("Failed to update progress", String(error), 500);
  }
}
