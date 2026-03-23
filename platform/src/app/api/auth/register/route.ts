
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, password } = body;

    // Validation
    if (!email || !name || !password) {
      return errorResponse(
        "Missing required fields: email, name, password",
        undefined,
        400,
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return errorResponse(
        "User already exists with this email",
        undefined,
        409,
      );
    }

    // Hash password (for production, use bcryptjs)
    // const hashedPassword = await hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password, // In production, hash the password
        role: "student",
      },
    });

    return successResponse(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      "User registered successfully",
      201,
    );
  } catch (error) {
    console.error("Register error:", error);
    return errorResponse("Registration failed", String(error), 500);
  }
}
