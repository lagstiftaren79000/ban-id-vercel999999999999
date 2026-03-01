/**
 * vercel-helpers.ts
 *
 * Ready-to-use Vercel API route handlers for BankID authentication.
 *
 * HOW IT WORKS ON VERCEL
 * ─────────────────────────────────────────────────────────────────
 * Because Vercel serverless functions can time out (10s Hobby, 60s Pro),
 * we can't use `awaitPendingCollect()` which blocks for up to 90 seconds.
 *
 * Instead we split the flow into three thin API routes:
 *   POST /api/bankid/auth    → starts an auth order, returns orderRef
 *   POST /api/bankid/collect → polls once for a given orderRef
 *   POST /api/bankid/cancel  → cancels an order
 *
 * The browser polls /collect every 2 s until status is "complete" or "failed".
 *
 * ENVIRONMENT VARIABLES
 * ─────────────────────────────────────────────────────────────────
 *   BANKID_PFX_BASE64   base64-encoded .p12 certificate
 *   BANKID_PASSPHRASE   certificate passphrase
 *   BANKID_PRODUCTION   "true" for production BankID, anything else → test
 *
 * To base64-encode your certificate:
 *   macOS/Linux:  base64 -i your-cert.p12 | tr -d '\n'
 *   Windows PS:   [Convert]::ToBase64String([IO.File]::ReadAllBytes('your-cert.p12'))
 *
 * STATIC IP REQUIREMENT (production only)
 * ─────────────────────────────────────────────────────────────────
 * BankID production requires a whitelisted static IP.
 * Vercel functions use dynamic IPs, so route outbound traffic through a
 * static-IP proxy (e.g. Fixie, Quotaguard, or your own NAT gateway):
 *   FIXIE_URL=http://user:pass@hopper-XX.usefixie.com:80
 * Then configure axios to use it (see README).
 *
 * USAGE EXAMPLE (Next.js App Router)
 * ─────────────────────────────────────────────────────────────────
 *   // app/api/bankid/auth/route.ts
 *   import { bankidAuthHandler } from "@/lib/bankid/vercel-helpers";
 *   export const POST = bankidAuthHandler;
 *
 *   // app/api/bankid/collect/route.ts
 *   import { bankidCollectHandler } from "@/lib/bankid/vercel-helpers";
 *   export const POST = bankidCollectHandler;
 *
 *   // app/api/bankid/cancel/route.ts
 *   import { bankidCancelHandler } from "@/lib/bankid/vercel-helpers";
 *   export const POST = bankidCancelHandler;
 */

import { NextRequest, NextResponse } from "next/server";
import { BankIdClient, BankIdClientV6 } from "./bankid";

// ─── Singleton client (reused across warm invocations) ───────────────────────

let _client: BankIdClient | null = null;

/**
 * Returns a cached BankIdClient built from env vars.
 * Use BankIdClientV6 if you need QR codes.
 */
export function getBankIdClient(): BankIdClient {
  if (!_client) {
    _client = BankIdClient.fromEnv();
  }
  return _client;
}

export function getBankIdClientV6(): BankIdClientV6 {
  return BankIdClientV6.fromEnv();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Gets the real client IP from Vercel request headers.
 * BankID requires the end user's actual IP address.
 */
export function getEndUserIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1"
  );
}

// ─── Route handlers ───────────────────────────────────────────────────────────

/**
 * POST /api/bankid/auth
 *
 * Body (optional):
 *   { personalNumber?: string, userVisibleData?: string }
 *
 * Returns:
 *   { orderRef, autoStartToken, qrStartToken, qrStartSecret }
 */
export async function bankidAuthHandler(req: NextRequest): Promise<NextResponse> {
  try {
    const client = getBankIdClient();
    const body = await req.json().catch(() => ({}));
    const endUserIp = getEndUserIp(req);

    const response = await client.authenticate({
      endUserIp,
      personalNumber: body.personalNumber,
      userVisibleData: body.userVisibleData,
    });

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("[BankID] auth error:", err);
    return NextResponse.json(
      { error: err?.code ?? "UNKNOWN_ERROR", details: err?.message },
      { status: 500 },
    );
  }
}

/**
 * POST /api/bankid/collect
 *
 * Body:
 *   { orderRef: string }
 *
 * Returns the raw BankID collect response:
 *   { status: "pending" | "complete" | "failed", hintCode?, completionData? }
 *
 * The client should call this every ~2 seconds until status !== "pending".
 */
export async function bankidCollectHandler(req: NextRequest): Promise<NextResponse> {
  try {
    const client = getBankIdClient();
    const { orderRef } = await req.json();

    if (!orderRef) {
      return NextResponse.json({ error: "orderRef is required" }, { status: 400 });
    }

    const response = await client.collect({ orderRef });
    return NextResponse.json(response);
  } catch (err: any) {
    console.error("[BankID] collect error:", err);
    return NextResponse.json(
      { error: err?.code ?? "UNKNOWN_ERROR", details: err?.message },
      { status: 500 },
    );
  }
}

/**
 * POST /api/bankid/cancel
 *
 * Body:
 *   { orderRef: string }
 */
export async function bankidCancelHandler(req: NextRequest): Promise<NextResponse> {
  try {
    const client = getBankIdClient();
    const { orderRef } = await req.json();

    if (!orderRef) {
      return NextResponse.json({ error: "orderRef is required" }, { status: 400 });
    }

    await client.cancel({ orderRef });
    return NextResponse.json({ cancelled: true });
  } catch (err: any) {
    console.error("[BankID] cancel error:", err);
    return NextResponse.json(
      { error: err?.code ?? "UNKNOWN_ERROR", details: err?.message },
      { status: 500 },
    );
  }
}

// ─── Client-side polling helper (browser / React) ────────────────────────────

/**
 * Polls /api/bankid/collect every `intervalMs` until the order is done.
 * Use this in your React component instead of awaitPendingCollect().
 *
 * @example
 * const result = await pollBankIdCollect(orderRef, {
 *   onPending: (hint) => setStatus(hint),
 * });
 */
export async function pollBankIdCollect(
  orderRef: string,
  options: {
    intervalMs?: number;
    timeoutMs?: number;
    onPending?: (hintCode: string | undefined) => void;
    collectUrl?: string;
  } = {},
): Promise<any> {
  const {
    intervalMs = 2000,
    timeoutMs = 90_000,
    onPending,
    collectUrl = "/api/bankid/collect",
  } = options;

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const res = await fetch(collectUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderRef }),
    });

    if (!res.ok) {
      throw new Error(`Collect request failed: ${res.status}`);
    }

    const data = await res.json();

    if (data.status === "complete") return data;
    if (data.status === "failed") throw data;

    onPending?.(data.hintCode);

    await new Promise<void>((r) => setTimeout(r, intervalMs));
  }

  throw new Error("BankID polling timed out");
}
