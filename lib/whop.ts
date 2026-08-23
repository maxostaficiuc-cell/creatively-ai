import { Whop } from "@whop/sdk";

function createWhopClient() {
  const sandbox = process.env.WHOP_SANDBOX === "true";
  return new Whop({
    apiKey: process.env.WHOP_COMPANY_API_KEY!,
    ...(process.env.WHOP_WEBHOOK_SECRET && {
      webhookKey: Buffer.from(process.env.WHOP_WEBHOOK_SECRET).toString("base64"),
    }),
    ...(sandbox && { baseURL: "https://sandbox-api.whop.com/api/v1" }),
  });
}

let _whop: ReturnType<typeof createWhopClient> | null = null;

export function isWhopConfigured(): boolean {
  return !!process.env.WHOP_COMPANY_API_KEY;
}

export function getWhop() {
  if (!_whop) {
    _whop = createWhopClient();
  }
  return _whop;
}
