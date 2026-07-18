import "server-only";

// Docs state the endpoint as api.semaphore.co, but every one of Semaphore's
// own code samples (PHP, Ruby, Python, .NET, cURL) POSTs to this host
// without the "api." subdomain -- going with what's actually demonstrated
// working rather than the (possibly stale) prose header.
const SEMAPHORE_ENDPOINT = "https://semaphore.co/api/v4/messages";

type SemaphoreMessage = {
  message_id: number;
  status: string;
  recipient: string;
};

export type SendSmsResult =
  | { success: true; messageId: number }
  | { success: false; error: string };

/**
 * Form-encoded POST, not JSON -- confirmed against semaphore.co/docs.
 * Do not start `message` with the literal word "TEST": Semaphore silently
 * drops those without an error.
 */
export async function sendSms(
  phone: string,
  message: string,
): Promise<SendSmsResult> {
  const apiKey = process.env.SEMAPHORE_API_KEY;
  if (!apiKey) {
    return { success: false, error: "SEMAPHORE_API_KEY is not set." };
  }

  const body = new URLSearchParams({
    apikey: apiKey,
    number: phone,
    message,
  });

  try {
    const response = await fetch(SEMAPHORE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        success: false,
        error: `Semaphore responded ${response.status}: ${text.slice(0, 200)}`,
      };
    }

    const data = (await response.json()) as SemaphoreMessage[];
    const first = data[0];

    if (!first) {
      return { success: false, error: "Semaphore returned an empty response." };
    }

    return { success: true, messageId: first.message_id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "SMS send failed.",
    };
  }
}
