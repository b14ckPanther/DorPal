type PayPalMode = "sandbox" | "live";

function getPayPalMode(): PayPalMode {
  const raw = (process.env.PAYPAL_MODE ?? "sandbox").toLowerCase();
  return raw === "live" ? "live" : "sandbox";
}

function getPayPalBaseUrl() {
  return getPayPalMode() === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function getPayPalCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export async function getPayPalAccessToken() {
  const creds = getPayPalCredentials();
  if (!creds) return null;
  const auth = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString(
    "base64"
  );

  const res = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

export async function createPayPalOrder(params: {
  amount: string;
  currency: string;
  returnUrl: string;
  cancelUrl: string;
  email?: string | null;
  customId: string;
  invoiceId: string;
}) {
  const accessToken = await getPayPalAccessToken();
  if (!accessToken) return null;

  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: params.currency.toUpperCase(),
          value: params.amount,
        },
        custom_id: params.customId,
        invoice_id: params.invoiceId,
      },
    ],
    application_context: {
      return_url: params.returnUrl,
      cancel_url: params.cancelUrl,
      user_action: "PAY_NOW",
    },
    payer: params.email
      ? {
          email_address: params.email,
        }
      : undefined,
  };

  const res = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) return null;
  return (await res.json()) as {
    id: string;
    status: string;
    links?: { rel: string; href: string; method: string }[];
  };
}

export async function capturePayPalOrder(orderId: string) {
  const accessToken = await getPayPalAccessToken();
  if (!accessToken) return null;

  const res = await fetch(
    `${getPayPalBaseUrl()}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) return null;
  return (await res.json()) as {
    id: string;
    status: string;
    purchase_units?: Array<{
      custom_id?: string;
      invoice_id?: string;
      payments?: {
        captures?: Array<{ id: string; status: string }>;
      };
    }>;
  };
}

