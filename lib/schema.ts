import { pgTable, text, integer, json, boolean } from "drizzle-orm/pg-core";

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
  isBanned:              boolean("is_banned").default(false).notNull(),
});

// ── Settings ───────────────────────────────────────────────────────────────────
export const settings = pgTable("settings", {
  key:   text("key").primaryKey(),
  value: text("value").notNull(),
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

// ── Password Reset Tokens ───────────────────────────────────────────────────────
export const passwordResetTokens = pgTable("password_reset_tokens", {
  token:     text("token").primaryKey(),            // random hex token
  userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),           // ISO string
  usedAt:    text("used_at"),                        // ISO string, null = not yet used
  createdAt: text("created_at").notNull(),
});

export type UserRow               = typeof users.$inferSelect;
export type ReportRow             = typeof reports.$inferSelect;
export type SettingRow            = typeof settings.$inferSelect;
export type PasswordResetTokenRow = typeof passwordResetTokens.$inferSelect;
