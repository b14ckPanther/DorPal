"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Star, MessageSquare } from "lucide-react";
import type { DashboardReview } from "@/lib/supabase/queries";

type Props = { locale: string; initialReviews: DashboardReview[]; isOwner: boolean };

export function DashboardReviewsPage({ locale, initialReviews, isOwner }: Props) {
  const t = useTranslations("dashboard");
  const [reviews, setReviews] = useState<DashboardReview[]>(initialReviews);
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [pending, startTransition] = useTransition();

  const submitReply = (reviewId: string) => {
    if (!replyText.trim()) return;
    startTransition(async () => {
      const res = await fetch(`/api/dashboard/reviews/${reviewId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body_en: replyText }),
      });
      if (res.ok) {
        setReplyId(null);
        setReplyText("");
        const list = await fetch("/api/dashboard/reviews").then((r) => r.json());
        setReviews(list);
      }
    });
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-dp-text-primary">{t("reviews.title")}</h1>
        <p className="text-sm text-dp-text-muted">{t("reviews.subtitle")}</p>
      </div>
      {reviews.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-dp-text-muted">{t("reviews.no_reviews")}</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-dp-border">
            {reviews.map((r) => (
              <div key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1 text-amber-500">
                      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`h-4 w-4 ${i <= r.rating ? "fill-current" : ""}`} />)}
                    </div>
                    <p className="text-sm text-dp-text-secondary mt-1">{r.body_en || r.body_ar || r.body_he || "—"}</p>
                    <p className="text-xs text-dp-text-muted mt-1">{r.customer_name ?? "Guest"} · {new Date(r.created_at).toLocaleDateString(locale)} · {r.status}</p>
                    {r.response_body && <p className="text-sm mt-2 pl-3 border-s-2 border-dp-border">{t("reviews.your_response")}: {r.response_body}</p>}
                  </div>
                </div>
                {isOwner && !r.response_body && (
                  <div className="mt-3">
                    {replyId === r.id ? (
                      <div className="flex gap-2">
                        <textarea className="flex-1 rounded-md border border-dp-border p-2 text-sm" rows={2} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Your response..." />
                        <Button size="sm" disabled={pending} onClick={() => submitReply(r.id)}>{t("offers.reply")}</Button>
                        <Button variant="ghost" size="sm" onClick={() => { setReplyId(null); setReplyText(""); }}>Cancel</Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setReplyId(r.id)}><MessageSquare className="h-3.5 w-3.5 me-1" />{t("offers.respond")}</Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
