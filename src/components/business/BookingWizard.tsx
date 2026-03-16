"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarDays, Clock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { BusinessProfile, Service, StaffMember, AvailabilitySlot } from "@/lib/supabase/queries";

type Step = "service" | "datetime" | "staff" | "details";

interface BookingWizardProps {
  locale: string;
  business: BusinessProfile;
  initialServiceId?: string | null;
}

export function BookingWizard({
  locale,
  business,
  initialServiceId,
}: BookingWizardProps) {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState<Step>("service");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    initialServiceId ? [initialServiceId] : searchParams.get("service") ? [searchParams.get("service") as string] : []
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [slots, setSlots] = useState<AvailabilitySlot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [partySize, setPartySize] = useState<number>(1);
  const [staffForParty, setStaffForParty] = useState<string[]>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const services = business.services;

  const selectedServices = useMemo(
    () => services.filter((s) => selectedServiceIds.includes(s.id)),
    [services, selectedServiceIds]
  );

  const staffForBusiness: StaffMember[] = business.staff;

  const directionClass = locale === "en" ? "ltr" : "rtl";

  async function handleDateChange(dateStr: string) {
    const supabase = createClient() as any;

    setSelectedDate(dateStr);
    setSelectedSlot(null);
    if (selectedServiceIds.length === 0) return;

    setLoadingSlots(true);
    try {
      const { data, error } = await supabase.rpc("get_available_slots", {
        p_business_id: business.id,
        p_service_ids: selectedServiceIds,
        p_from_date: dateStr,
        p_to_date: dateStr,
        p_staff_id: selectedStaffId ?? null,
      });
      if (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to load availability via RPC", error.message);
        setSlots([]);
      } else {
        setSlots((data ?? []) as AvailabilitySlot[]);
      }
    } catch (e) {
      console.error("Failed to load availability", e);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function handleNext() {
    if (step === "service" && selectedServiceIds.length > 0) {
      setStep("datetime");
      return;
    }
    if (step === "datetime" && selectedSlot) {
      if (staffForBusiness.length > 1) {
        setStep("staff");
      } else {
        setSelectedStaffId(staffForBusiness[0]?.id ?? null);
        setStep("details");
      }
      return;
    }
    if (step === "staff") {
      setStep("details");
      return;
    }
  }

  function isNextDisabled(): boolean {
    if (step === "service") return selectedServiceIds.length === 0;
    if (step === "datetime") return !selectedSlot;
    if (step === "staff") {
      if (partySize === 1) return false;
      return staffForParty.some((id) => !id);
    }
    if (step === "details") return !name || !email || !phone;
    return false;
  }

  async function handleSubmitDetails(e: React.FormEvent) {
    e.preventDefault();
    if (selectedServices.length === 0 || !selectedSlot) return;
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          serviceIds: selectedServices.map((s) => s.id),
          partySize,
          staffIds:
            partySize > 1 && staffForParty.length === partySize
              ? staffForParty
              : [selectedStaffId ?? selectedSlot.staff_id],
          startAt: selectedSlot.start_at,
          endAt: selectedSlot.end_at,
          name,
          email,
          phone,
        }),
      });

      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.error("Failed to create booking", await res.json());
        return;
      }

      const data = (await res.json()) as {
        appointmentId: string;
        clientSecret?: string | null;
        guestToken?: string | null;
      };
      const tokenQ = data.guestToken
        ? `?token=${encodeURIComponent(data.guestToken)}`
        : "";
      router.push(`/${locale}/booking/${data.appointmentId}/confirm${tokenQ}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Unexpected error creating booking", error);
    }
  }

  return (
    <div className={cn("bg-dp-surface border border-dp-border rounded-card shadow-card p-5 space-y-4", directionClass)}>
      {/* Step indicators */}
      <div className="flex items-center justify-between text-xs text-dp-text-muted mb-2">
        <span className={cn("flex items-center gap-1", step === "service" && "text-dp-text-primary font-medium")}>
          <CalendarDays className="h-3.5 w-3.5" />
          {t("booking.step_service")}
        </span>
        <ArrowRight className={cn("h-3 w-3 opacity-60", locale === "ar" || locale === "he" ? "rotate-180" : "")} />
        <span className={cn("flex items-center gap-1", step === "datetime" && "text-dp-text-primary font-medium")}>
          <Clock className="h-3.5 w-3.5" />
          {t("booking.step_time")}
        </span>
        <ArrowRight className={cn("h-3 w-3 opacity-60", locale === "ar" || locale === "he" ? "rotate-180" : "")} />
        <span className={cn("flex items-center gap-1", step === "staff" && "text-dp-text-primary font-medium")}>
          <User className="h-3.5 w-3.5" />
          {t("booking.step_staff")}
        </span>
      </div>

      {/* Step content */}
      {step === "service" && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-dp-text-primary">
            {t("booking.choose_service")}
          </h3>
          <p className="text-xs text-dp-text-muted">
            {t("booking.multi_service_hint")}
          </p>
          <div className="space-y-2">
            {services.map((s: Service) => (
              <button
                key={s.id}
                type="button"
                onClick={() =>
                  setSelectedServiceIds((prev) =>
                    prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                  )
                }
                className={cn(
                  "w-full text-start p-3 rounded-lg border text-sm transition-all",
                  "hover:border-brand-iris/50 hover:bg-brand-iris/5",
                  selectedServiceIds.includes(s.id)
                    ? "border-brand-iris bg-brand-iris/5"
                    : "border-dp-border bg-dp-surface"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-dp-text-primary">
                      {locale === "ar"
                        ? s.name_ar ?? s.name_en
                        : locale === "he"
                        ? s.name_he ?? s.name_en
                        : s.name_en}
                    </p>
                    <p className="text-xs text-dp-text-muted">
                      {s.duration_minutes} {t("common.minutes")}
                    </p>
                  </div>
                  <span className="font-semibold text-sm num text-dp-text-primary">
                    {t("common.currency")}
                    {s.price}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "datetime" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-dp-text-primary">
                {t("booking.choose_date")}
              </h3>
              <p className="text-xs text-dp-text-muted">
                {t("booking.choose_date_hint")}
              </p>
            </div>
            <input
              type="date"
              className="text-xs rounded-md border border-dp-border bg-dp-surface px-2 py-1 text-dp-text-primary"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </div>

          <div>
            <h4 className="text-xs font-medium text-dp-text-secondary mb-2 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t("booking.available_times")}
            </h4>
            {loadingSlots && (
              <p className="text-xs text-dp-text-muted">{t("booking.loading_slots")}</p>
            )}
            {!loadingSlots && selectedDate && slots && slots.length === 0 && (
              <p className="text-xs text-dp-text-muted">
                {t("booking.no_slots_for_date")}
              </p>
            )}
            {!loadingSlots && (!selectedDate || slots === null) && (
              <p className="text-xs text-dp-text-muted">
                {t("booking.pick_date_first")}
              </p>
            )}
            {!loadingSlots && slots && slots.length > 0 && (
              <div className="max-h-56 overflow-y-auto rounded-lg border border-dp-border/60 bg-dp-surface-alt/40 p-2">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={`${slot.staff_id}-${slot.start_at}`}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        "w-full px-3 py-1.5 rounded-full border text-xs num text-center transition-all",
                        selectedSlot?.staff_id === slot.staff_id &&
                          selectedSlot?.start_at === slot.start_at
                          ? "border-brand-iris bg-brand-iris/10 text-brand-iris"
                          : "border-dp-border bg-dp-surface text-dp-text-primary hover:border-brand-iris/40 hover:bg-brand-iris/5"
                      )}
                    >
                      {formatTime(slot.start_at)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {step === "staff" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-dp-text-primary">
                {t("booking.choose_staff")}
              </h3>
              <p className="text-xs text-dp-text-muted">
                {t("booking.party_size_hint")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-dp-text-muted">
                {t("booking.people")}
              </span>
              <input
                type="number"
                min={1}
                max={Math.min(3, staffForBusiness.length || 1)}
                value={partySize}
                onChange={(e) => {
                  const v = Math.max(1, Math.min(Number(e.target.value) || 1, Math.min(3, staffForBusiness.length || 1)));
                  setPartySize(v);
                  setStaffForParty((prev) => prev.slice(0, v));
                }}
                className="w-14 text-xs rounded-md border border-dp-border bg-dp-surface px-2 py-1 text-dp-text-primary"
              />
            </div>
          </div>

          {partySize === 1 ? (
            <select
              className="w-full h-10 rounded-md border border-dp-border bg-dp-surface px-3 text-sm text-dp-text-primary"
              value={selectedStaffId ?? ""}
              onChange={(e) => setSelectedStaffId(e.target.value || null)}
            >
              <option value="">{t("booking.any_staff")}</option>
              {staffForBusiness.map((s) => (
                <option key={s.id} value={s.id}>
                  {locale === "ar"
                    ? s.name_ar ?? s.name_en
                    : locale === "he"
                    ? s.name_he ?? s.name_en
                    : s.name_en}
                </option>
              ))}
            </select>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: partySize }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-dp-text-muted w-16">
                    {t("booking.person_label", { number: idx + 1 })}
                  </span>
                  <select
                    className="flex-1 h-9 rounded-md border border-dp-border bg-dp-surface px-3 text-sm text-dp-text-primary"
                    value={staffForParty[idx] ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStaffForParty((prev) => {
                        const next = [...prev];
                        next[idx] = val;
                        return next;
                      });
                    }}
                  >
                    <option value="">{t("booking.any_staff")}</option>
                    {staffForBusiness.map((s) => (
                      <option key={s.id} value={s.id}>
                        {locale === "ar"
                          ? s.name_ar ?? s.name_en
                          : locale === "he"
                          ? s.name_he ?? s.name_en
                          : s.name_en}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === "staff" && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-dp-text-primary">
            {t("booking.choose_staff")}
          </h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setSelectedStaffId(null)}
              className={cn(
                "w-full text-start p-3 rounded-lg border text-sm transition-all",
                "hover:border-brand-iris/50 hover:bg-brand-iris/5",
                selectedStaffId === null
                  ? "border-brand-iris bg-brand-iris/5"
                  : "border-dp-border bg-dp-surface"
              )}
            >
              {t("booking.any_staff")}
            </button>
            {staffForBusiness.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedStaffId(s.id)}
                className={cn(
                  "w-full text-start p-3 rounded-lg border text-sm transition-all",
                  "hover:border-brand-iris/50 hover:bg-brand-iris/5",
                  selectedStaffId === s.id
                    ? "border-brand-iris bg-brand-iris/5"
                    : "border-dp-border bg-dp-surface"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-dp-text-primary">
                    {locale === "ar"
                      ? s.name_ar ?? s.name_en
                      : locale === "he"
                      ? s.name_he ?? s.name_en
                      : s.name_en}
                  </span>
                  {s.role_title_en && (
                    <span className="text-xs text-dp-text-muted">{s.role_title_en}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "details" && (
        <form className="space-y-4" onSubmit={handleSubmitDetails}>
          <div>
            <h3 className="text-sm font-semibold text-dp-text-primary mb-1">
              {t("booking.enter_details")}
            </h3>
            <p className="text-xs text-dp-text-muted">
              {t("booking.details_hint")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-dp-text-secondary">
                {t("common.full_name")}
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-dp-border bg-dp-surface px-3 py-2 text-sm text-dp-text-primary"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-dp-text-secondary">
                {t("common.email")}
              </label>
              <input
                type="email"
                className="w-full rounded-md border border-dp-border bg-dp-surface px-3 py-2 text-sm text-dp-text-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-dp-text-secondary">
                {t("common.phone")}
              </label>
              <input
                type="tel"
                className="w-full rounded-md border border-dp-border bg-dp-surface px-3 py-2 text-sm text-dp-text-primary"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full">
            {t("booking.confirm_placeholder")}
          </Button>
        </form>
      )}

      {/* Footer actions */}
      <div className="pt-2 border-t border-dp-border flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={step === "service"}
          onClick={() => {
            if (step === "details") setStep(staffForBusiness.length > 1 ? "staff" : "datetime");
            else if (step === "staff") setStep("datetime");
            else if (step === "datetime") setStep("service");
          }}
        >
          {t("common.back")}
        </Button>
        {step !== "details" && (
          <Button
            type="button"
            size="sm"
            disabled={isNextDisabled()}
            onClick={handleNext}
            className="gap-1.5"
          >
            {t("common.next")}
            <ArrowRight
              className={cn(
                "h-3.5 w-3.5",
                locale === "ar" || locale === "he" ? "rotate-180" : ""
              )}
            />
          </Button>
        )}
      </div>
    </div>
  );
}

