import type { SiteDocument } from "@/builder/types";

/** Notifie un webhook + l’API eagaseke après publication. */
export async function notifySitePublished(doc: SiteDocument): Promise<{
  webhook?: { ok: boolean; status?: number; error?: string };
  eagaseke?: { ok: boolean; status?: number; error?: string };
}> {
  const result: {
    webhook?: { ok: boolean; status?: number; error?: string };
    eagaseke?: { ok: boolean; status?: number; error?: string };
  } = {};

  const webhookUrl = process.env.CMS_PUBLISH_WEBHOOK_URL?.trim();
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.CMS_PUBLISH_WEBHOOK_SECRET
            ? {
                "X-CMS-Webhook-Secret": process.env.CMS_PUBLISH_WEBHOOK_SECRET,
              }
            : {}),
        },
        body: JSON.stringify({
          event: "cms.site.published",
          at: new Date().toISOString(),
          brand: doc.settings.brand,
          pages: doc.pages.length,
          updatedAt: doc.updatedAt,
        }),
      });
      result.webhook = { ok: res.ok, status: res.status };
    } catch (e) {
      result.webhook = {
        ok: false,
        error: e instanceof Error ? e.message : "webhook_failed",
      };
    }
  }

  const apiOrigin = (
    process.env.NEXT_PUBLIC_EAGASEKE_ORIGIN ||
    process.env.EAGASEKE_ORIGIN ||
    ""
  ).replace(/\/$/, "");
  const ingestSecret = process.env.CMS_INGEST_SECRET?.trim();
  if (apiOrigin && ingestSecret) {
    try {
      const res = await fetch(`${apiOrigin}/api/cms/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CMS-Ingest-Secret": ingestSecret,
        },
        body: JSON.stringify({ doc }),
      });
      result.eagaseke = { ok: res.ok, status: res.status };
    } catch (e) {
      result.eagaseke = {
        ok: false,
        error: e instanceof Error ? e.message : "ingest_failed",
      };
    }
  }

  return result;
}
