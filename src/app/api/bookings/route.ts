import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createGuestBookingToken } from "@/lib/guest-token";
import { createPayPalOrder } from "@/lib/paypal/server";

async function triggerBookingNotification(appointmentId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return;

  try {
    await fetch(`${url}/functions/v1/send-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        type: "booking_confirmation",
        booking_id: appointmentId,
      }),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to trigger booking notification", error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      businessId,
      serviceId,
      serviceIds,
      staffId,
      startAt,
      endAt,
      name,
      email,
      phone,
      locale,
    } = body as {
      businessId: string;
      serviceId?: string;
      serviceIds?: string[];
      staffId?: string | null;
      startAt: string;
      endAt: string;
      name: string;
      email: string;
      phone: string;
      locale?: string;
    };

    const effectiveServiceIds =
      (Array.isArray(serviceIds) && serviceIds.length > 0
        ? serviceIds
        : serviceId
        ? [serviceId]
        : []);

    if (!businessId || effectiveServiceIds.length === 0 || !startAt || !endAt || !name || !email || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();

    // Load service details (price, deposit, duration)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: services, error: serviceError } = await (supabase as any)
      .from("services")
      .select("id, name_en, duration_minutes, price, currency, deposit_required, deposit_amount")
      .in("id", effectiveServiceIds);

    if (serviceError || !services || services.length === 0) {
      return NextResponse.json(
        { error: "Service not found", details: serviceError?.message },
        { status: 400 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const currency = (services[0]?.currency as string | null) ?? "ILS";
    const totalDurationMinutes = services.reduce(
      (sum: number, s: any) => sum + (s.duration_minutes as number),
      0
    );
    const totalPrice = services.reduce(
      (sum: number, s: any) => sum + (Number(s.price) || 0),
      0
    );
    const anyDepositRequired = services.some((s: any) => Boolean(s.deposit_required));
    const depositAmountTotal = services.reduce(
      (sum: number, s: any) =>
        sum +
        (Boolean(s.deposit_required) ? Number(s.deposit_amount) || 0 : 0),
      0
    );
    const depositRequired = anyDepositRequired && depositAmountTotal > 0;
    const paymentProvider = (process.env.PAYMENT_PROVIDER ?? "stripe").toLowerCase();

    if (depositRequired) {
      if (paymentProvider === "paypal") {
        if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
          return NextResponse.json(
            { error: "PayPal payments are not configured yet." },
            { status: 503 }
          );
        }
      } else if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json(
          { error: "Deposit payments are not configured yet." },
          { status: 503 }
        );
      }
    }

    // Insert appointment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: appointment, error: appointmentError } = await (supabase as any)
      .from("appointments")
      .insert({
        business_id: businessId,
        staff_id: staffId ?? null,
        start_at: startAt,
        end_at: endAt,
        status: depositRequired ? "pending" : "confirmed",
        source: "web",
        total_duration_minutes: totalDurationMinutes,
        total_price: totalPrice,
        currency,
        deposit_required: depositRequired,
        deposit_amount: depositRequired ? depositAmountTotal || null : null,
        customer_id: user?.id ?? null,
        guest_name: user ? null : name,
        guest_email: user ? null : email,
        guest_phone: user ? null : phone,
      })
      .select("*")
      .single();

    if (appointmentError) {
      // Handle double-booking constraint gracefully
      return NextResponse.json(
        {
          error: "Could not create appointment",
          details: appointmentError.message,
        },
        { status: 400 }
      );
    }

    const appointmentId = appointment.id as string;

    // Insert appointment service line items (snapshot)
    const lineRows = services.map((s: any) => ({
      appointment_id: appointmentId,
      service_id: s.id as string,
      service_name_snapshot: s.name_en as string,
      duration_minutes_snapshot: s.duration_minutes as number,
      price_snapshot: Number(s.price) || 0,
      quantity: 1,
    }));

    const { error: lineError } = await (supabase as any)
      .from("appointment_services")
      .insert(lineRows);

    if (lineError) {
      return NextResponse.json(
        { error: "Appointment created but service line failed", details: lineError.message },
        { status: 400 }
      );
    }

    const guestToken =
      !user && appointmentId
        ? createGuestBookingToken(appointmentId)
        : undefined;

    let clientSecret: string | null = null;
    let checkoutUrl: string | null = null;

    if (depositRequired && depositAmountTotal > 0) {
      // Create payment record first
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: payment, error: paymentError } = await (supabase as any)
        .from("payments")
        .insert({
          appointment_id: appointmentId,
          business_id: businessId,
          customer_id: user?.id ?? null,
          kind: "deposit",
          amount: depositAmountTotal,
          currency,
          status: "pending",
          external_provider: paymentProvider,
        })
        .select("id")
        .single();

      if (!paymentError && payment) {
        const paymentId = payment.id as string;
        const requestOrigin = new URL(req.url).origin;
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL ?? requestOrigin;
        const localePrefix =
          locale && ["ar", "he", "en"].includes(locale) ? locale : "ar";
        const tokenQuery = guestToken
          ? `&guest_token=${encodeURIComponent(guestToken)}`
          : "";

        if (paymentProvider === "paypal") {
          const order = await createPayPalOrder({
            amount: depositAmountTotal.toFixed(2),
            currency,
            returnUrl: `${appUrl}/api/paypal/return?appointment_id=${encodeURIComponent(
              appointmentId
            )}&payment_id=${encodeURIComponent(
              paymentId
            )}&locale=${encodeURIComponent(localePrefix)}${tokenQuery}`,
            cancelUrl: `${appUrl}/api/paypal/cancel?appointment_id=${encodeURIComponent(
              appointmentId
            )}&payment_id=${encodeURIComponent(
              paymentId
            )}&locale=${encodeURIComponent(localePrefix)}${tokenQuery}`,
            email: user?.email ?? email,
            customId: appointmentId,
            invoiceId: paymentId,
          });

          if (!order?.id) {
            return NextResponse.json(
              { error: "Failed to initialize PayPal checkout." },
              { status: 500 }
            );
          }

          await (supabase as any)
            .from("payments")
            .update({ external_id: order.id })
            .eq("id", paymentId);

          const approveLink = order.links?.find((link) => link.rel === "approve");
          checkoutUrl = approveLink?.href ?? null;
          if (!checkoutUrl) {
            return NextResponse.json(
              { error: "PayPal approval URL was not returned." },
              { status: 500 }
            );
          }
        } else {
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
          const amountCents = Math.round(depositAmountTotal * 100);

          const intent = await stripe.paymentIntents.create({
            amount: amountCents,
            currency: currency.toLowerCase(),
            metadata: {
              appointment_id: appointmentId,
              payment_id: paymentId,
            },
          });

          clientSecret = intent.client_secret;

          const successUrl = `${appUrl}/${localePrefix}/booking/${appointmentId}/confirm?checkout=success${guestToken ? `&token=${encodeURIComponent(guestToken)}` : ""}`;
          const cancelUrl = `${appUrl}/${localePrefix}/booking/${appointmentId}/confirm?checkout=cancel${guestToken ? `&token=${encodeURIComponent(guestToken)}` : ""}`;

          const session = await stripe.checkout.sessions.create({
            mode: "payment",
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: user?.email ?? email,
            payment_method_types: ["card"],
            line_items: [
              {
                quantity: 1,
                price_data: {
                  currency: currency.toLowerCase(),
                  unit_amount: amountCents,
                  product_data: {
                    name: `Booking deposit`,
                    description: `Deposit for appointment ${appointmentId}`,
                  },
                },
              },
            ],
            payment_intent_data: {
              metadata: {
                appointment_id: appointmentId,
                payment_id: paymentId,
              },
            },
            metadata: {
              appointment_id: appointmentId,
              payment_id: paymentId,
            },
          });

          checkoutUrl = session.url ?? null;
          if (!checkoutUrl) {
            return NextResponse.json(
              { error: "Failed to initialize booking checkout." },
              { status: 500 }
            );
          }
        }
      } else {
        return NextResponse.json(
          { error: "Failed to initialize booking payment." },
          { status: 500 }
        );
      }
    } else {
      // No deposit: trigger confirmation notification immediately
      await triggerBookingNotification(appointmentId);
    }

    return NextResponse.json({
      appointmentId,
      clientSecret,
      checkoutUrl,
      guestToken,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

