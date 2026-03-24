import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { CodeTestCase, evaluateCodeWithJudge0 } from "@/lib/judge0";

function isCodeTestCaseArray(value: unknown): value is CodeTestCase[] {
  if (!Array.isArray(value)) return false;

  return value.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "input" in item &&
      "output" in item &&
      typeof item.input === "string" &&
      typeof item.output === "string",
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: questionId } = await params;
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return errorResponse("Code is required", undefined, 400);
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { codeChallenge: true },
    });

    if (!question) {
      return errorResponse("Question not found", undefined, 404);
    }

    if (question.type !== "CODE") {
      return errorResponse("Sandbox run is only supported for CODE questions", undefined, 400);
    }

    if (!question.codeChallenge) {
      return errorResponse("Code challenge details not found", undefined, 400);
    }

    if (!isCodeTestCaseArray(question.codeChallenge.testCases)) {
      return errorResponse("Invalid test cases configured for this challenge", undefined, 500);
    }

    const evaluation = await evaluateCodeWithJudge0(
      code,
      question.codeChallenge.language,
      question.codeChallenge.testCases,
    );

    return successResponse(
      {
        passedCount: evaluation.passedCount,
        totalCount: evaluation.totalCount,
        testResults: evaluation.testResults,
      },
      "Sandbox run completed",
      200,
    );
  } catch (error) {
    console.error("Sandbox run error:", error);
    return errorResponse("Failed to run code in sandbox", String(error), 500);
  }
}