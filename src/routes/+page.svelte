<script lang="ts">
	import { onMount } from 'svelte';
	import CosmosMultiSelect, {
		type Item as CosmosItem
	} from '$lib/components/CosmosMultiSelect.svelte';

	let items: CosmosItem[] = $state([]);
	let selected: CosmosItem[] = $state([]);
	let loading = $state(true);
	let error: string | null = $state(null);

	const makeIsotopeKey = (item: CosmosItem) => {
		const props = item as any;

		const symbol =
			(props.symbol as string) ??
			(props.elementShortName as string) ??
			(props.element as string) ??
			(props.name as string) ??
			'';

		const mass =
			(props.massNumber as string) ??
			(props.mass as string) ??
			(props.A as string) ??
			(props.atomicMass as string) ??
			'';

		const suffix =
			(props.suffix as string) ?? (props.isomer as string) ?? (props.state as string) ?? '';

		const canonicalSymbol = String(symbol).trim().toLowerCase();
		const canonicalMass = String(mass).trim();
		const canonicalSuffix = String(suffix).trim();

		if (!canonicalSymbol || !canonicalMass) {
			return (
				(props.name as string) ??
				(props.label as string) ??
				(props.id as string) ??
				JSON.stringify(item).slice(0, 60)
			);
		}

		return `${canonicalSymbol}-${canonicalMass}${canonicalSuffix}`;
	};

	function normalizeItems(rawItems: CosmosItem[]): CosmosItem[] {
		const flatten = (item: CosmosItem): CosmosItem[] => {
			const props = item as any;

			const baseId = makeIsotopeKey(item);

			const energyList =
				Array.isArray(props.characteristicEnergies) && props.characteristicEnergies.length > 0
					? props.characteristicEnergies
					: Array.isArray(props.energies) && props.energies.length > 0
						? props.energies
						: Array.isArray(props.energy)
							? props.energy
							: Array.isArray(props.keV)
								? props.keV
								: [];

			if (energyList.length === 0) {
				return [{ ...item, id: baseId }];
			}

			return energyList.map((energyValue, index) => {
				const energy =
					typeof energyValue === 'object' && energyValue !== null
						? ((energyValue as any).energy ?? (energyValue as any).keV ?? energyValue.value)
						: energyValue;

				return {
					...item,
					id: `${baseId}-${String(energy ?? index)}`,
					energy
				};
			});
		};

		return rawItems.flatMap(flatten);
	}

	onMount(async () => {
		try {
			const res = await fetch('/api/cosmos');
			if (!res.ok) {
				let message = `Request failed (${res.status}${res.statusText ? ` ${res.statusText}` : ''})`;

				const text = await res.text();
				if (text) {
					try {
						const body = JSON.parse(text);
						if (body?.error) {
							message = body.error;
						} else {
							message += `: ${JSON.stringify(body)}`;
						}
					} catch {
						message += `: ${text}`;
					}
				}

				throw new Error(message);
			}

			const data = await res.json();
			items = normalizeItems(data?.items ?? []);
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	});

	const getLabel = (item: CosmosItem) => {
		const props = item as any;

		const symbol =
			(props.symbol as string) ??
			(props.elementShortName as string) ??
			(props.elementName as string) ??
			(props.element as string) ??
			(props.name as string) ??
			'';

		const mass =
			(props.massNumber as string) ??
			(props.mass as string) ??
			(props.A as string) ??
			(props.atomicMass as string) ??
			'';

		const suffix =
			(props.suffix as string) ?? (props.isomer as string) ?? (props.state as string) ?? '';

		const canonicalSymbol = String(symbol).trim().toLowerCase();
		const canonicalMass = String(mass).trim();
		const canonicalSuffix = String(suffix).trim();

		if (!canonicalSymbol || !canonicalMass) {
			return (
				(props.name as string) ??
				(props.label as string) ??
				(props.id as string) ??
				JSON.stringify(item).slice(0, 60)
			);
		}

		return `${canonicalSymbol}-${canonicalMass}${canonicalSuffix}`;
	};

	const formatSelectionLabel = (item: CosmosItem) => {
		const base = getLabel(item);
		const props = item as any;
		const energy = props.energy ?? props.keV ?? props.energy_keV;

		if (energy === undefined || energy === null || energy === '') {
			return base;
		}

		const energyStr = typeof energy === 'number' ? `${energy}` : String(energy);
		const normalized = energyStr.toLowerCase().endsWith('kev') ? energyStr : `${energyStr}kev`;
		return `${base} (${normalized})`;
	};
</script>
<div class="page">
<h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
	NAA Software - Analyst Demo: Isotope Multi-Select from Library
</h1>

<p class="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
	This demo shows how a library can be used to access an isotope list from any device with an internet connection.
</p>

{#if loading}
	<div
		class="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
	>
		<p class="text-sm text-slate-700 dark:text-slate-200">Loading items from the library...</p>
	</div>
{:else if error}
	<div class="mt-6 rounded-lg border border-red-300 bg-red-50 p-6 dark:bg-transparent">
		<strong class="text-base text-red-700">Error fetching items:</strong>
		<pre class="mt-2 text-sm whitespace-pre-wrap text-red-800 dark:text-red-200">{error}</pre>
		<!-- <p class="mt-3 text-sm text-slate-600 dark:text-slate-300">
      This app expects the Cosmos DB API to be available at <code class="rounded bg-slate-100 px-1 py-0.5 text-xs font-mono text-slate-700 dark:bg-slate-800 dark:text-slate-200">/api/cosmos</code>.
      If you are deploying to Azure Static Web Apps, make sure your build output includes a server API (or use an adapter/Functions API).
    </p> -->
	</div>
{:else}
	<div class="mt-6 space-y-6">
		<section
			class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
		>
			<h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Choose data points</h2>
			<p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
				Type to find matching records, then click to select. Selected items are shown as tags below.
			</p>

			<div class="mt-4">
				<CosmosMultiSelect {items} bind:selected placeholder="Search by id, name, or label..." />
			</div>

			{#if selected.length > 0}
				<div
					class="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
				>
					<div class="flex items-center justify-between">
						<h3 class="text-sm font-semibold">Selected items ({selected.length})</h3>
						<button
							type="button"
							class="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
							onclick={() => (selected = [])}
						>
							Clear
						</button>
					</div>
					<div
						class="mt-3 max-h-56 overflow-auto rounded bg-white p-3 text-sm leading-relaxed text-slate-800 dark:bg-slate-900 dark:text-slate-100"
					>
						<ul class="space-y-1">
							{#each selected as item (formatSelectionLabel(item))}
								<li
									class="flex items-center justify-between rounded bg-slate-50 px-2 py-1 text-slate-800 dark:bg-slate-950 dark:text-slate-100"
								>
									<span class="truncate">{formatSelectionLabel(item)}</span>
									<button
										type="button"
										class="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-200 dark:hover:text-indigo-100"
										onclick={() => (selected = selected.filter((s) => s !== item))}
									>
										Remove
									</button>
								</li>
							{/each}
						</ul>
					</div>
				</div>
			{/if}

			{#if items.length === 0}
				<p class="mt-4 text-sm text-slate-600 dark:text-slate-300">
					No items were returned from the container.
				</p>
			{/if}
		</section>
	</div>
{/if}
</div>
<style>
  /* Add any additional styles here if needed */
  .page {
		/* max-width: 860px; */
		margin: 0 auto;
		padding: 5rem;
	}
</style>
