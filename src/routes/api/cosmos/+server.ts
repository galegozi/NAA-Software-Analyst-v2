import { json } from "@sveltejs/kit";
import { queryItems, readItemById } from "$lib/server/cosmos";

export async function GET({ url }) {
  const id = url.searchParams.get("id");
  const pk = url.searchParams.get("pk");
  const query = url.searchParams.get("query") ?? undefined;

  try {
    if (id) {
      const item = await readItemById(id, pk ?? undefined);
      return json({ item });
    }

    const items = await queryItems({
      query,
      maxItemCount: 50,
    });

    return json(items);
  } catch (error) {
    console.error("Cosmos DB request failed", error);
    return json({ error: String(error) }, { status: 500 });
  }
}
