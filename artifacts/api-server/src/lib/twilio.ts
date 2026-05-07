import { getSetting } from "../routes/settings";

export async function getTwilioSettings() {
  const [accountSid, authToken, fromNumber, toNumber, channel] = await Promise.all([
    getSetting("twilioAccountSid"),
    getSetting("twilioAuthToken"),
    getSetting("twilioFromNumber"),
    getSetting("twilioToNumber"),
    getSetting("twilioChannel"),
  ]);
  return { accountSid, authToken, fromNumber, toNumber, channel: channel ?? "sms" };
}

export async function sendMessage(to: string, from: string, body: string, accountSid: string, authToken: string): Promise<void> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams({ To: to, From: from, Body: body });
  const creds = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Twilio send failed: ${res.status} ${text}`);
  }
}

export async function notifyViaTwilio(
  conversationId: number,
  visitorName: string,
  messageContent: string
): Promise<void> {
  const { accountSid, authToken, fromNumber, toNumber, channel } = await getTwilioSettings();
  if (!accountSid || !authToken || !fromNumber || !toNumber) return;

  const isWhatsApp = channel === "whatsapp";
  const to = isWhatsApp ? `whatsapp:${toNumber}` : toNumber;
  const from = isWhatsApp ? `whatsapp:${fromNumber}` : fromNumber;
  const channelLabel = isWhatsApp ? "WhatsApp" : "SMS";

  const text = `[SimpleChat] New message from ${visitorName}:\n"${messageContent}"\n\nReply to this ${channelLabel} to respond. Start your reply with #${conversationId}:`;
  await sendMessage(to, from, text, accountSid, authToken);
}
