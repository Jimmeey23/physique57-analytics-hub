import { pgTable, text, serial, real, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const summariesTable = pgTable("summaries", {
  id: serial("id").primaryKey(),
  context: text("context").notNull(),
  locationId: text("location_id").notNull(),
  summary: text("summary").notNull(),
  keyInsights: jsonb("key_insights").notNull().$type<string[]>(),
  trends: jsonb("trends").notNull().$type<string[]>(),
  recommendations: jsonb("recommendations").notNull().$type<string[]>(),
  dataQualityScore: real("data_quality_score").notNull().default(0),
  dataQualityIssues: jsonb("data_quality_issues").notNull().$type<string[]>(),
  dataSnapshot: jsonb("data_snapshot").$type<{ totalRows: number; columnsAnalyzed: number; keyMetrics: Record<string, any> }>(),
  filtersApplied: jsonb("filters_applied").$type<Record<string, any>>(),
  dateRangeStart: text("date_range_start"),
  dateRangeEnd: text("date_range_end"),
  dataHash: text("data_hash").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSummarySchema = createInsertSchema(summariesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSummary = z.infer<typeof insertSummarySchema>;
export type Summary = typeof summariesTable.$inferSelect;
