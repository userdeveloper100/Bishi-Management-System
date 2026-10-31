// src/utils/validation.ts
import { badRequest } from "./httpError";

export function requireString(value: unknown, field: string): string {
    if (typeof value !== "string" || value.trim() === "") {
        throw badRequest(`${field} is required`);
    }
    return value;
}

export function optionalString(value: unknown, field: string): string | undefined {
    if (value === undefined) return undefined;
    if (typeof value !== "string") throw badRequest(`${field} must be a string`);
    return value;
}

export function requireNumber(value: unknown, field: string): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw badRequest(`${field} must be a number`);
    }
    return value;
}

export function optionalNumber(value: unknown, field: string): number | undefined {
    if (value === undefined) return undefined;
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw badRequest(`${field} must be a number`);
    }
    return value;
}

export function requireEmail(value: unknown, field: string): string {
    const email = requireString(value, field);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw badRequest(`${field} must be a valid email`);
    }
    return email;
}
