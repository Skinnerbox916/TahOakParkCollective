import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validation
    if (!email || !password) {
      return createErrorResponse("Email and password are required", 400);
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse("Invalid email format", 400);
    }

    // Password strength validation (minimum 8 characters)
    if (password.length < 8) {
      return createErrorResponse("Password must be at least 8 characters long", 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return createErrorResponse("An account with this email already exists", 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with default USER role
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        roles: [ROLE.USER],
      },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
      },
    });

    return createSuccessResponse(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
      "Account created successfully"
    );
  } catch (error) {
    console.error("Error creating user:", error);
    
    // Handle Prisma unique constraint errors
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return createErrorResponse("An account with this email already exists", 409);
    }

    return createErrorResponse("Failed to create account. Please try again.", 500);
  }
}

