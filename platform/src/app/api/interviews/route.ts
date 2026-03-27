import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateInterviewQuestions } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, moduleId } = body;

    if (!userId || !moduleId) {
      return errorResponse("Missing required fields", undefined, 400);
    }

    // Get module details
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { concepts: true },
    });

    if (!module) {
      return errorResponse("Module not found", undefined, 404);
    }

    // Generate interview questions using Gemini
    const conceptNames = module.concepts.map((c) => c.title);
    const interviewQuestions = await generateInterviewQuestions(
      module.title,
      conceptNames,
      5
    );

    // Create interview session
    const interview = await prisma.interview.create({
      data: {
        userId,
        moduleId,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        qnaLog: interviewQuestions as any,
      },
    });

    return successResponse(
      {
        interviewId: interview.id,
        questions: interviewQuestions,
      },
      "Interview started successfully",
      201
    );
  } catch (error) {
    console.error("Start interview error:", error);
    return errorResponse("Failed to start interview", String(error), 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return errorResponse("Missing userId parameter", undefined, 400);
    }

    const interviews = await prisma.interview.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { module: true },
    });

    return successResponse(interviews, "Interviews fetched successfully", 200);
  } catch (error) {
    console.error("Get interviews error:", error);
    return errorResponse("Failed to fetch interviews", String(error), 500);
  }
}
