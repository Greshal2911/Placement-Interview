import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: questionId } = await params;
    const body = await request.json();
    const { userId, selectedOption, code } = body;

    if (!userId || (!selectedOption && !code)) {
      return errorResponse("Missing required fields", undefined, 400);
    }

    // Get question details
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        mcqOptions: true,
        codeChallenge: true,
      },
    });

    if (!question) {
      return errorResponse("Question not found", undefined, 404);
    }

    let isCorrect = false;
    let score = 0;

    // Validate answer based on question type
    if (question.type === "MCQ") {
      const correctOption = question.mcqOptions.find((opt) => opt.isCorrect);
      isCorrect = correctOption?.id === selectedOption;
      score = isCorrect ? 10 : 0;
    } else if (question.type === "CODE") {
      // Basic code validation (in production, execute code against test cases)
      isCorrect = code && code.trim().length > 0;
      score = isCorrect ? 10 : 0;
    }

    // Store user answer
    const userAnswer = await prisma.userAnswer.create({
      data: {
        userId,
        questionId,
        selectedOption: selectedOption || null,
        code: code || null,
        isCorrect,
        score,
      },
    });

    // Update module progress
    const question2 = await prisma.question.findUnique({
      where: { id: questionId },
      select: { moduleId: true },
    });

    const moduleProgress = await prisma.moduleProgress.findUnique({
      where: { userId_moduleId: { userId, moduleId: question2!.moduleId } },
    });

    if (moduleProgress) {
      await prisma.moduleProgress.update({
        where: { id: moduleProgress.id },
        data: {
          questionsAttempted: moduleProgress.questionsAttempted + 1,
          questionsCorrect:
            moduleProgress.questionsCorrect + (isCorrect ? 1 : 0),
          score: moduleProgress.score + score,
        },
      });
    }

    return successResponse(
      {
        userAnswer,
        isCorrect,
        score,
      },
      "Answer submitted successfully",
      201,
    );
  } catch (error) {
    console.error("Submit answer error:", error);
    return errorResponse("Failed to submit answer", String(error), 500);
  }
}
