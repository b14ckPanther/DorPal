import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createGuestBookingToken } from "@/lib/guest-token";

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

    let clientSecret: string | null = null;

    if (depositRequired && depositAmountTotal > 0 && process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2024-06-20",
      });

      const amountCents = Math.round(depositAmount * 100);

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
          external_provider: "stripe",
        })
        .select("id")
        .single();

      if (!paymentError && payment) {
        const paymentId = payment.id as string;

        const intent = await stripe.paymentIntents.create({
          amount: amountCents,
          currency: (service.currency ?? "ILS").toLowerCase(),
          metadata: {
            appointment_id: appointmentId,
            payment_id: paymentId,
          },
        });

        clientSecret = intent.client_secret;
      }
    } else {
      // No deposit: trigger confirmation notification immediately
      await triggerBookingNotification(appointmentId);
    }

    const guestToken =
      !user && appointmentId
        ? createGuestBookingToken(appointmentId)
        : undefined;

    return NextResponse.json({ appointmentId, clientSecret, guestToken });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

