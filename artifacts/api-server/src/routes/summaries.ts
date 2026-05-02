import { Router } from "express";
import { db, summariesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

router.get("/summaries", async (req, res) => {
  const { context, location_id, limit = "5" } = req.query as Record<string, string>;
  if (!context || !location_id) {
    return res.status(400).json({ error: "context and location_id are required" });
  }
  try {
    const rows = await db
      .select()
      .from(summariesTable)
      .where(and(eq(summariesTable.context, context), eq(summariesTable.locationId, location_id)))
      .orderBy(desc(summariesTable.updatedAt))
      .limit(Math.min(parseInt(limit) || 5, 50));
    return res.json({ summaries: rows });
  } catch (err: any) {
    req.log.error({ err }, "Failed to get summaries");
    return res.status(500).json({ error: "Failed to get summaries" });
  }
});

router.post("/summaries", async (req, res) => {
  const { context, locationId, summary, keyInsights, trends, recommendations, dataQualityScore, dataQualityIssues, dataSnapshot, filtersApplied, dateRangeStart, dateRangeEnd, dataHash } = req.body;
  if (!context || !locationId || !summary) {
    return res.status(400).json({ error: "context, locationId, and summary are required" });
  }
  try {
    const [row] = await db
      .insert(summariesTable)
      .values({
        context,
        locationId,
        summary,
        keyInsights: keyInsights || [],
        trends: trends || [],
        recommendations: recommendations || [],
        dataQualityScore: dataQualityScore ?? 0,
        dataQualityIssues: dataQualityIssues || [],
        dataSnapshot: dataSnapshot ?? null,
        filtersApplied: filtersApplied ?? null,
        dateRangeStart: dateRangeStart ?? null,
        dateRangeEnd: dateRangeEnd ?? null,
        dataHash: dataHash || "",
      })
      .returning();
    return res.status(201).json({ success: true, id: String(row.id) });
  } catch (err: any) {
    req.log.error({ err }, "Failed to save summary");
    return res.status(500).json({ error: "Failed to save summary" });
  }
});

router.get("/summaries/latest", async (req, res) => {
  const { context, location_id } = req.query as Record<string, string>;
  if (!context || !location_id) {
    return res.status(400).json({ error: "context and location_id are required" });
  }
  try {
    const [row] = await db
      .select()
      .from(summariesTable)
      .where(and(eq(summariesTable.context, context), eq(summariesTable.locationId, location_id)))
      .orderBy(desc(summariesTable.updatedAt))
      .limit(1);
    return res.json({ summary: row ?? null });
  } catch (err: any) {
    req.log.error({ err }, "Failed to get latest summary");
    return res.status(500).json({ error: "Failed to get latest summary" });
  }
});

router.delete("/summaries/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    await db.delete(summariesTable).where(eq(summariesTable.id, id));
    return res.json({ success: true });
  } catch (err: any) {
    req.log.error({ err }, "Failed to delete summary");
    return res.status(500).json({ error: "Failed to delete summary" });
  }
});

router.delete("/summaries", async (req, res) => {
  const { context, location_id } = req.query as Record<string, string>;
  if (!context || !location_id) {
    return res.status(400).json({ error: "context and location_id are required" });
  }
  try {
    await db
      .delete(summariesTable)
      .where(and(eq(summariesTable.context, context), eq(summariesTable.locationId, location_id)));
    return res.json({ success: true });
  } catch (err: any) {
    req.log.error({ err }, "Failed to clear summaries");
    return res.status(500).json({ error: "Failed to clear summaries" });
  }
});

export default router;
