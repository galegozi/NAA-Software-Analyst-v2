import { CosmosClient } from "@azure/cosmos";

const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const database = process.env.COSMOS_DB_DATABASE;
const container = process.env.COSMOS_DB_CONTAINER;

if (!endpoint || !key || !database || !container) {
  throw new Error(
    "Missing required Cosmos DB environment variables. Set COSMOS_DB_ENDPOINT, COSMOS_DB_KEY, COSMOS_DB_DATABASE, and COSMOS_DB_CONTAINER."
  );
}

const client = new CosmosClient({ endpoint, key });
const containerRef = client.database(database).container(container);

module.exports = async function (context, req) {
  context.log("Azure Functions /api/cosmos invoked");

  try {
    const id = req.query?.id ?? req.body?.id;
    const pk = req.query?.pk ?? req.body?.pk;

    if (id) {
      const response = await containerRef.item(id, pk).read();
      return {
        body: {
          item: response.resource ?? null,
        },
      };
    }

    const query = req.query?.query ?? "SELECT * FROM c";
    const { resources: items } = await containerRef.items
      .query({ query, parameters: [] })
      .fetchAll();

    return {
      body: {
        items,
      },
    };
  } catch (error) {
    const message = error?.message ?? String(error);
    context.log.error("Cosmos DB request failed", message);
    context.res = {
      status: 500,
      body: { error: message },
    };
  }
};
