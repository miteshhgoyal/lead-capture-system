import { config } from "../config";
import type { MetaClient } from "./client";
import { FakeMetaClient } from "./fake-client";
import { GraphApiMetaClient } from "./graph-client";

/** The Meta client for this process: fake when AUTODM_MOCK_META=true (never in production), otherwise the Graph API. */
export function getMetaClient(): MetaClient {
  return config().mockMeta ? new FakeMetaClient() : new GraphApiMetaClient();
}
export type { MetaClient } from "./client";
