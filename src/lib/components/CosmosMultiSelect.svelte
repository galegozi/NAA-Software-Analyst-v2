<script module lang="ts">
  export type Item = Record<string, unknown>;
</script>

<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { tick } from "svelte";

  let {
    items,
    selected = $bindable<Item[]>([]),
    placeholder,
    labelKey,
  }: {
    items: Item[];
    selected: Item[];
    placeholder?: string;
    labelKey?: string | ((item: Item) => string);
  } = $props();

  const getIsotopeBase = (item: Item) => {
    const props = item as any;

    const symbol =
      (props.symbol as string) ??
      (props.elementShortName as string) ??
      (props.element as string) ??
      (props.name as string) ??
      "";

    const mass =
      (props.massNumber as string) ??
      (props.mass as string) ??
      (props.A as string) ??
      (props.atomicMass as string) ??
      "";

    const suffix =
      (props.suffix as string) ??
      (props.isomer as string) ??
      (props.state as string) ??
      "";

    const canonicalSymbol = String(symbol).trim().toLowerCase();
    const canonicalMass = String(mass).trim();
    const canonicalSuffix = String(suffix).trim();

    if (!canonicalSymbol || !canonicalMass) {
      return (props.name as string) ?? (props.label as string) ?? (props.id as string) ?? JSON.stringify(item ?? {}).slice(0, 60);
    }

    return `${canonicalSymbol}-${canonicalMass}${canonicalSuffix}`;
  };

//   export let items: Item[] = [];
//   export let selected: Item[] = [];
//   export let placeholder = "Search items...";
//   export let labelKey: string | ((item: Item) => string) = (item) => {
    // const maybeName = (item as any)?.name ?? (item as any)?.label ?? (item as any)?.id;
    // if (typeof maybeName === "string") return maybeName;
    // return JSON.stringify(item ?? {}).slice(0, 60);
//   };

  const dispatch = createEventDispatcher();

  let query = $state("");
  let open = $state(false);
  let inputRef: HTMLInputElement | null = null;

  const getLabel = (item: Item) => {
    if (labelKey) {
      if (typeof labelKey === "function") return labelKey(item);
      return (item as any)?.[labelKey] ?? getIsotopeBase(item);
    }

    return getIsotopeBase(item);
  };

  const getSearchText = (item: Item) => {
    const props = item as any;

    const parts: string[] = [];
    parts.push(getLabel(item));
    parts.push((props.name ?? "").toString());
    parts.push((props.label ?? "").toString());
    parts.push((props.elementName ?? "").toString());
    parts.push((props.symbol ?? "").toString());
    parts.push((props.element ?? "").toString());
    parts.push((props.elementShortName ?? "").toString());
    parts.push((props.massNumber ?? "").toString());
    parts.push((props.mass ?? "").toString());
    parts.push((props.A ?? "").toString());
    parts.push((props.atomicMass ?? "").toString());
    parts.push((props.suffix ?? "").toString());
    parts.push((props.isomer ?? "").toString());
    parts.push((props.state ?? "").toString());

    const energyProps = [] as any[];
    if (props.characteristicEnergies) energyProps.push(props.characteristicEnergies);
    if (props.energies) energyProps.push(props.energies);
    if (props.energy) energyProps.push(props.energy);
    if (props.keV) energyProps.push(props.keV);

    energyProps.forEach((raw) => {
      if (Array.isArray(raw)) {
        raw.forEach((v) => parts.push(String(v)));
      } else {
        parts.push(String(raw));
      }
    });

    return parts.filter(Boolean).join(" ").toLowerCase();
  };

  const formatLabel = (item: Item) => {
    const base = getLabel(item);
    const energy = (item as any)?.energy ?? (item as any)?.keV ?? (item as any)?.energy_keV;

    if (energy === undefined || energy === null || energy === "") {
      return base;
    }

    const energyStr = typeof energy === "number" ? `${energy}` : String(energy);
    const normalized = energyStr.toLowerCase().endsWith("kev") ? energyStr : `${energyStr}kev`;
    return `${base} (${normalized})`;
  };

  let filteredItems = $derived(query
    ? items.filter((item) => getSearchText(item).includes(query.toLowerCase()))
    : items)

  const isSelected = (item: Item) => selected.some((s) => (s as any)?.id && (item as any)?.id ? (s as any).id === (item as any).id : s === item);

  function toggle(item: Item) {
    const already = isSelected(item);
    selected = already ? selected.filter((s) => (s as any)?.id !== (item as any)?.id) : [...selected, item];
    dispatch("change", { selected });
  }

  function remove(item: Item) {
    selected = selected.filter((s) => (s as any)?.id !== (item as any)?.id);
    dispatch("change", { selected });
  }

  function openDropdown() {
    open = true;
    tick().then(() => inputRef?.focus());
  }

  function closeDropdown() {
    open = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      closeDropdown();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (filteredItems.length === 1) {
        toggle(filteredItems[0]);
      }
    }
  }

  onMount(() => {
    document.addEventListener("click", onDocumentClick);

    return () => document.removeEventListener("click", onDocumentClick);
  });

  function onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest(".cosmos-multiselect")) {
      closeDropdown();
    }
  }
