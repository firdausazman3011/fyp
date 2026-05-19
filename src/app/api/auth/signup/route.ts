import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { validateCsrfOrThrow } from "@/lib/security";
import { fieldErrorResponse, signupSchema, toZodFieldErrors, validationErrorResponse } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const csrfError = await validateCsrfOrThrow();
    if (csrfError) return csrfError;

    const body = await request.json();
    const parsed = signupSchema.parse({
      name: String(body.name ?? "").trim(),
      email: String(body.email ?? "").toLowerCase(),
      password: String(body.password ?? ""),
    });

    if (process.env.ADMIN_EMAIL?.toLowerCase() === parsed.email) {
      return fieldErrorResponse({ email: "Admin account is pre-created and cannot sign up." }, 403);
    }

    const passwordHash = await bcrypt.hash(parsed.password, 12);

    await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        passwordHash,
        role: "USER",
      },
    });

    return NextResponse.json({ message: "Account created successfully." }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fieldErrorResponse({ email: "Email already registered." }, 409);
    }

    const validationResponse = validationErrorResponse(error);
    if (validationResponse) return validationResponse;

    const fieldErrors = toZodFieldErrors(error);
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json({ error: "Unable to create account.", fieldErrors }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
