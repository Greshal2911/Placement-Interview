import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const normalizedEmail = normalizeEmailFromParam(userId);

    // Resolve or create the user in the database so progress can be tracked
    let user = normalizedEmail
      ? await prisma.user.findUnique({ where: { email: normalizedEmail } })
      : await prisma.user.findUnique({ where: { id: userId } });

    if (!user && normalizedEmail) {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: normalizedEmail.split("@")[0],
          password: "",
        },
      });
    }

    if (!user) {
      return errorResponse("User not found", undefined, 404);
    }

    let overallProgress = await prisma.progress.findUnique({
      where: { userId: user.id },
    });

    if (!overallProgress) {
      overallProgress = await prisma.progress.create({
        data: {
          userId: user.id,
          totalQuestionsAttempted: 0,
          totalCorrect: 0,
          overallScore: 0,
        },
      });
    }

    let moduleProgress = await prisma.moduleProgress.findMany({
      where: { userId: user.id },
      include: { module: true },
      orderBy: { module: { order: "asc" } },
    });

    if (!moduleProgress.length) {
      const modules = await prisma.module.findMany({ select: { id: true } });

      // Neon HTTP mode does not support transactional behavior used by upsert,
      // so initialize progress rows with explicit read/create operations.
      for (const module of modules) {
        const existing = await prisma.moduleProgress.findFirst({
          where: {
            userId: user.id,
            moduleId: module.id,
          },
          select: { id: true },
        });

        if (!existing) {
          try {
            await prisma.moduleProgress.create({
              data: {
                userId: user.id,
                moduleId: module.id,
              },
            });
          } catch (createError) {
            // Ignore duplicate row races from concurrent requests.
            if (
              !(createError instanceof Prisma.PrismaClientKnownRequestError) ||
              createError.code !== "P2002"
            ) {
              throw createError;
            }
          }
        }
      }

      moduleProgress = await prisma.moduleProgress.findMany({
        where: { userId: user.id },
        include: { module: true },
        orderBy: { module: { order: "asc" } },
      });
    }

    return successResponse(
      {
        overall: overallProgress,
        modules: moduleProgress,
      },
      "Progress fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get progress error:", error);
    return errorResponse("Failed to fetch progress", String(error), 500);
  }
}

function normalizeEmailFromParam(userId: string) {
  if (userId.startsWith("user_") && userId.includes("@")) {
    return userId.slice("user_".length);
  }

  if (userId.includes("@")) {
    return userId;
  }

  return null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { moduleId, completed, score } = body;

    if (!moduleId) {
      return errorResponse("Missing moduleId", undefined, 400);
    }

    const moduleProgress = await prisma.moduleProgress.updateMany({
      where: { userId, moduleId },
      data: {
        completed,
        score,
        completedAt: completed ? new Date() : null,
      },
    });

    return successResponse(
      moduleProgress,
      "Progress updated successfully",
      200,
    );
  } catch (error) {
    console.error("Update progress error:", error);
    return errorResponse("Failed to update progress", String(error), 500);
  }
}
