import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "it-asset-mgmt-secret-key-2024";

export interface JwtPayload {
  id: number;
  employeeId: string;
  role: string;
  name: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
