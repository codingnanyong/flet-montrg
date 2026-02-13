<script>
  import { loading, error, searchQuery, filteredServiceNames, availableServices, serviceCount } from '../state/appStore.js';
  import { toDisplayName, serviceCardIconPath } from '../utils/serviceHelpers.js';
  import { refreshSpecs } from '../api/index.js';
  import { APP_NAME } from '../config/constants.js';

  export let onSelectService = (_name) => {};

  function handleQuickCard(e, service) {
    e.preventDefault();
    e.stopPropagation();
    onSelectService(service || 'integrated');
  }

  function handleCardClick(e, name) {
    e.preventDefault();
    e.stopPropagation();
    const spec = $availableServices[name];
    if (spec && spec.is_available) onSelectService(name);
  }
</script>

<div class="max-w-[min(1200px,100%)]">
  <div class="mb-8">
    <h1 class="m-0 mb-1 text-[1.625rem] font-bold tracking-tight" style="color: var(--text-primary); letter-spacing: -0.02em;">{APP_NAME} API Services</h1>
    <p class="m-0 mb-1 text-[0.95rem] leading-normal" style="color: var(--text-secondary);">
      {APP_NAME} API Gateway — Integrated docs and proxy
    </p>
    <p class="m-0 text-[0.85rem]" style="color: var(--text-tertiary);">{$serviceCount} services integrated</p>
  </div>

  {#if $loading}
    <p class="text-[0.9rem] mb-4" style="color: var(--text-secondary);">Loading services...</p>
  {/if}
  {#if $error}
    <p class="font-medium mb-4 text-red-600">{$error}</p>
  {/if}

  <section class="mb-10">
    <h2 class="m-0 mb-4 text-[1.125rem] font-bold tracking-tight" style="color: var(--text-primary);">Quick Links</h2>
    <div class="grid gap-4 grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
      <a
        href="#swagger"
        class="flex flex-col items-center py-4 px-3 rounded-xl no-underline text-inherit transition-all border min-h-0 border-l-4 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[var(--shadow-card-hover)]"
        style="background: var(--bg-card); border-color: var(--border); box-shadow: var(--shadow-card); border-left-color: var(--accent);"
        on:click={(e) => handleQuickCard(e, 'integrated')}
      >
        <span class="text-3xl leading-none mb-2">📄</span>
        <div class="flex flex-col items-center gap-0.5 text-center">
          <span class="text-[0.8rem] font-medium leading-snug" style="color: var(--text-primary);">Swagger UI</span>
          <span class="text-[0.7rem] leading-snug" style="color: var(--text-tertiary);">API docs and Try it out</span>
        </div>
      </a>
      <a
        href="#swagger"
        class="flex flex-col items-center py-4 px-3 rounded-xl no-underline text-inherit transition-all border min-h-0 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[var(--shadow-card-hover)]"
        style="background: var(--bg-card); border-color: var(--border); box-shadow: var(--shadow-card);"
        on:click={(e) => handleQuickCard(e, 'integrated')}
      >
        <span class="text-3xl leading-none mb-2">📖</span>
        <div class="flex flex-col items-center gap-0.5 text-center">
          <span class="text-[0.8rem] font-medium leading-snug" style="color: var(--text-primary);">Integrated View</span>
          <span class="text-[0.7rem] leading-snug" style="color: var(--text-tertiary);">All services in one spec</span>
        </div>
      </a>
    </div>
  </section>

  <section>
    <div class="flex flex-wrap items-start justify-between gap-4 mb-4">
      <div>
        <h2 class="m-0 mb-1 text-[1.125rem] font-bold tracking-tight" style="color: var(--text-primary);">Table APIs</h2>
        <p class="m-0 mb-4 text-[0.9rem] leading-normal" style="color: var(--text-secondary);">Master data · Config · History APIs — Click card for Swagger docs</p>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex items-center min-w-[200px] py-2 px-3 rounded-lg border" style="background: var(--bg-secondary); border-color: var(--border);">
          <span class="mr-2 text-base opacity-70">🔍</span>
          <input
            type="search"
            class="flex-1 min-w-0 border-0 bg-transparent text-[0.9rem] outline-none"
            style="color: var(--text-primary);"
            placeholder="Search services..."
            bind:value={$searchQuery}
          />
        </div>
        <button
          type="button"
          class="py-2 px-3 rounded-lg border text-sm font-medium transition-colors"
          style="background: var(--bg-secondary); border-color: var(--border); color: var(--text-primary);"
          on:click={refreshSpecs}
        >Refresh</button>
      </div>
    </div>

    {#if $filteredServiceNames.length === 0}
      <p class="py-8 text-center text-[0.95rem]" style="color: var(--text-tertiary);">No services to show. Connect the API backend or use Refresh.</p>
    {:else}
      <div class="grid gap-4 grid-cols-[repeat(auto-fill,minmax(100px,1fr))]">
        {#each $filteredServiceNames as name}
          {@const spec = $availableServices[name]}
          {@const label = toDisplayName(name, spec)}
          {@const path = serviceCardIconPath(name)}
          <button
            type="button"
            class="flex flex-col items-center py-4 px-3 rounded-xl border text-left w-full transition-all cursor-pointer hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[var(--shadow-card-hover)]"
            style="background: var(--bg-card); border-color: var(--border); box-shadow: var(--shadow-card); color: inherit;"
            on:click={(e) => handleCardClick(e, name)}
          >
            <span class="mb-2 flex items-center justify-center w-10 h-10">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="color: var(--text-secondary);"><path stroke-linecap="round" stroke-linejoin="round" d={path}/></svg>
            </span>
            <span class="text-[0.8rem] font-medium text-center leading-snug" style="color: var(--text-primary);">{label}</span>
          </button>
        {/each}
      </div>
    {/if}
  </section>
</div>
