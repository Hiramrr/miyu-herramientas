<script>
  import { onMount, tick } from 'svelte';
  import { toolSections } from '../tools/registry.js';

  const FAVORITES_KEY = 'mh-favorites';
  const totalTools = toolSections.reduce((total, section) => total + section.tools.length, 0);

  let query = $state('');
  let selectedSection = $state('all');
  let favoriteIds = $state([]);

  function normalize(value) {
    return (value || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  const filteredSections = $derived.by(() => {
    const normalizedQuery = normalize(query);

    return toolSections
      .filter((section) => selectedSection === 'all' || section.id === selectedSection)
      .map((section) => ({
        ...section,
        tools: section.tools.filter((tool) => {
          if (!normalizedQuery) return true;
          return normalize(`${tool.name} ${tool.description} ${tool.id} ${section.title}`).includes(normalizedQuery);
        })
      }))
      .filter((section) => section.tools.length);
  });

  const visibleToolCount = $derived(
    filteredSections.reduce((total, section) => total + section.tools.length, 0)
  );
  const firstVisibleToolId = $derived(filteredSections[0]?.tools[0]?.id ?? null);
  const favoriteIdSet = $derived(new Set(favoriteIds));

  async function refreshIcons() {
    await tick();
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  $effect(() => {
    query;
    selectedSection;
    favoriteIds;
    refreshIcons();
  });

  onMount(() => {
    loadFavorites();

    const syncFavorites = () => loadFavorites();
    window.addEventListener('mh:favorites-changed', syncFavorites);
    window.addEventListener('storage', syncFavorites);

    return () => {
      window.removeEventListener('mh:favorites-changed', syncFavorites);
      window.removeEventListener('storage', syncFavorites);
    };
  });

  function loadFavorites() {
    try {
      const stored = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
      favoriteIds = Array.isArray(stored) ? stored.filter(Boolean) : [];
    } catch {
      favoriteIds = [];
    }
  }

  function saveFavorites(ids) {
    favoriteIds = ids;
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent('mh:favorites-changed', { detail: { favorites: ids } }));
  }

  function clearSearch() {
    query = '';
  }

  function resetFinder() {
    query = '';
    selectedSection = 'all';
  }

  function handleClick(toolId) {
    if (window.showTool) return window.showTool(toolId);
    const retry = setInterval(() => {
      if (window.showTool) { clearInterval(retry); window.showTool(toolId); }
    }, 50);
    setTimeout(() => clearInterval(retry), 3000);
  }

  function toggleFavorite(event, toolId) {
    event.stopPropagation();

    if (typeof window.toggleFavoriteTool === 'function') {
      window.toggleFavoriteTool(toolId);
      return;
    }

    if (favoriteIdSet.has(toolId)) {
      saveFavorites(favoriteIds.filter((id) => id !== toolId));
    } else {
      saveFavorites([...favoriteIds, toolId]);
    }
  }

  function handleFinderKeydown(event) {
    if (event.key === 'Enter' && firstVisibleToolId) {
      event.preventDefault();
      handleClick(firstVisibleToolId);
      return;
    }

    if (event.key === 'Escape') {
      if (query) {
        event.preventDefault();
        clearSearch();
      } else if (selectedSection !== 'all') {
        event.preventDefault();
        selectedSection = 'all';
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      const firstCard = document.querySelector('#panel-tool-grid .tool-grid-card');
      if (firstCard) {
        event.preventDefault();
        firstCard.focus();
      }
    }
  }
</script>

<div class="tool-panel" id="panel-tool-grid">
  <div class="panel-header">
    <h2><i data-lucide="layout-grid"></i> Herramientas</h2>
    <p>Todas las utilidades organizadas por categoría. Toca una para comenzar.</p>
  </div>

  <div class="tool-finder">
    <div class="tool-finder-search">
      <i data-lucide="search"></i>
      <input
        id="tool-grid-search"
        type="search"
        bind:value={query}
        placeholder="Buscar herramientas"
        aria-label="Buscar herramientas"
        autocomplete="off"
        onkeydown={handleFinderKeydown}
      >
      {#if query}
        <button class="tool-finder-clear" type="button" aria-label="Limpiar búsqueda" onclick={clearSearch}>
          <i data-lucide="x"></i>
        </button>
      {/if}
    </div>

    <div class="tool-finder-tabs" aria-label="Filtrar por categoría">
      <button
        class:active={selectedSection === 'all'}
        aria-pressed={selectedSection === 'all'}
        type="button"
        onclick={() => selectedSection = 'all'}
      >
        Todas
        <span>{totalTools}</span>
      </button>
      {#each toolSections as section}
        <button
          class:active={selectedSection === section.id}
          aria-pressed={selectedSection === section.id}
          type="button"
          onclick={() => selectedSection = section.id}
        >
          {section.title}
          <span>{section.tools.length}</span>
        </button>
      {/each}
    </div>

    <div class="tool-finder-meta" aria-live="polite">
      {visibleToolCount} {visibleToolCount === 1 ? 'herramienta' : 'herramientas'}
    </div>
  </div>

  <div class="tool-quick-access" id="tool-quick-access"></div>

  {#if filteredSections.length}
    {#each filteredSections as section}
      <div class="tool-grid-section" data-section={section.id}>
        <div class="tool-grid-section-title">{section.title}</div>
        <div class="tool-grid">
          {#each section.tools as tool}
            <div class="tool-grid-card-wrap">
              <button
                class="tool-grid-card"
                data-tool={tool.id}
                type="button"
                onclick={() => handleClick(tool.id)}
              >
                <i data-lucide={tool.icon}></i>
                <span class="tool-grid-name">{tool.name}</span>
                <span class="tool-grid-desc">{tool.description}</span>
              </button>
              <button
                class:active={favoriteIdSet.has(tool.id)}
                class="tool-grid-favorite"
                type="button"
                aria-pressed={favoriteIdSet.has(tool.id)}
                aria-label={favoriteIdSet.has(tool.id) ? 'Quitar de favoritas' : 'Marcar como favorita'}
                title={favoriteIdSet.has(tool.id) ? 'Quitar de favoritas' : 'Favorita'}
                onclick={(event) => toggleFavorite(event, tool.id)}
              >
                <i data-lucide="star"></i>
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  {:else}
    <div class="tool-grid-empty">
      <i data-lucide="search-x"></i>
      <strong>Sin resultados</strong>
      <span>{query ? `No hay coincidencias para "${query}".` : 'No hay herramientas en esta categoría.'}</span>
      <button type="button" onclick={resetFinder}>Ver todas</button>
    </div>
  {/if}
</div>
