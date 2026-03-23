import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const modules = await prisma.module.findMany({
      orderBy: { order: "asc" },
      include: {
        concepts: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { questions: true, concepts: true },
        },
      },
    });

    return successResponse(modules, "Modules fetched successfully", 200);
  } catch (error) {
    console.error("Get modules error:", error);
    return errorResponse("Failed to fetch modules", String(error), 500);
  }
}
