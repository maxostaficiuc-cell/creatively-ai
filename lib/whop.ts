import Whop from "@whop/sdk";

let _whop: Whop | null = null;

export function isWhopConfigured(): boolean {
  return !!process.env.WHOP_COMPANY_API_KEY;
}

export function getWhop(): Whop {
  if (!_whop) {
    const sandbox = process.env.WHOP_SANDBOX === "true";
    _whop = new Whop({
      apiKey: process.env.WHOP_COMPANY_API_KEY!,
      ...(process.env.WHOP_WEBHOOK_SECRET && {
        webhookKey: Buffer.from(process.env.WHOP_WEBHOOK_SECRET).toString("base64"),
      }),
      ...(sandbox && { baseURL: "https://sandbox-api.whop.com/api/v1" }),
    });
  }
  return _whop;
}
