// src/middlewares/errorHandler.ts
import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { HttpError } from "../utils/httpError";

// Prisma error codes that map to client errors.
const PRISMA_STATUS: Record<string, { status: number; message: string }> = {
  P2025: { status: 404, message: "Record not found" },
  P2002: { status: 409, message: "A record with this value already exists" },
  P2003: {
    status: 400,
    message: "Referenced record does not exist or is still in use",
  },
  P2000: { status: 400, message: "Value is too long for its field" },
  P2006: { status: 400, message: "Invalid value" },
  P2011: { status: 400, message: "A required value is missing" },
  P2023: { status: 400, message: "Invalid ID format" },
};

function toErrorResponse(err: unknown): { status: number; message: string } {
  if (err instanceof HttpError) {
    return { status: err.status, message: err.message };
  }

  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    PRISMA_STATUS[err.code]
  ) {
    return PRISMA_STATUS[err.code];
  }

  // Body-parser errors (for example malformed JSON) carry their own 4xx status.
  const status = (err as { status?: number })?.status;
  if (typeof status === "number" && status >= 400 && status < 500) {
    return { status, message: (err as Error).message };
  }

  return { status: 500, message: "Internal Server Error" };
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { status, message } = toErrorResponse(err);

  if (status >= 500) console.error("❌ Error:", err);

  res.status(status).json({ success: false, message });
}
