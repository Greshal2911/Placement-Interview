import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

type DailyPoint = {
  day: string;
  attempted: number;
  solved: number;
};

function normalizeEmailFromParam(userId: string) {
  if (userId.startsWith("user_") && userId.includes("@")) {
    return userId.slice("user_".length);
  }

  if (userId.includes("@")) {
    return userId;
  }

  return null;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayLabel(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function getCurrentStreak(answerDates: Date[]) {
  if (!answerDates.length) return 0;

  const solvedDays = new Set(answerDates.map((date) => toDateKey(date)));
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  let streak = 0;
  while (solvedDays.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function buildLast7DaysProgress(answerRows: Array<{ createdAt: Date; isCorrect: boolean }>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets = new Map<string, DailyPoint>();

  for (let index = 6; index >= 0; index -= 1) {
    const dayDate = new Date(today);
    dayDate.setDate(today.getDate() - index);

    buckets.set(toDateKey(dayDate), {
      day: dayLabel(dayDate),
      attempted: 0,
      solved: 0,
    });
  }

  for (const row of answerRows) {
    const key = toDateKey(row.createdAt);
    const bucket = buckets.get(key);
    if (!bucket) continue;

    bucket.attempted += 1;
    if (row.isCorrect) {
      bucket.solved += 1;
    }
  }

  return Array.from(buckets.values());
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const normalizedEmail = normalizeEmailFromParam(userId);

    const user = normalizedEmail
      ? await prisma.user.findUnique({ where: { email: normalizedEmail } })
      : await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return errorResponse("User not found", undefined, 404);
    }

    const startOfWindow = new Date();
    startOfWindow.setHours(0, 0, 0, 0);
    startOfWindow.setDate(startOfWindow.getDate() - 6);

    const [
      totalAttempted,
      totalSolved,
      modules,
      moduleProgressRows,
      interviews,
      answersForDaily,
      answersForStreak,
    ] = await Promise.all([
      prisma.userAnswer.count({ where: { userId: user.id } }),
      prisma.userAnswer.count({ where: { userId: user.id, isCorrect: true } }),
      prisma.module.findMany({
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          _count: {
            select: {
              questions: true,
            },
          },
        },
      }),
      prisma.moduleProgress.findMany({
        where: { userId: user.id },
        select: {
          moduleId: true,
          questionsAttempted: true,
          questionsCorrect: true,
        },
      }),
      prisma.interview.findMany({
        where: { userId: user.id },
        select: {
          startedAt: true,
          completedAt: true,
          status: true,
        },
      }),
      prisma.userAnswer.findMany({
        where: {
          userId: user.id,
          createdAt: {
            gte: startOfWindow,
          },
        },
        select: {
          createdAt: true,
          isCorrect: true,
        },
      }),
      prisma.userAnswer.findMany({
        where: { userId: user.id, isCorrect: true },
        orderBy: { createdAt: "desc" },
        take: 400,
        select: {
          createdAt: true,
        },
      }),
    ]);

    const moduleProgressById = new Map(
      moduleProgressRows.map((row) => [row.moduleId, row]),
    );

    const moduleStats = modules.map((module) => {
      const row = moduleProgressById.get(module.id);
      const attempted = row?.questionsAttempted ?? 0;
      const solved = row?.questionsCorrect ?? 0;
      const totalQuestions = module._count.questions;

      return {
        moduleId: module.id,
        name: module.title,
        totalQuestions,
        attempted,
        solved,
        remaining: Math.max(totalQuestions - solved, 0),
      };
    });

    const totalInterviewMs = interviews.reduce((acc, interview) => {
      if (!interview.startedAt) return acc;

      const end = interview.completedAt ??
        (interview.status === "IN_PROGRESS" ? new Date() : null);
      if (!end) return acc;

      const diff = end.getTime() - interview.startedAt.getTime();
      return acc + Math.max(diff, 0);
    }, 0);

    // Interview time can be zero for users doing only practice questions.
    // Add a conservative estimate per attempted question so the time metric remains dynamic.
    const estimatedPracticeMinutes = totalAttempted * 5;
    const totalTimeMinutes = Math.max(
      Math.round(totalInterviewMs / 60000),
      estimatedPracticeMinutes,
    );
    const accuracy = totalAttempted > 0
      ? Math.round((totalSolved / totalAttempted) * 100)
      : 0;

    const dailyProgress = buildLast7DaysProgress(answersForDaily);
    const currentStreak = getCurrentStreak(
      answersForStreak.map((answer) => answer.createdAt),
    );

    return successResponse(
      {
        summary: {
          totalAttempted,
          totalSolved,
          accuracy,
          totalTimeMinutes,
          currentStreak,
        },
        modules: moduleStats,
        dailyProgress,
      },
      "Analytics fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get analytics error:", error);
    return errorResponse("Failed to fetch analytics", String(error), 500);
  }
}
