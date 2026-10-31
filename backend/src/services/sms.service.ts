// src/services/sms.service.ts
// Sends SMS messages. Pick the implementation with SMS_PROVIDER (default "console").

export interface SmsSender {
  send(to: string, message: string): Promise<void>;
}

/**
 * Development sender: writes the message to the console instead of sending it.
 * In production the code is never logged, so this sender cannot leak OTPs.
 */
export class ConsoleSmsSender implements SmsSender {
  async send(to: string, message: string): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      console.log(
        `[sms] message queued for ${maskPhone(to)} (console sender: not delivered)`,
      );
      return;
    }
    console.log(`[sms] to ${to}: ${message}`);
  }
}

export function maskPhone(phone: string): string {
  return phone.length > 4
    ? `${"*".repeat(phone.length - 4)}${phone.slice(-4)}`
    : "****";
}

export function getSmsSender(): SmsSender {
  const provider = (process.env.SMS_PROVIDER ?? "console").toLowerCase();

  if (provider === "console") return new ConsoleSmsSender();

  // Add real providers (for example MSG91 or Twilio) here as new SmsSender classes.
  throw new Error(`Unsupported SMS_PROVIDER "${provider}"`);
}
