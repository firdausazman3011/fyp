import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { signupSchema, toZodErrorMessage } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.parse({
      email: String(body.email ?? "").toLowerCase(),
      password: String(body.password ?? ""),
    });

    if (process.env.ADMIN_EMAIL?.toLowerCase() === parsed.email) {
      return NextResponse.json({ error: "Admin account is pre-created and cannot sign up." }, { status: 403 });
    }

    const passwordHash = await bcrypt.hash(parsed.password, 12);

    await prisma.user.create({
      data: {
        email: parsed.email,
        passwordHash,
        role: "USER",
      },
    });

    return NextResponse.json(
      { message: "Account created. You can now login." },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    const message = toZodErrorMessage(error);
    const status = message === "Invalid input." ? 500 : 400;

    return NextResponse.json(
      { error: status === 500 ? "Unable to create account." : message },
      { status },
    );
  }
}
