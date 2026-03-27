import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

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
    const body = await request.json().catch(() => ({}));
    const reason = body?.reason === "TIME_LIMIT_REACHED"
      ? "TIME_LIMIT_REACHED"
      : body?.reason === "MULTIPLE_FACES_DETECTED"
        ? "MULTIPLE_FACES_DETECTED"
        : body?.reason === "USER_NOT_VISIBLE_2S"
          ? "USER_NOT_VISIBLE_2S"
        : "MANUAL_SUBMIT";

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { module: true },
    });

    if (!interview) {
      return errorResponse("Interview not found", undefined, 404);
    }

    if (interview.status === "COMPLETED") {
      return successResponse(interview, "Interview already completed", 200);
    }

    const finalScore = computeScoreFromQna(interview.qnaLog);

    const updatedInterview = await prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        score: finalScore,
        feedback:
          reason === "TIME_LIMIT_REACHED"
            ? `Time limit reached. Final score generated from evaluated answers: ${finalScore}/10`
            : reason === "MULTIPLE_FACES_DETECTED"
              ? `Interview auto-submitted because multiple faces were detected. Final score: ${finalScore}/10`
              : reason === "USER_NOT_VISIBLE_2S"
                ? `Interview auto-submitted because user was not visible in camera for 2 seconds. Final score: ${finalScore}/10`
            : `Interview submitted successfully. Final score: ${finalScore}/10`,
      },
      include: { module: true },
    });

    return successResponse(updatedInterview, "Interview completed successfully", 200);
  } catch (error) {
    console.error("Complete interview error:", error);
    return errorResponse("Failed to complete interview", String(error), 500);
  }
}
