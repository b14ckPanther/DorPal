import { createHmac, timingSafeEqual } from "crypto";

const GUEST_TOKEN_TTL_DAYS = 30;

export function createGuestBookingToken(appointmentId: string): string {
  const secret = process.env.GUEST_BOOKING_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "fallback-secret";
  const exp = Math.floor(Date.now() / 1000) + GUEST_TOKEN_TTL_DAYS * 24 * 60 * 60;
  const payload = Buffer.from(JSON.stringify({ appointmentId, exp }), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyGuestBookingToken(token: string): { appointmentId: string } | null {
  const secret = process.env.GUEST_BOOKING_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "fallback-secret";
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  const expectedSig = createHmac("sha256", secret).update(payloadB64).digest("base64url");
  if (expectedSig.length !== sig.length || !timingSafeEqual(Buffer.from(expectedSig, "utf8"), Buffer.from(sig, "utf8"))) {
    return null;
  }
  try {
    const raw = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (typeof raw.appointmentId !== "string" || typeof raw.exp !== "number") return null;
    if (raw.exp < Math.floor(Date.now() / 1000)) return null;
    return { appointmentId: raw.appointmentId };
  } catch {
    return null;
  }
}
