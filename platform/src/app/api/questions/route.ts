import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get("moduleId");
    const type = searchParams.get("type");
    const difficulty = searchParams.get("difficulty");
    const limit = searchParams.get("limit") || "10";

    const whereClause: any = {};

    if (moduleId) whereClause.moduleId = moduleId;
    if (type) whereClause.type = type;
    if (difficulty) whereClause.difficulty = difficulty;

    const questions = await prisma.question.findMany({
      where: whereClause,
      include: {
        mcqOptions: {
          orderBy: { order: "asc" },
          select: { id: true, text: true, order: true },
        },
        codeChallenge: true,
      },
      take: parseInt(limit),
    });

    return successResponse(questions, "Questions fetched successfully", 200);
  } catch (error) {
    console.error("Get questions error:", error);
    return errorResponse("Failed to fetch questions", String(error), 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, type, moduleId, difficulty, mcqOptions, codeChallenge } = body;

    if (!title || !description || !type || !moduleId) {
      return errorResponse("Missing required fields", undefined, 400);
    }

    const question = await prisma.question.create({
      data: {
        title,
        description,
        type,
        moduleId,
        difficulty: difficulty || "Medium",
        mcqOptions: mcqOptions ? { create: mcqOptions } : undefined,
        codeChallenge: codeChallenge ? { create: codeChallenge } : undefined,
      },
      include: {
        mcqOptions: true,
        codeChallenge: true,
      },
    });

    return successResponse(question, "Question created successfully", 201);
  } catch (error) {
    console.error("Create question error:", error);
    return errorResponse("Failed to create question", String(error), 500);
  }
}
