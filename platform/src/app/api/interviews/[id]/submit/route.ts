import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { evaluateAnswer } from "@/lib/gemini";

function computeScoreFromQna(qnaLog: unknown): number {
  const rows = Array.isArray(qnaLog) ? qnaLog : [];
  const scored = rows
    .map((row) => {
      if (typeof row !== "object" || row === null) {
        return null;
      }

      const evaluation = (row as { evaluation?: { score?: number } }).evaluation;
      if (!evaluation || typeof evaluation.score !== "number") {
        return null;
      }

      return Math.max(0, Math.min(10, Math.round(evaluation.score)));
    })
    .filter((value): value is number => value !== null);

  if (!scored.length) {
    return 0;
  }

  const total = scored.reduce((acc, value) => acc + value, 0);
  return Math.round(total / scored.length);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: interviewId } = await params;
    const body = await request.json();
    const { questionIndex, userResponse } = body;

    if (questionIndex === undefined || !userResponse) {
      return errorResponse("Missing required fields", undefined, 400);
    }

    // Get interview
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { module: true },
    });

    if (!interview) {
      return errorResponse("Interview not found", undefined, 404);
    }

    if (interview.status !== "IN_PROGRESS") {
      return errorResponse("Interview is not in progress", undefined, 400);
    }

    const qnaLog = (Array.isArray(interview.qnaLog) ? interview.qnaLog : []) as any[];
    const currentQuestion = qnaLog[questionIndex];

    if (!currentQuestion) {
      return errorResponse("Question not found at this index", undefined, 404);
    }

    // Evaluate answer using Gemini
    const evaluation = await evaluateAnswer(
      currentQuestion.question,
      userResponse,
      interview.module.title,
    );

    // Store evaluation in qnaLog
    const updatedQnaLog = [...qnaLog];
    updatedQnaLog[questionIndex] = {
      ...currentQuestion,
      userResponse,
      evaluation,
    };

    // Move to next generated question only (fixed test length).
    let nextQuestion = null;
    if (questionIndex < qnaLog.length - 1) {
      nextQuestion = qnaLog[questionIndex + 1];
    }

    // Update interview with new qnaLog
    let updatedInterview = await prisma.interview.update({
      where: { id: interviewId },
      data: {
        qnaLog: updatedQnaLog as any,
      },
      include: { module: true },
    });

    // Check if interview should end
    let isComplete = false;
    if (questionIndex === qnaLog.length - 1 && !nextQuestion) {
      const finalScore = computeScoreFromQna(updatedQnaLog);

      updatedInterview = await prisma.interview.update({
        where: { id: interviewId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          score: finalScore,
          feedback: `Interview completed. Final score: ${finalScore}/10`,
        },
        include: { module: true },
      });
      isComplete = true;
    }

    return successResponse(
      {
        currentEvaluation: evaluation,
        nextQuestion,
        isComplete,
        interview: updatedInterview,
      },
      "Response submitted successfully",
      200,
    );
  } catch (error) {
    console.error("Submit interview response error:", error);
    return errorResponse("Failed to submit response", String(error), 500);
  }
}
