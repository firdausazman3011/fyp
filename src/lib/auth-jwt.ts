import { SignJWT, jwtVerify } from "jose";

const TOKEN_AGE_SECONDS = 60 * 60 * 24 * 7;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return new TextEncoder().encode(secret);
}

export type AuthPayload = {
  userId: string;
  role: "USER" | "ADMIN";
  email: string;
  name: string;
  profilePicture: string | null;
};

function parseAuthPayload(payload: Record<string, unknown>): AuthPayload | null {
  if (
    typeof payload.userId !== "string" ||
    typeof payload.email !== "string" ||
    (payload.role !== "USER" && payload.role !== "ADMIN")
  ) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    name: typeof payload.name === "string" && payload.name.trim() ? payload.name : "User",
    profilePicture: typeof payload.profilePicture === "string" ? payload.profilePicture : null,
  };
}

export async function createAuthToken(payload: AuthPayload): Promise<string> {
  return await new SignJWT({
    userId: payload.userId,
    role: payload.role,
    email: payload.email,
    name: payload.name,
    profilePicture: payload.profilePicture,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_AGE_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifyAuthToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return parseAuthPayload(payload as Record<string, unknown>);
  } catch {
    return null;
  }
}
