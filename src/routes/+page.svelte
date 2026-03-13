<script lang="ts">
  import { onMount } from "svelte";

  type CosmosItem = Record<string, unknown>;

  let items: CosmosItem[] = $state([]);
  let loading = $state(true);
  let error: string | null = $state(null);

  onMount(async () => {
    try {
      const res = await fetch("/api/cosmos");
      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }
      const data = await res.json();
      items = data?.items ?? [];
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  });
</script>

<h1>Cosmos DB Viewer</h1>

{#if loading}
  <p>Loading items from the Cosmos DB API...</p>
{:else if error}
  <div class="rounded border border-red-300 bg-red-50 p-4">
    <strong>Error fetching items:</strong>
    <pre class="whitespace-pre-wrap">{error}</pre>
    <p>
      This app expects the Cosmos DB API to be available at <code>/api/cosmos</code>.
      If you are deploying to Azure Static Web Apps, make sure your build output includes a server API (or use an adapter/Functions API).
    </p>
  </div>
{:else}
  {#if items.length === 0}
    <p>No items were returned from the container.</p>
  {:else}
    <ul class="space-y-2">
      {#each items as item, i (item.id ?? i)}
        <li class="rounded border border-gray-200 p-3">
          <pre class="whitespace-pre-wrap text-sm">{JSON.stringify(item, null, 2)}</pre>
        </li>
      {/each}
    </ul>
  {/if}
{/if}
