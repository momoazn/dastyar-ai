import type { Context } from "hono";
import { getConnInfo } from "hono/bun";

const tryHeader = (context: Context, headerName: string): string | null => {
  const value = context.req.header(headerName)?.trim();
  if (!value) {
    return null;
  }
  return value;
};

const parseForwardedFor = (value: string): string | null => {
  const first = value.split(",").at(0)?.trim();
  return first && first.length > 0 ? first : null;
};

const normalizeIp = (raw: string): string => {
  // Bun/Hono on localhost can expose IPv4-mapped IPv6 (::ffff:127.0.0.1)
  if (raw.startsWith("::ffff:")) {
    return raw.slice("::ffff:".length);
  }
  if (raw === "::1") {
    return "127.0.0.1";
  }
  return raw;
};

const parseForwardedHeader = (value: string): string | null => {
  // RFC 7239: Forwarded: for=203.0.113.43
  for (const part of value.split(";")) {
    const [key, raw] = part.split("=");
    if (key?.trim().toLowerCase() !== "for") {
      continue;
    }
    const normalized = raw?.trim().replaceAll('"', "") ?? "";
    if (normalized.length === 0) {
      continue;
    }
    const withoutPort = normalized.startsWith("[")
      ? normalized
      : (normalized.split(":").at(0) ?? normalized);
    return withoutPort;
  }
  return null;
};

export function getClientIpFromContext(context: Context): string | null {
  const directHeaders = ["cf-connecting-ip", "x-real-ip", "x-client-ip"];

  for (const headerName of directHeaders) {
    const headerValue = tryHeader(context, headerName);
    if (headerValue) {
      return headerValue;
    }
  }

  const xForwardedFor = tryHeader(context, "x-forwarded-for");
  if (xForwardedFor) {
    const ip = parseForwardedFor(xForwardedFor);
    if (ip) {
      return ip;
    }
  }

  const forwarded = tryHeader(context, "forwarded");
  if (forwarded) {
    const ip = parseForwardedHeader(forwarded);
    if (ip) {
      return normalizeIp(ip);
    }
  }

  const connInfo = getConnInfo(context);
  if (connInfo.remote.address) {
    return normalizeIp(connInfo.remote.address);
  }

  const fallback = context.req.raw.headers.get("x-forwarded-for");
  if (fallback) {
    const ip = parseForwardedFor(fallback);
    if (ip) {
      return normalizeIp(ip);
    }
  }

  return null;
}
