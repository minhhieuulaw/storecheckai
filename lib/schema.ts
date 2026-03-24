import { pgTable, text, integer, json, timestamp } from "drizzle-orm/pg-core";

// ── Users ──────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id:                    text("id").primaryKey(),
  email:                 text("email").unique().notNull(),
  name:                  text("name").notNull(),
  passwordHash:          text("password_hash").notNull(),
  // Billing
  plan:                  text("plan").default("free").notNull(), // 'free' | 'starter' | 'personal' | 'pro'
  checksRemaining:       integer("checks_remaining").default(0).notNull(),
  billingPeriodEnd:      text("billing_period_end"),             // ISO string, null for pay-per-check
  stripeCustomerId:      text("stripe_customer_id"),
  stripeSubscriptionId:  text("stripe_subscription_id"),
  createdAt:             text("created_at").notNull(),
});

// ── Reports ────────────────────────────────────────────────────────────────────
export const reports = pgTable("reports", {
  id:               text("id").primaryKey(),
  userId:           text("user_id").references(() => users.id),
  url:              text("url").notNull(),
  domain:           text("domain").notNull(),
  storeName:        text("store_name").notNull(),
  analyzedAt:       text("analyzed_at").notNull(),
  trustScore:       integer("trust_score").notNull(),
  verdict:          text("verdict").notNull(),          // BUY | CAUTION | SKIP
  returnRisk:       text("return_risk").notNull(),       // LOW | MEDIUM | HIGH
  reviewConfidence: text("review_confidence").notNull(),
  planUsed:         text("plan_used").default("free"),   // plan tier at time of check
  reportData:       json("report_data").notNull(),       // full Report object
});

export type UserRow   = typeof users.$inferSelect;
export type ReportRow = typeof reports.$inferSelect;
