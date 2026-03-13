import { CosmosClient } from "@azure/cosmos";
import type { Container, SqlQuerySpec } from "@azure/cosmos";
import { env } from "$env/dynamic/private";

const requiredKeys: Record<string, string | undefined> = {
  COSMOS_DB_ENDPOINT: env.COSMOS_DB_ENDPOINT,
  COSMOS_DB_KEY: env.COSMOS_DB_KEY,
  COSMOS_DB_DATABASE: env.COSMOS_DB_DATABASE,
  COSMOS_DB_CONTAINER: env.COSMOS_DB_CONTAINER,
};

function assertEnvVars() {
  const missing = Object.entries(requiredKeys)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(
      `Missing required Cosmos DB environment variable(s): ${missing.join(", ")}. ` +
        "Set them in your local `.env` and in your deployment environment."
    );
  }
}

function getCosmosClient() {
  assertEnvVars();

  return new CosmosClient({
    endpoint: requiredKeys.COSMOS_DB_ENDPOINT!,
    key: requiredKeys.COSMOS_DB_KEY!,
  });
}

function getContainer(): Container {
  assertEnvVars();

  const client = getCosmosClient();
  const database = client.database(requiredKeys.COSMOS_DB_DATABASE!);
  return database.container(requiredKeys.COSMOS_DB_CONTAINER!);
}

export type CosmosResult<T = unknown> = {
  items: T[];
  continuationToken?: string;
};

export async function queryItems<T = unknown>(options: {
  query?: string;
  parameters?: Array<{ name: string; value: unknown }>;
  maxItemCount?: number;
  continuationToken?: string;
}): Promise<CosmosResult<T>> {
  const { query = "SELECT * FROM c", parameters = [], maxItemCount = 50, continuationToken } = options;

  const container = getContainer();
  const querySpec: SqlQuerySpec = {
    query,
    parameters,
  };

  const iterator = container.items.query<T>(querySpec, {
    maxItemCount,
    continuationToken,
  });

  const { resources: items, continuationToken: nextToken } = await iterator.fetchAll();

  return { items, continuationToken: nextToken || undefined };
}

export async function readItemById<T = unknown>(id: string, partitionKey?: string): Promise<T | null> {
  const container = getContainer();

  try {
    const response = await container.item(id, partitionKey).read<T>();
    return response.resource ?? null;
  } catch (error: any) {
    if (error?.code === 404) return null;
    throw error;
  }
}