</script>

<div class="cosmos-multiselect relative w-full max-w-2xl" role="application">
  <label for="cosmos-multiselect-input" class="block text-sm font-semibold text-slate-900 dark:text-slate-100">
    Select items
  </label>

  <div
    class="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:border-indigo-500"
    role="button"
    tabindex="0"
    aria-label="Open multi-select dropdown"
    onclick={(e) => { e.stopPropagation(); openDropdown(); }}
    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { openDropdown(); e.preventDefault(); } }}
  >
		{#if selected.length === 0}
			<span class="text-sm text-slate-500">No items selected</span>
		{/if}

		{#each selected as item (formatLabel(item))}
			<span
				class="flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950 dark:text-indigo-100"
			>
        <span class="max-w-48 truncate">{formatLabel(item)}</span>
        <button
          type="button"
          class="inline-flex h-5 w-5 items-center justify-center rounded-full text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700 focus:ring-2 focus:ring-indigo-300 focus:outline-none dark:hover:bg-indigo-800 dark:focus:ring-indigo-500"
          onclick={(e) => { e.stopPropagation(); remove(item); }}
          aria-label="Remove item"
        >
          ×
        </button>
			</span>
		{/each}

    <div class="min-w-40 flex-1">
      <input
        id="cosmos-multiselect-input"
        class="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
        {placeholder}
        bind:value={query}
        onfocus={openDropdown}
        onkeydown={handleKeydown}
        bind:this={inputRef}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls="cosmos-multiselect-listbox"
        role="combobox"
      />
    </div>
	</div>

  {#if open}
    <div
      id="cosmos-multiselect-listbox"
      class="ring-opacity-5 mt-1 max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg ring-1 ring-black dark:border-slate-700 dark:bg-slate-800"
      role="listbox"
    >
			{#if filteredItems.length === 0}
				<div class="p-3 text-sm text-slate-500 dark:text-slate-400">No matching items.</div>
			{:else}
				{#each filteredItems as item (formatLabel(item))}
          <button
            type="button"
            class="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-indigo-50 focus:bg-indigo-50 dark:hover:bg-indigo-950 dark:focus:bg-indigo-950"
            onclick={(event) => { event.stopPropagation(); toggle(item); }}
          >
            <span class="truncate text-slate-800 dark:text-slate-100">{formatLabel(item)}</span>
            <span
              class="flex h-4 w-4 items-center justify-center rounded border border-slate-300 bg-white text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            >
              {isSelected(item) ? '✓' : ''}
            </span>
          </button>
				{/each}
			{/if}
		</div>
	{/if}
</div>
