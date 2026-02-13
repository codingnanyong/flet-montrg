<script>
  import { view, selectedService, availableServices, loading, error, swaggerUI, refreshTrigger } from '../state/appStore.js';
  import { toDisplayName } from '../utils/serviceHelpers.js';
  import { API_BASE } from '../config/config.js';
  import { initSwaggerUI } from '../swagger/init.js';

  $: serviceDisplayName = $selectedService === 'integrated'
    ? 'Integrated'
    : toDisplayName($selectedService, $availableServices[$selectedService]);

  $: serviceNames = Object.keys($availableServices);

  function getSpecUrl(service) {
    const base = API_BASE || (typeof window !== 'undefined' ? window.location.origin : '');
    if (service === 'integrated') return base + '/openapi.json';
    return base + '/api/v1/swagger/services/' + service + '/spec';
  }

  function loadSwagger() {
    error.set('');
    loading.set(true);
    const prev = $swaggerUI;
    if (prev) {
      try { prev.getSystem().getActions().clear(); } catch (_) {}
    }
    const ui = initSwaggerUI(
      getSpecUrl($selectedService),
      serviceDisplayName,
      () => loading.set(false),
      (err) => {
        error.set('Failed to load API spec: ' + (err && err.message ? err.message : String(err)));
        loading.set(false);
      }
    );
    swaggerUI.set(ui);
  }

  $: if ($view === 'swagger' && $selectedService) {
    const _ = $refreshTrigger;
    // Defer so #swagger-ui exists in DOM before SwaggerUIBundle mounts
    setTimeout(() => loadSwagger(), 0);
  }

  function handleServiceSelect(e) {
    selectedService.set(e.target.value);
  }
</script>

{#if $view === 'swagger'}
  <section id="swagger" class="max-w-[min(1200px,100%)]">
    {#if $error}
      <p class="font-medium mb-4 text-red-600">{$error}</p>
    {/if}
    {#if $loading}
      <p class="text-[0.9rem] mb-4" style="color: var(--text-secondary);">Loading API spec...</p>
    {/if}

    <nav class="mb-3 text-[0.875rem]" style="color: var(--text-secondary);">
      <a href="#overview" style="color: var(--accent);">Overview</a>
      <span class="mx-1">/</span>
      <span style="color: var(--text-primary);">{serviceDisplayName}</span>
    </nav>

    <div class="flex flex-wrap items-center gap-4 mb-4">
      <label class="flex items-center gap-2">
        <span class="text-sm font-medium" style="color: var(--text-secondary);">Service</span>
        <select
          class="rounded-lg border px-4 py-2 min-w-[220px] text-sm font-medium outline-none focus:ring-2 focus:ring-[var(--accent)]"
          style="background: var(--bg-secondary); border-color: var(--border); color: var(--text-primary);"
          value={$selectedService}
          on:change={handleServiceSelect}
        >
          <option value="integrated">Integrated (all services)</option>
          {#each serviceNames as name}
            {@const spec = $availableServices[name]}
            <option value={name} disabled={spec && !spec.is_available}>
              {spec && !spec.is_available ? '(unavailable) ' : ''}{toDisplayName(name, spec)} (v{spec?.version || '?'})
            </option>
          {/each}
        </select>
      </label>
    </div>

    <div id="swagger-ui-anchor" class="rounded-lg border overflow-hidden" style="border-color: var(--border); background: var(--bg-card);">
      <div id="swagger-ui" class="p-5" style="--swagger-ui-font-size: 14px;"></div>
    </div>
  </section>
{/if}
