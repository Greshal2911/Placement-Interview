import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const subjectId = id;
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            concepts: {
              orderBy: { order: "asc" },
            },
            _count: {
              select: { questions: true, concepts: true },
            },
          }
        },
      }
    });

    if (!subject) {
      return errorResponse("Subject not found", "Not Found", 404);
    }
    
    return successResponse(subject, "Subject fetched successfully", 200);
  } catch (error) {
    console.error("Get subject error:", error);
    return errorResponse("Failed to fetch subject", String(error), 500);
  }
}
