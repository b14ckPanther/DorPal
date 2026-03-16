"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CalendarDays,
  Clock,
  ChevronRight,
  ChevronLeft,
  X,
  AlertCircle,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface BookingDetailAppointment {
  id: string;
  business_id: string;
  staff_id: string | null;
  start_at: string;
  end_at: string;
  status: string;
  total_duration_minutes: number;
  total_price: number;
  currency: string;
  businesses: { id: string; name_en: string; slug: string } | null;
  appointment_services: Array<{
    service_id: string;
    service_name_snapshot: string;
    duration_minutes_snapshot: number;
    price_snapshot: number;
  }>;
}

interface BookingDetailPageProps {
  locale: string;
  appointment: BookingDetailAppointment;
  guestToken?: string | null;
}

export function BookingDetailPage({
  locale,
  appointment,
  guestToken,
}: BookingDetailPageProps) {
  const t = useTranslations("booking");
  const router = useRouter();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [slots, setSlots] = useState<{ start_at: string; end_at: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start_at: string; end_at: string } | null>(null);
  const [submittingReschedule, setSubmittingReschedule] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const isRTL = locale === "ar" || locale === "he";
  const ChevIcon = isRTL ? ChevronLeft : ChevronRight;
  const canReschedule = !["cancelled", "no_show", "completed"].includes(appointment.status);
  const canCancel = !["cancelled", "no_show", "completed"].includes(appointment.status);

  const businessName = appointment.businesses?.name_en ?? "";
  const businessSlug = appointment.businesses?.slug ?? "";
  const serviceName =
    appointment.appointment_services?.[0]?.service_name_snapshot ?? "";

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  async function loadSlots(date: string) {
    if (!date) return;
    setRescheduleDate(date);
    setSelectedSlot(null);
    setLoadingSlots(true);
    try {
      const res = await fetch(
        `/api/bookings/${appointment.id}/availability?date=${date}`,
        {
          headers: guestToken ? { "X-Guest-Token": guestToken } : {},
        }
      );
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleReschedule() {
    if (!selectedSlot) return;
    setSubmittingReschedule(true);
    try {
      const res = await fetch(`/api/bookings/${appointment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(guestToken ? { "X-Guest-Token": guestToken } : {}),
        },
        body: JSON.stringify({
          action: "reschedule",
          startAt: selectedSlot.start_at,
          endAt: selectedSlot.end_at,
        }),
      });
      if (res.ok) {
        setRescheduleOpen(false);
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error ?? "Failed to reschedule");
      }
    } catch (e) {
      alert("Something went wrong");
    } finally {
      setSubmittingReschedule(false);
    }
  }

  async function handleCancel() {
    setSubmittingCancel(true);
    try {
      const res = await fetch(`/api/bookings/${appointment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(guestToken ? { "X-Guest-Token": guestToken } : {}),
        },
        body: JSON.stringify({ action: "cancel", reason: cancelReason || undefined }),
      });
      if (res.ok) {
        setCancelOpen(false);
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error ?? "Failed to cancel");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setSubmittingCancel(false);
    }
  }

  return (
    <div className={cn("space-y-6", isRTL && "rtl")}>
      {/* Summary card */}
      <div className="bg-dp-surface border border-dp-border rounded-card shadow-card overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-dp-text-primary mb-1">
                {businessName}
              </h1>
              {businessSlug && (
                <Link
                  href={`/${locale}/business/${businessSlug}`}
                  className="text-sm text-brand-iris hover:underline inline-flex items-center gap-1"
                >
                  {t("view_booking")}
                  <ChevIcon className="h-4 w-4" />
                </Link>
              )}
            </div>
            <span
              className={cn(
                "shrink-0 px-3 py-1 rounded-full text-xs font-medium capitalize",
                appointment.status === "confirmed" &&
                  "bg-dp-success-bg text-dp-success",
                appointment.status === "pending" &&
                  "bg-dp-warning-bg text-dp-warning",
                appointment.status === "cancelled" &&
                  "bg-dp-error-bg text-dp-error",
                appointment.status === "completed" &&
                  "bg-dp-surface-alt text-dp-text-secondary"
              )}
            >
              {appointment.status}
            </span>
          </div>

          <dl className="mt-4 space-y-3 text-sm">
            {serviceName && (
              <div className="flex items-center gap-2 text-dp-text-secondary">
                <CalendarDays className="h-4 w-4 text-brand-iris shrink-0" />
                <span>{serviceName}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-dp-text-secondary">
              <Clock className="h-4 w-4 text-brand-iris shrink-0" />
              <span>
                {formatDateTime(appointment.start_at)} –{" "}
                {formatTime(appointment.end_at)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-dp-text-secondary">
              <span className="font-medium text-dp-text-primary num">
                {appointment.total_price} {appointment.currency}
              </span>
              <span>·</span>
              <span>{appointment.total_duration_minutes} min</span>
            </div>
          </dl>

          {(canReschedule || canCancel) && (
            <div className="mt-6 flex flex-wrap gap-3">
              {canReschedule && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRescheduleOpen(true)}
                >
                  {t("reschedule")}
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="danger-ghost"
                  size="sm"
                  onClick={() => setCancelOpen(true)}
                >
                  {t("cancel_booking")}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reschedule modal */}
      <Dialog.Root open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in-0" />
          <Dialog.Content
            className={cn(
              "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
              "w-full max-w-md bg-dp-surface border border-dp-border rounded-card shadow-modal p-6",
              "animate-in fade-in-0 zoom-in-95"
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold text-dp-text-primary">
                {t("reschedule")}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="p-1 rounded-md hover:bg-dp-surface-alt text-dp-text-muted"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>
            <p className="text-sm text-dp-text-muted mb-4">
              {t("choose_date_hint")}
            </p>
            <input
              type="date"
              className="w-full rounded-md border border-dp-border bg-dp-surface px-3 py-2 text-sm text-dp-text-primary mb-4"
              onChange={(e) => loadSlots(e.target.value)}
            />
            <div className="mb-4">
              <p className="text-xs font-medium text-dp-text-secondary mb-2">
                {t("available_times")}
              </p>
              {loadingSlots && (
                <p className="text-xs text-dp-text-muted">
                  {t("loading_slots")}
                </p>
              )}
              {!loadingSlots && slots.length === 0 && rescheduleDate && (
                <p className="text-xs text-dp-text-muted">
                  {t("no_slots_for_date")}
                </p>
              )}
              {!loadingSlots && slots.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.start_at}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        "px-3 py-1.5 rounded-full border text-xs num transition-all",
                        selectedSlot?.start_at === slot.start_at
                          ? "border-brand-iris bg-brand-iris/10 text-brand-iris"
                          : "border-dp-border hover:border-brand-iris/40 hover:bg-brand-iris/5"
                      )}
                    >
                      {formatTime(slot.start_at)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm">
                  Back
                </Button>
              </Dialog.Close>
              <Button
                size="sm"
                disabled={!selectedSlot || submittingReschedule}
                onClick={handleReschedule}
              >
                {submittingReschedule ? "..." : t("confirm_booking")}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Cancel confirmation modal */}
      <Dialog.Root open={cancelOpen} onOpenChange={setCancelOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in-0" />
          <Dialog.Content
            className={cn(
              "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
              "w-full max-w-md bg-dp-surface border border-dp-border rounded-card shadow-modal p-6",
              "animate-in fade-in-0 zoom-in-95"
            )}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-dp-error-bg flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5 text-dp-error" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-dp-text-primary">
                  {t("cancel_booking")}
                </Dialog.Title>
                <p className="text-sm text-dp-text-muted mt-1">
                  This will cancel your appointment. You can book again anytime.
                </p>
              </div>
            </div>
            <label className="block text-sm text-dp-text-secondary mb-2">
              Reason (optional)
            </label>
            <textarea
              className="w-full rounded-md border border-dp-border bg-dp-surface px-3 py-2 text-sm text-dp-text-primary min-h-[80px] resize-y"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Change of plans"
            />
            <div className="flex gap-2 justify-end mt-4">
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm">
                  Keep booking
                </Button>
              </Dialog.Close>
              <Button
                variant="danger"
                size="sm"
                disabled={submittingCancel}
                onClick={handleCancel}
              >
                {submittingCancel ? "..." : t("cancel_booking")}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
