# BankID — Vercel Edition

This is a Vercel-compatible fork of the [`bankid`](https://github.com/anyfin/bankid) npm package.

## What changed from the original

| Original | This fork |
|---|---|
| Loads `.p12` / CA certs from the filesystem at runtime | CA certs are **embedded** at build time; `.p12` is loaded from an env var |
| `awaitPendingCollect()` blocks for up to 90 s | Unchanged but annotated with a warning; use the new stateless route handlers instead |
| No Vercel helpers | New `vercel-helpers.ts` with ready-to-use Next.js App Router handlers |

---

## Setup

### 1. Environment variables

Add these to your Vercel project (Settings → Environment Variables):

| Variable | Description |
|---|---|
| `BANKID_PFX_BASE64` | Your `.p12` certificate, base64-encoded |
| `BANKID_PASSPHRASE` | Certificate passphrase |
| `BANKID_PRODUCTION` | `"true"` for production BankID, omit or set to anything else for test |

**To base64-encode your certificate:**

```bash
# macOS / Linux
base64 -i your-cert.p12 | tr -d '\n'

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('your-cert.p12'))
```

Paste the output as the value of `BANKID_PFX_BASE64`.

---

### 2. Static IP (production only)

BankID's production API requires your server IP to be **whitelisted**.
Vercel functions run on dynamic IPs, so you need to route outbound traffic through a static IP.

**Option A — Fixie (easiest)**

1. Add the [Fixie add-on](https://vercel.com/integrations/fixie) to your Vercel project
2. It sets a `FIXIE_URL` env var automatically
3. Configure the BankID axios instance to use the proxy (see below)

**Option B — Your own NAT gateway / VPN**

Route outbound traffic from Vercel to your own static IP infrastructure.

---

### 3. Copy the source files into your project

```
your-nextjs-app/
  lib/
    bankid/
      bankid.ts         ← from src/bankid.ts
      qrgenerator.ts    ← from src/qrgenerator.ts
      vercel-helpers.ts ← from src/vercel-helpers.ts
      index.ts          ← from src/index.ts
```

---

## Usage

### API routes (Next.js App Router)

```ts
// app/api/bankid/auth/route.ts
import { bankidAuthHandler } from "@/lib/bankid";
export const POST = bankidAuthHandler;

// app/api/bankid/collect/route.ts
import { bankidCollectHandler } from "@/lib/bankid";
export const POST = bankidCollectHandler;

// app/api/bankid/cancel/route.ts
import { bankidCancelHandler } from "@/lib/bankid";
export const POST = bankidCancelHandler;
```

That's it — three files, three lines each.

---

### React component (polling)

```tsx
"use client";
import { useState } from "react";
import { pollBankIdCollect } from "@/lib/bankid";

export function BankIdButton() {
  const [status, setStatus] = useState<string>("");
  const [user, setUser] = useState<any>(null);

  async function handleLogin() {
    setStatus("Starting...");

    // 1. Start auth order
    const authRes = await fetch("/api/bankid/auth", { method: "POST" });
    const { orderRef, autoStartToken } = await authRes.json();

    // 2. Open BankID app on same device
    window.location.href = `bankid:///?autostarttoken=${autoStartToken}&redirect=null`;

    // 3. Poll until done
    try {
      const result = await pollBankIdCollect(orderRef, {
        onPending: (hint) => setStatus(hint ?? "Waiting..."),
      });
      setUser(result.completionData?.user);
      setStatus("✅ Authenticated!");
    } catch (err: any) {
      setStatus(`❌ Failed: ${err?.hintCode ?? "unknown"}`);
    }
  }

  return (
    <div>
      <button onClick={handleLogin}>Log in with BankID</button>
      <p>{status}</p>
      {user && <p>Welcome, {user.name}!</p>}
    </div>
  );
}
```

---

### Using the client directly

```ts
import { BankIdClient } from "@/lib/bankid";

// From env vars (recommended for Vercel)
const client = BankIdClient.fromEnv();

// Or manually with a Buffer
const client = new BankIdClient({
  production: true,
  pfx: Buffer.from(process.env.BANKID_PFX_BASE64!, "base64"),
  passphrase: process.env.BANKID_PASSPHRASE,
});

const auth = await client.authenticate({ endUserIp: "1.2.3.4" });
```

---

### Static IP proxy via Fixie (production)

If you're using Fixie or another HTTP proxy for a static IP, configure the axios instance after creating the client:

```ts
import { BankIdClient } from "@/lib/bankid";
import { HttpsProxyAgent } from "https-proxy-agent";

const client = BankIdClient.fromEnv();

if (process.env.FIXIE_URL) {
  // Override the httpsAgent with one that routes through the proxy
  client.axios.defaults.httpsAgent = new HttpsProxyAgent(process.env.FIXIE_URL);
}
```

Install the proxy agent: `npm install https-proxy-agent`

---

## Architecture: why three routes?

BankID's collect loop can take 30–90 seconds. Vercel serverless functions time out at:
- **Hobby plan**: 10 seconds
- **Pro plan**: 60 seconds

The solution is to never block a function waiting for the user. Instead:

```
Browser                 Vercel function          BankID API
  │                          │                       │
  ├─POST /auth───────────────► authenticate() ───────►│
  │◄─── { orderRef } ────────┤◄──── { orderRef } ────┤
  │                          │                       │
  ├─POST /collect (t=0s) ────► collect() ────────────►│
  │◄─── { status: pending } ─┤◄─── { pending } ──────┤
  │                          │                       │
  │   (user opens BankID)    │                       │
  │                          │                       │
  ├─POST /collect (t=2s) ────► collect() ────────────►│
  │◄─── { status: complete } ┤◄─── { complete } ─────┤
  │                          │                       │
```

Each serverless function call completes in milliseconds. The browser drives the timing.

---

## Vercel function config

Add this to your `next.config.ts` if you need longer timeouts (Pro plan):

```ts
export const maxDuration = 60; // seconds, per route
```

Or in your route file:

```ts
// app/api/bankid/collect/route.ts
export const maxDuration = 10; // collect is always fast — no change needed
```

---

## Test mode

In test mode (default when `BANKID_PRODUCTION` is not `"true"`), the embedded BankID test certificate is used automatically — no env vars needed.

```ts
const client = new BankIdClient({ production: false }); // uses embedded test cert
```
