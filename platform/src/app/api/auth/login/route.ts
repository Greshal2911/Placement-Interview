import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return errorResponse(
        "Missing required fields: email, password",
        undefined,
        400,
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
      },
    });

    if (!user) {
      return errorResponse("User not found", undefined, 404);
    }

    // Verify password (in production, use bcryptjs)
    if (user.password !== password) {
      return errorResponse("Invalid credentials", undefined, 401);
    }

    // In production, generate JWT token here
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString("base64");

    return successResponse(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        token,
      },
      "Login successful",
      200,
    );
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("Login failed", String(error), 500);
  }
}
