const { CosmosClient } = require("@azure/cosmos");

const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const database = process.env.COSMOS_DB_DATABASE;
const container = process.env.COSMOS_DB_CONTAINER;

const missingEnv = [];
if (!endpoint) missingEnv.push("COSMOS_DB_ENDPOINT");
if (!key) missingEnv.push("COSMOS_DB_KEY");
if (!database) missingEnv.push("COSMOS_DB_DATABASE");
if (!container) missingEnv.push("COSMOS_DB_CONTAINER");

let containerRef;
if (missingEnv.length === 0) {
  const client = new CosmosClient({ endpoint, key });
  containerRef = client.database(database).container(container);
}

module.exports = async function (context, req) {
  context.log("Azure Functions /api/cosmos invoked");

  if (missingEnv.length > 0) {
    const message =
      "Missing required Cosmos DB environment variables. " +
      "Set " +
      missingEnv.join(", ") +
      ".";
    context.log.error(message);
    return {
      status: 500,
      body: { error: message },
    };
  }

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
    return {
      status: 500,
      body: { error: message },
    };
  }
};
