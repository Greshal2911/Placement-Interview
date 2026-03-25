import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { evaluateAnswer, generateFollowUpQuestion } from "@/lib/gemini";

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

    // Generate follow-up question if needed
    let nextQuestion = null;
    if (questionIndex < qnaLog.length - 1) {
      nextQuestion = qnaLog[questionIndex + 1];
    } else if (evaluation.followUpQuestion) {
      nextQuestion = {
        question: evaluation.followUpQuestion,
        isFollowUp: true,
      };
      updatedQnaLog.push(nextQuestion);
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
      // Calculate total score
      let totalScore = 0;
      const allResponses = updatedQnaLog;
      for (const item of allResponses) {
        if (item.evaluation?.score) {
          totalScore += item.evaluation.score;
        }
      }

      updatedInterview = await prisma.interview.update({
        where: { id: interviewId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          score: Math.round(totalScore / allResponses.length),
          feedback: `Interview completed. Total Score: ${Math.round(totalScore / allResponses.length)}/10`,
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
