import mongoose from "mongoose";

/**
 * Second database: the Sales CRM (`SALES_DB_URI`, db `SALES_DB_NAME`, default `onestock_sales_crm`).
 * READ ONLY from this app: only `find` queries are ever issued, no models, no indexes, no writes.
 *
 * Collections used (structure taken from sample documents):
 *
 *  payments
 *    transactionId  'pay_U05A0Und7J6yub'      amount  Number (INR)
 *    status         'SUCCESS' | 'CANCELLED'   failureReason  null | 'REFUNDED'
 *    kind           'RECURRING_2500' | 'TRIAL_10' | ...        provider 'appx'
 *    paidAt         Date                      leadPhone / memberPhone  '919370797356' (digits, country code, no "+")
 *    leadName / memberName, lead / member (ObjectId), origin 'WEBHOOK' | 'EXPORT'
 *
 *  webhookevents
 *    dedupeKey      'appx:pay_U1f7PueVPgQZMR'  amount  Number     eventType 'purchase'
 *    outcome        'DUPLICATE' | ...          paidAt  Date       provider 'club50'
 *    payload.transaction_id, payload.phone / payload.buyer_phone  '+919453027557' (E.164)
 *    payload.refund_status 'none' | ..., payload.payment_verified 'true' | 'false'
 *    payload.affiliate / affiliate_name (the CRM's own affiliate tag; not used here)
 *    A webhook event whose payment is already in `payments` has outcome 'DUPLICATE'.
 *
 * Other collections in that db (not read): brokerpartnerships, calllogs, extracted_leads, funnelsteps,
 * importbatches, importskippedrows, ingestlogs, leads_rebuilt, lookups, members, purchaserecords,
 * savedviews, settings, smartflo_*, stagesnapshots, telegram*, users.
 */

const g = globalThis as unknown as { _salesConn?: mongoose.Connection };

export const isSalesDbConfigured = (): boolean => Boolean(process.env.SALES_DB_URI?.trim());

export async function getSalesDb() {
  const uri = process.env.SALES_DB_URI?.trim();
  if (!uri) throw new Error("SALES_DB_URI is not set");

  g._salesConn ??= mongoose.createConnection(uri, {
    dbName: process.env.SALES_DB_NAME?.trim() || "onestock_sales_crm",
    bufferCommands: false,
    autoIndex: false,
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 8000,
  });
  try {
    await g._salesConn.asPromise();
  } catch (e) {
    g._salesConn = undefined; // retry on the next request
    throw e;
  }
  const db = g._salesConn.db;
  if (!db) throw new Error("Sales DB not ready");
  return db;
}
