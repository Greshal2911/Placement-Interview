import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const module = await prisma.module.findUnique({
      where: { id },
      include: {
        concepts: {
          orderBy: { order: "asc" },
        },
        questions: {
          include: {
            mcqOptions: true,
            codeChallenge: true,
          },
          orderBy: { order: "asc" },
        },
        _count: {
          select: { questions: true, concepts: true },
        },
      },
    });

    if (!module) {
      return errorResponse("Module not found", undefined, 404);
    }

    return successResponse(module, "Module details fetched successfully", 200);
  } catch (error) {
    console.error("Get module error:", error);
    return errorResponse("Failed to fetch module", String(error), 500);
  }
}
