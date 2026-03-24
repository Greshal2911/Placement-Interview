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
    let codeExecutionResult:
      | {
          passedCount: number;
          totalCount: number;
          testResults: Array<{
            input: string;
            expectedOutput: string;
            actualOutput: string;
            passed: boolean;
            status: { id: number; description: string };
            stderr?: string;
            compileOutput?: string;
            runtimeError?: string;
            time?: string;
            memory?: number;
          }>;
        }
      | undefined;
    let evaluatedOutput: string | null = null;

    // Validate answer based on question type
    if (question.type === "MCQ") {
      const correctOption = question.mcqOptions.find((opt) => opt.isCorrect);
      isCorrect = correctOption?.id === selectedOption;
      score = isCorrect ? 10 : 0;
    } else if (question.type === "CODE") {
      if (!question.codeChallenge) {
        return errorResponse("Code challenge details not found", undefined, 400);
      }

      if (!code || !code.trim()) {
        return errorResponse("Code is required for code challenge", undefined, 400);
      }

      if (!isCodeTestCaseArray(question.codeChallenge.testCases)) {
        return errorResponse("Invalid test cases configured for this challenge", undefined, 500);
      }

      const evaluation = await evaluateCodeWithJudge0(
        code,
        question.codeChallenge.language,
        question.codeChallenge.testCases,
      );

      isCorrect = evaluation.allPassed;
      score = Math.round((evaluation.passedCount / evaluation.totalCount) * 10);
      codeExecutionResult = {
        passedCount: evaluation.passedCount,
        totalCount: evaluation.totalCount,
        testResults: evaluation.testResults,
      };
      evaluatedOutput = evaluation.testResults
        .map((result, index) => {
          const status = result.passed ? "PASS" : "FAIL";
          const diagnostics = [result.compileOutput, result.stderr, result.runtimeError]
            .filter(Boolean)
            .join(" | ");

          return `Case ${index + 1}: ${status} | expected=${result.expectedOutput} | actual=${result.actualOutput}${diagnostics ? ` | ${diagnostics}` : ""}`;
        })
        .join("\n");
    }

    // Store user answer
    const userAnswer = await prisma.userAnswer.create({
      data: {
        userId,
        questionId,
        selectedOption: selectedOption || null,
        code: code || null,
        output: evaluatedOutput,
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
        codeExecutionResult,
      },
      "Answer submitted successfully",
      201,
    );
  } catch (error) {
    console.error("Submit answer error:", error);
    return errorResponse("Failed to submit answer", String(error), 500);
  }
}
