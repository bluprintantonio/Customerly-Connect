import crypto from "node:crypto";

export interface WebhookPayload {
  event: string;
  conversationId: number;
  visitorName: string;
  visitorEmail: string | null;
  siteUrl: string;
  message: {
    id: number;
    content: string;
    sender: string;
    createdAt: string;
  };
}

export async function fireWebhook(
  url: string,
  secret: string | null,
  payload: WebhookPayload
): Promise<void> {
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (secret) {
    const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
    headers["x-simplechat-signature"] = `sha256=${sig}`;
  }

  try {
    const res = await fetch(url, { method: "POST", headers, body });
    if (!res.ok) {
      // Fire-and-forget; log failure but don't crash the request
      console.error(`Webhook to ${url} failed: HTTP ${res.status}`);
    }
  } catch (err) {
    console.error(`Webhook to ${url} error:`, err);
  }
}
