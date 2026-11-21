import { dbConnect } from "@/lib/db";
import { backoffMs } from "./windows";
import { BACKOFF_BASE_MS, BACKOFF_MAX_MS, MAX_ATTEMPTS, config } from "./config";
import { AutodmJob } from "./models";
import { FeatureGate } from "./settings-store";

export type JobType = "process_event" | "execute_run" | "delete_user_data";
export type JobHandler = (payload: Record<string, unknown>) => Promise<{ retryInMs?: number } | void>;

/**
 * A small MongoDB-backed queue (the project has no Redis/worker). Jobs are claimed atomically, so several
 * instances can drain it. Webhook requests drain it with next/server `after()`; /api/autodm/cron drains the rest
 * (retries, delayed jobs). Workers drop AutoDM jobs safely when the master switch is off: they are acked, never retried.
 */
export async function enqueue(type: JobType, payload: Record<string, unknown>, opts: { delayMs?: number } = {}): Promise<void> {
  await dbConnect();
  await AutodmJob.create({ queue: config().queueName, type, payload, runAt: new Date(Date.now() + (opts.delayMs ?? 0)) });
}

const STALE_LOCK_MS = 5 * 60 * 1000;

export async function processDue(handlers: Record<JobType, JobHandler>, opts: { max?: number; budgetMs?: number } = {}): Promise<{ done: number; retried: number; dropped: number }> {
  await dbConnect();
  const queue = config().queueName;
  const started = Date.now();
  const max = opts.max ?? 25;
  const budget = opts.budgetMs ?? 20_000;
  const out = { done: 0, retried: 0, dropped: 0 };

  await AutodmJob.updateMany({ queue, status: "running", lockedAt: { $lt: new Date(Date.now() - STALE_LOCK_MS) } }, { $set: { status: "queued", lockedAt: null } });

  for (let i = 0; i < max && Date.now() - started < budget; i++) {
    const job = await AutodmJob.findOneAndUpdate({ queue, status: "queued", runAt: { $lte: new Date() } }, { $set: { status: "running", lockedAt: new Date() }, $inc: { attempts: 1 } }, { sort: { runAt: 1 }, returnDocument: "after" });
    if (!job) break;

    // compliance jobs run even when the feature is dark; everything else is dropped safely.
    const master = (await FeatureGate.all())["autodm.enabled"] === true;
    if (!master && job.type !== "delete_user_data") {
      await AutodmJob.updateOne({ _id: job._id }, { $set: { status: "done", lastError: "discarded: AutoDM is switched off" } });
      out.dropped++;
      continue;
    }
    const handler = handlers[job.type as JobType];
    try {
      const r = handler ? await handler(job.payload) : undefined;
      if (r && r.retryInMs) {
        await AutodmJob.updateOne({ _id: job._id }, { $set: { status: "queued", lockedAt: null, runAt: new Date(Date.now() + r.retryInMs) } });
        out.retried++;
      } else {
        await AutodmJob.updateOne({ _id: job._id }, { $set: { status: "done" } });
        out.done++;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message.slice(0, 300) : "error";
      if (job.attempts >= MAX_ATTEMPTS) await AutodmJob.updateOne({ _id: job._id }, { $set: { status: "dead", lastError: msg } });
      else {
        await AutodmJob.updateOne({ _id: job._id }, { $set: { status: "queued", lockedAt: null, lastError: msg, runAt: new Date(Date.now() + backoffMs(job.attempts, BACKOFF_BASE_MS, BACKOFF_MAX_MS)) } });
        out.retried++;
      }
    }
  }
  return out;
}
