import { toolSections } from '../tools/registry.js';
import { setActiveTool } from '../tools/activeTool.svelte.js';
import { toolLoaders } from '../tools/lazyImports.js';
import { parseFavoriteIds, toolIdFromRow } from './navigation.js';


setupToolNavigation();
    setupSearchFilter();
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
    var toolIndex = toolSections.flatMap(function(section) {
      return section.tools.map(function(tool) {
        return {
          id: tool.id,
          icon: tool.icon,
          name: tool.name,
          description: tool.description,
          section: section.title,
          haystack: normalizeText([tool.name, tool.description, section.title, tool.id].join(' '))
        };
      });
    });
    var favoriteTools = new Set(readJSON('mh-favorites', []));
    var recentTools = readJSON('mh-recent-tools', []);
    var commandState = { overlay: null, input: null, list: null, active: 0, results: [] };
    setupExperienceEnhancements();

    function readJSON(key, fallback) {
      try {
        var value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
      } catch {
        return fallback;
      }
    }

    function saveJSON(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }

    function normalizeText(value) {
      return (value || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    function getToolMeta(id) {
      return toolIndex.find(function(tool) { return tool.id === id; });
    }

    function isTypingTarget(target) {
      if (!target) return false;
      var tag = target.tagName;
      return target.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    }

    function setupSearchFilter() {
      var searchInput = document.getElementById('sidebar-search');
      if (!searchInput) return;

      searchInput.addEventListener('input', filterSidebar);
      searchInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
          var firstVisible = document.querySelector('.tool-item:not(.hidden)');
          if (firstVisible) {
            event.preventDefault();
            showTool(toolIdFromRow(firstVisible));
            searchInput.blur();
          }
        } else if (event.key === 'Escape') {
          if (searchInput.value) {
            event.preventDefault();
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      });
    }
    function filterSidebar() {
      var searchInput = document.getElementById('sidebar-search');
      if (!searchInput) return;
      var q = normalizeText(searchInput.value.trim());
      var list = document.querySelector('.tool-list');
      var empty = document.getElementById('tool-empty');
      var totalVisible = 0;
      if (q) { list.classList.add('searching'); } else { list.classList.remove('searching'); }
      document.querySelectorAll('.tool-item').forEach(function(item) {
        var name = normalizeText(item.querySelector('.tool-name').textContent);
        var descEl = item.querySelector('.tool-desc');
        var desc = descEl ? normalizeText(descEl.textContent) : '';
        var section = item.closest('.tool-section');
        var sectionTitle = section ? normalizeText(section.querySelector('.tool-section-title').textContent) : '';
        if (!q || name.indexOf(q) !== -1 || desc.indexOf(q) !== -1 || sectionTitle.indexOf(q) !== -1) {
          item.classList.remove('hidden');
          totalVisible++;
        } else {
          item.classList.add('hidden');
        }
      });
      document.querySelectorAll('.tool-section').forEach(function(section) {
        var visible = section.querySelectorAll('.tool-item:not(.hidden)').length;
        section.style.display = visible ? '' : 'none';
      });
      if (empty) empty.classList.toggle('show', !!q && totalVisible === 0);
    }
    function setupToolNavigation() {
      document.querySelectorAll('.tool-item').forEach(function(item) {
        item.addEventListener('click', function() {
          showTool(toolIdFromRow(item));
        });
        item.addEventListener('keydown', function(event) {
          // La estrella de favorita es hija de la fila: su tecla no debe abrir la herramienta.
          if (event.target !== item) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            showTool(toolIdFromRow(item));
          }
        });
      });
    }
    function showTool(t) {
      setActiveTool(t);
      var gridPanel = document.getElementById('panel-tool-grid');
      document.querySelectorAll('.tool-panel').forEach(function(p) { p.classList.remove('active'); });
      if (!t) {
        if (gridPanel) gridPanel.classList.add('active');
        var titleElEmpty = document.getElementById('app-header-title');
        if (titleElEmpty) titleElEmpty.textContent = 'Herramientas';
        localStorage.removeItem('mh-active-tool');
        updateFavoriteButtons();
        renderQuickAccess();
        document.title = 'miyu-herramientas';
        if (window.matchMedia('(max-width: 768px)').matches) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          document.body.classList.remove('sidebar-open');
        }
        return;
      }
      var item = t ? document.querySelector('.tool-item[data-tool="' + t + '"]') : null;
      var panel = t ? document.getElementById('panel-' + t) : null;
      if (!item && !toolLoaders[t]) return;
      if (panel) panel.classList.add('active');
      if (gridPanel) gridPanel.classList.remove('active');
      var titleEl = document.getElementById('app-header-title');
      if (titleEl && item) {
        titleEl.textContent = item.querySelector('.tool-name').textContent;
      }
      if (localStorage.getItem('mh-remember-tool') !== '0') {
        localStorage.setItem('mh-active-tool', t);
      }
      rememberRecentTool(t);
      updateFavoriteButtons();
      renderQuickAccess();
      if (panel) focusFirstPanelControl(panel);
      if (item) {
        document.title = item.querySelector('.tool-name').textContent + ' - miyu-herramientas';
      } else {
        document.title = 'Herramienta - miyu-herramientas';
      }
      if (window.matchMedia('(max-width: 768px)').matches) {
        if (panel) panel.scrollIntoView({ block: 'start', behavior: 'smooth' });
        if (localStorage.getItem('mh-close-mobile') !== '0') {
          document.body.classList.remove('sidebar-open');
        }
      }
    }
    window.showTool = showTool;

    function rememberRecentTool(id) {
      var maxRecent=parseInt(localStorage.getItem('mh-recent-count'))||5;
      recentTools = [id].concat(recentTools.filter(function(toolId) { return toolId !== id; })).slice(0, maxRecent);
      saveJSON('mh-recent-tools', recentTools);
      renderCommandList('');
      renderQuickAccess();
    }

    function updateFavoriteButtons() {
      document.querySelectorAll('.tool-item').forEach(function(item) {
        var id = item.getAttribute('data-tool');
        item.classList.toggle('is-favorite', favoriteTools.has(id));
        var button = item.querySelector('.tool-favorite');
        if (button) {
          button.setAttribute('aria-pressed', favoriteTools.has(id) ? 'true' : 'false');
          button.setAttribute('aria-label', favoriteTools.has(id) ? 'Quitar de favoritas' : 'Marcar como favorita');
        }
      });
    }

    // Guarda y avisa; applyFavorites hace el trabajo visual, igual que en otras pestañas o en ToolGrid.
    function toggleFavorite(id) {
      if (favoriteTools.has(id)) {
        showToast('Quitada de favoritas');
      } else {
        showToast('Guardada como favorita');
      }
      var ids = favoriteTools.has(id)
        ? Array.from(favoriteTools).filter(function(favId) { return favId !== id; })
        : Array.from(favoriteTools).concat(id);
      saveJSON('mh-favorites', ids);
      window.dispatchEvent(new CustomEvent('mh:favorites-changed', { detail: { favorites: ids } }));
    }

    function applyFavorites(ids) {
      favoriteTools = new Set(parseFavoriteIds(ids, getToolMeta));
      updateFavoriteButtons();
      renderCommandList('');
      renderQuickAccess();
      renderSidebarFavorites();
      filterSidebar();
      if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
    }

    function setupFavoriteSyncEvents() {
      window.toggleFavoriteTool = toggleFavorite;
      window.addEventListener('mh:favorites-changed', function(event) {
        applyFavorites(event.detail && event.detail.favorites ? event.detail.favorites : readJSON('mh-favorites', []));
      });
      // Otra pestaña cambió favoritas (o borró los datos locales).
      window.addEventListener('storage', function(event) {
        if (event.key === null || event.key === 'mh-favorites') applyFavorites(readJSON('mh-favorites', []));
      });
    }

    function setupExperienceEnhancements() {
      setupFavoriteSyncEvents();
      setupFavorites();
      setupCommandPalette();
      setupCopyFeedback();
      setupCopyButtonFeedback();
      setupFilePickers();
      setupHomeButton();
      setupOutputShortcuts();
      setupTextareaAutosize();
      restoreLastTool();
      setupGlobalShortcuts();
      restoreSidebarState();
      setupSidebarToggleState();
      setupToolReadyFocus();
      updateFavoriteButtons();
      renderQuickAccess();
      renderSidebarFavorites();
    }

    function setupFavorites() {
      document.querySelectorAll('.tool-favorite').forEach(function(button) {
        button.addEventListener('click', function(event) {
          event.stopPropagation();
          toggleFavorite(button.getAttribute('data-favorite'));
        });
      });
    }

    function setupHomeButton() {
      var title = document.getElementById('app-header-title');
      var homeButton = document.getElementById('tool-home-item');
      var goHome = function() {
        showTool(null);
      };
      if (title) title.addEventListener('click', goHome);
      if (homeButton) {
        homeButton.addEventListener('click', goHome);
        homeButton.addEventListener('keydown', function(event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            goHome();
          }
        });
      }
    }

    function focusFirstPanelControl(panel) {
      if (!panel || window.matchMedia('(max-width: 768px)').matches) return;
      if (localStorage.getItem('mh-autofocus') === '0') return;
      setTimeout(function() {
        var control = panel.querySelector('textarea:not([readonly]), input:not([type="hidden"]):not([type="file"]):not([disabled]), select:not([disabled])');
        if (!control || document.activeElement === control) return;
        control.focus({ preventScroll: true });
      }, 80);
    }

    // El loader emite mh:tool-ready al activar un panel cargado en diferido; ahí aún no existía para showTool.
    function setupToolReadyFocus() {
      window.addEventListener('mh:tool-ready', function(event) {
        var id = event.detail && event.detail.id;
        if (id) focusFirstPanelControl(document.getElementById('panel-' + id));
      });
    }

    // aria-expanded sigue a la clase del body, que cambia desde varios sitios (botón, fondo, cierre al elegir).
    function setupSidebarToggleState() {
      var toggle = document.getElementById('sidebar-toggle');
      if (!toggle) return;
      var sync = function() {
        var mobile = window.matchMedia('(max-width: 768px)').matches;
        var open = mobile
          ? document.body.classList.contains('sidebar-open')
          : !document.body.classList.contains('sidebar-collapsed');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      };
      new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
      sync();
    }

    function renderQuickAccess() {
      var root = document.getElementById('tool-quick-access');
      if (!root) return;
      if (localStorage.getItem('mh-quick-access') === '0') {
        root.innerHTML = '';
        root.classList.remove('show');
        return;
      }
      var favoriteIds = Array.from(favoriteTools).filter(getToolMeta);
      var maxRecent=parseInt(localStorage.getItem('mh-recent-count'))||5;
      var recentIds = recentTools.filter(function(id) { return favoriteIds.indexOf(id) === -1 && getToolMeta(id); }).slice(0, maxRecent);
      var groups = [
        { title: 'Favoritas', ids: favoriteIds },
        { title: 'Recientes', ids: recentIds }
      ].filter(function(group) { return group.ids.length; });

      if (!groups.length) {
        root.innerHTML = '';
        root.classList.remove('show');
        return;
      }

      root.classList.add('show');
      root.innerHTML = groups.map(function(group) {
        return '<section class="tool-quick-group"><div class="tool-quick-title">'+group.title+'</div><div class="tool-quick-list">'+group.ids.map(function(id) {
          var tool = getToolMeta(id);
          return '<button class="tool-quick-chip" type="button" data-tool="'+tool.id+'"><i data-lucide="'+tool.icon+'"></i><span>'+tool.name+'</span></button>';
        }).join('')+'</div></section>';
      }).join('');

      root.querySelectorAll('.tool-quick-chip').forEach(function(button) {
        button.addEventListener('click', function() {
          showTool(button.getAttribute('data-tool'));
        });
      });
      if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
    }

    function renderSidebarFavorites() {
      var section = document.getElementById('sidebar-favorites-section');
      var list = document.getElementById('sidebar-favorites-list');
      if (!section || !list) return;
      var enabled = localStorage.getItem('mh-sidebar-favorites') !== '0';
      var ids = Array.from(favoriteTools).filter(getToolMeta);
      if (!enabled || !ids.length) {
        section.classList.add('hidden');
        list.innerHTML = '';
        return;
      }
      section.classList.remove('hidden');
      list.innerHTML = ids.map(function(id) {
        var tool = getToolMeta(id);
        return '<div class="tool-item sidebar-favorite-item" data-sidebar-favorite-tool="'+tool.id+'" role="button" tabindex="0"><i data-lucide="'+tool.icon+'"></i><div class="tool-info"><div class="tool-name">'+tool.name+'</div><div class="tool-desc">'+tool.description+'</div></div></div>';
      }).join('');
      list.querySelectorAll('.sidebar-favorite-item').forEach(function(item) {
        var open = function() { showTool(item.getAttribute('data-sidebar-favorite-tool')); };
        item.addEventListener('click', open);
        item.addEventListener('keydown', function(event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            open();
          }
        });
      });
      if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
    }

    function setupOutputShortcuts() {
      document.addEventListener('dblclick', function(event) {
        var output = event.target.closest('.output');
        if (!output || output.querySelector('img, canvas, button, input, textarea, select')) return;
        var text = output.textContent.trim();
        if (text && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text);
        }
      });
    }

    function setupTextareaAutosize() {
      document.querySelectorAll('textarea:not([readonly])').forEach(function(textarea) {
        if (textarea.dataset.autosize === '1') return;
        textarea.dataset.autosize = '1';
        textarea.classList.add('textarea-autosize');
        var resize = function() {
          textarea.style.height = 'auto';
          textarea.style.height = Math.min(textarea.scrollHeight, 420) + 'px';
        };
        textarea.addEventListener('input', resize);
        resize();
      });
    }

    function triggerPrimaryAction() {
      var panel = document.querySelector('.tool-panel.active');
      if (!panel) return false;
      var button = Array.from(panel.querySelectorAll('.btn')).find(function(btn) {
        return !btn.disabled && btn.offsetParent !== null && !btn.classList.contains('btn-green') && !btn.classList.contains('btn-red') && !btn.classList.contains('btn-quiet');
      });
      if (!button) return false;
      button.click();
      return true;
    }

    function copyActiveResult() {
      var panel = document.querySelector('.tool-panel.active');
      if (!panel || !navigator.clipboard || !navigator.clipboard.writeText) return false;
      var source = panel.querySelector('textarea[readonly], .output:not(:empty)');
      if (!source) return false;
      var text = source.value !== undefined ? source.value : source.textContent;
      text = (text || '').trim();
      if (!text) return false;
      navigator.clipboard.writeText(text);
      return true;
    }

    function restoreLastTool() {
      if (localStorage.getItem('mh-remember-tool') === '0') {
        showTool(null);
        return;
      }
      var last = localStorage.getItem('mh-active-tool');
      if (last && (document.getElementById('panel-' + last) || toolLoaders[last])) {
        showTool(last);
      } else {
        showTool(null);
      }
    }

    function setupGlobalShortcuts() {
      document.addEventListener('keydown', function(event) {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          openCommandPalette();
          return;
        }
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
          if (triggerPrimaryAction()) event.preventDefault();
          return;
        }
        if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'c') {
          if (copyActiveResult()) event.preventDefault();
          return;
        }
        if (event.key === '/' && !isTypingTarget(event.target)) {
          event.preventDefault();
          var gridPanel = document.getElementById('panel-tool-grid');
          var gridSearch = document.getElementById('tool-grid-search');
          var search = gridPanel && gridPanel.classList.contains('active') && gridSearch ? gridSearch : document.getElementById('sidebar-search');
          if (search) search.focus();
        }
        if (event.key === 'Escape') {
          closeCommandPalette();
          var settingsPanel = document.getElementById('settings-panel');
          if (settingsPanel && settingsPanel.classList.contains('show')) {
            document.getElementById('settings-overlay').classList.remove('show');
            settingsPanel.classList.remove('show');
          }
          if (window.matchMedia('(max-width: 768px)').matches) {
            document.body.classList.remove('sidebar-open');
          }
        }
      });
    }

    function setupCommandPalette() {
      var opener = document.getElementById('command-open');
      if (opener) opener.addEventListener('click', openCommandPalette);
      var overlay = document.createElement('div');
      overlay.className = 'command-overlay';
      overlay.innerHTML = '<div class="command-dialog" role="dialog" aria-modal="true" aria-label="Buscar herramienta"><div class="command-search"><i data-lucide="search"></i><input id="command-input" type="text" placeholder="Busca por nombre, categoría o función..."><kbd>Esc</kbd></div><div class="command-list" id="command-list"></div></div>';
      document.body.appendChild(overlay);
      commandState.overlay = overlay;
      commandState.input = overlay.querySelector('#command-input');
      commandState.list = overlay.querySelector('#command-list');
      overlay.addEventListener('click', function(event) {
        if (event.target === overlay) closeCommandPalette();
      });
      commandState.input.addEventListener('input', function() {
        renderCommandList(commandState.input.value);
      });
      commandState.input.addEventListener('keydown', function(event) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          moveCommandSelection(1);
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          moveCommandSelection(-1);
        } else if (event.key === 'Enter') {
          event.preventDefault();
          var selected = commandState.results[commandState.active];
          if (selected) {
            showTool(selected.id);
            closeCommandPalette();
          }
        } else if (event.key === 'Escape' && commandState.input.value) {
          event.preventDefault();
          event.stopPropagation();
          commandState.input.value = '';
          renderCommandList('');
        }
      });
      renderCommandList('');
    }

    function openCommandPalette() {
      if (!commandState.overlay) return;
      commandState.overlay.classList.add('show');
      renderCommandList('');
      commandState.input.value = '';
      setTimeout(function() { commandState.input.focus(); }, 0);
      if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
    }

    function closeCommandPalette() {
      if (commandState.overlay) commandState.overlay.classList.remove('show');
    }

    function renderCommandList(query) {
      if (!commandState.list) return;
      var q = normalizeText((query || '').trim());
      var pinned = Array.from(favoriteTools).concat(recentTools).filter(function(id, index, arr) {
        return arr.indexOf(id) === index;
      });
      var preferred = pinned.map(getToolMeta).filter(Boolean);
      var rest = toolIndex.filter(function(tool) {
        return pinned.indexOf(tool.id) === -1;
      });
      var pool = preferred.concat(rest);
      commandState.results = pool.filter(function(tool) {
        return !q || tool.haystack.indexOf(q) !== -1;
      }).slice(0, 12);
      commandState.active = 0;
      if (!commandState.results.length) {
        commandState.list.innerHTML = '<div class="command-empty">Sin coincidencias</div>';
        return;
      }
      commandState.list.innerHTML = commandState.results.map(function(tool, index) {
        var badges = [];
        if (favoriteTools.has(tool.id)) badges.push('Favorita');
        if (recentTools.indexOf(tool.id) !== -1) badges.push('Reciente');
        return '<button class="command-item '+(index === 0 ? 'active' : '')+'" type="button" data-command-tool="'+tool.id+'"><i data-lucide="'+tool.icon+'"></i><span><strong>'+tool.name+'</strong><small>'+tool.section+' · '+tool.description+'</small></span>'+(badges.length ? '<em>'+badges.join(' · ')+'</em>' : '')+'</button>';
      }).join('');
      commandState.list.querySelectorAll('.command-item').forEach(function(item) {
        item.addEventListener('click', function() {
          showTool(item.getAttribute('data-command-tool'));
          closeCommandPalette();
        });
      });
      if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
    }

    function moveCommandSelection(step) {
      if (!commandState.results.length) return;
      commandState.active = (commandState.active + step + commandState.results.length) % commandState.results.length;
      commandState.list.querySelectorAll('.command-item').forEach(function(item, index) {
        item.classList.toggle('active', index === commandState.active);
        if (index === commandState.active) item.scrollIntoView({ block: 'nearest' });
      });
    }

    var toastTimer;
    function showToast(message) {
      var toast = document.getElementById('app-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-toast';
        toast.className = 'app-toast';
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 1800);
    }

    function setupCopyFeedback() {
      if (!navigator.clipboard || !navigator.clipboard.writeText || navigator.clipboard._mhWrapped) return;
      var nativeWrite = navigator.clipboard.writeText.bind(navigator.clipboard);
      navigator.clipboard.writeText = function(text) {
        return nativeWrite(text).then(function(result) {
          showToast('Copiado al portapapeles');
          return result;
        }).catch(function(error) {
          showToast('No se pudo copiar');
          throw error;
        });
      };
      navigator.clipboard._mhWrapped = true;
    }

    function setupCopyButtonFeedback() {
      document.addEventListener('click', function(event) {
        var button = event.target.closest('button');
        if (!button || button.closest('.command-dialog')) return;
        var label = (button.textContent || '').trim().toLowerCase();
        if (label.indexOf('copiar') !== -1) {
          setTimeout(function() {
            var toast = document.getElementById('app-toast');
            if (!toast || !toast.classList.contains('show')) showToast('Copiado al portapapeles');
          }, 80);
        }
      });
    }

    function setupFilePickers() {
      document.querySelectorAll('input[type="file"]').forEach(function(input) {
        if (input.dataset.fileEnhanced === '1') return;
        var style = window.getComputedStyle(input);
        if (style.display === 'none') return;

        input.dataset.fileEnhanced = '1';
        input.classList.add('native-file-input');

        var wrapper = document.createElement('div');
        wrapper.className = 'file-picker';
        wrapper.tabIndex = 0;
        wrapper.setAttribute('role', 'button');
        wrapper.setAttribute('aria-label', input.multiple ? 'Seleccionar archivos' : 'Seleccionar archivo');

        var icon = document.createElement('span');
        icon.className = 'file-picker-icon';
        icon.innerHTML = '<i data-lucide="upload-cloud"></i>';

        var content = document.createElement('span');
        content.className = 'file-picker-content';

        var title = document.createElement('span');
        title.className = 'file-picker-title';
        title.textContent = input.multiple ? 'Arrastra tus archivos aquí' : 'Arrastra tu archivo aquí';

        var status = document.createElement('span');
        status.className = 'file-picker-status';

        function updateStatus() {
          if (!input.files || input.files.length === 0) {
            status.textContent = input.multiple ? 'Sin archivos seleccionados' : 'Sin archivo seleccionado';
            wrapper.classList.remove('has-file');
            return;
          }
          wrapper.classList.add('has-file');
          if (input.files.length === 1) {
            status.textContent = input.files[0].name;
          } else {
            status.textContent = input.files.length + ' archivos seleccionados';
          }
        }

        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        wrapper.appendChild(icon);
        content.appendChild(title);
        content.appendChild(status);
        wrapper.appendChild(content);

        wrapper.addEventListener('click', function() { input.click(); });
        wrapper.addEventListener('keydown', function(event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            input.click();
          }
        });
        wrapper.addEventListener('dragover', function(event) {
          event.preventDefault();
          wrapper.classList.add('drag-over');
        });
        wrapper.addEventListener('dragleave', function() {
          wrapper.classList.remove('drag-over');
        });
        wrapper.addEventListener('drop', function(event) {
          event.preventDefault();
          wrapper.classList.remove('drag-over');
          if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length) {
            input.files = event.dataTransfer.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
        input.addEventListener('change', updateStatus);
        updateStatus();
      });
      if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
    }
    window.setupFilePickers = setupFilePickers;

    var sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', function() {
        if (window.matchMedia('(max-width: 768px)').matches) {
          document.body.classList.remove('sidebar-collapsed');
          document.body.classList.toggle('sidebar-open');
        } else {
          document.body.classList.toggle('sidebar-collapsed');
          localStorage.setItem('mh-sidebar-collapsed', document.body.classList.contains('sidebar-collapsed') ? '1' : '0');
        }
      });
    }

    function restoreSidebarState() {
      if (!window.matchMedia('(max-width: 768px)').matches && localStorage.getItem('mh-sidebar-collapsed') === '1') {
        document.body.classList.add('sidebar-collapsed');
      }
    }

    var sidebarCloseMobile = document.getElementById('sidebar-close-mobile');
    if (sidebarCloseMobile) {
      sidebarCloseMobile.addEventListener('click', function() {
        document.body.classList.remove('sidebar-open');
      });
    }

    var sidebarBackdrop = document.getElementById('sidebar-backdrop');
    if (sidebarBackdrop) {
      sidebarBackdrop.addEventListener('click', function() {
        document.body.classList.remove('sidebar-open');
      });
    }

    (function(){
      var body=document.body;
      var overlay=document.getElementById('settings-overlay');
      var panel=document.getElementById('settings-panel');
      var openBtns=document.querySelectorAll('[data-settings-open], #settings-open');
      var closeBtn=document.getElementById('settings-close');
      var chipGrid=document.getElementById('theme-chip-grid');
      var systemThemeToggle=document.getElementById('setting-system-theme');
      var gridToggle=document.getElementById('setting-grid');
      var compactToggle=document.getElementById('setting-compact');
      var largeControlsToggle=document.getElementById('setting-large-controls');
      var wideContentToggle=document.getElementById('setting-wide-content');
      var descToggle=document.getElementById('setting-desc');
      var largeTextToggle=document.getElementById('setting-large-text');
      var highContrastToggle=document.getElementById('setting-high-contrast');
      var motionToggle=document.getElementById('setting-motion');
      var clearBtn=document.getElementById('setting-clear');
      var rememberToolToggle=document.getElementById('setting-remember-tool');
      var quickAccessToggle=document.getElementById('setting-quick-access');
      var sidebarFavoritesToggle=document.getElementById('setting-sidebar-favorites');
      var closeMobileToggle=document.getElementById('setting-close-mobile');
      var autofocusToggle=document.getElementById('setting-autofocus');
      var systemThemeQuery=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)'):null;

      var autoThemeInterval=null;

      var themeClasses=['theme-light','theme-dark','theme-jazmin','theme-hacker','theme-ocean','theme-dracula','theme-nord','theme-solarized','theme-solarized-light','theme-gruvbox','theme-sakura','theme-lavender','theme-rosa','theme-sandia','theme-matcha','theme-moka','theme-candy','theme-aurora','theme-synthwave','theme-minimal','theme-wispr','theme-solarized-osaka','theme-olivia','theme-codex'];

      var themeBgColors={light:'#faf9f5',dark:'#1a1917',jazmin:'#fffdf5',hacker:'#000000',ocean:'#0f172a',dracula:'#282a36',nord:'#2E3440',solarized:'#002b36','solarized-light':'#fdf6e3',gruvbox:'#282828',sakura:'#1a1225',lavender:'#f5f0fa',rosa:'#fff5f7',sandia:'#1a3a1a',matcha:'#f4f1e8',moka:'#3e2723',candy:'#fdf0f8',aurora:'#0a0e1a',synthwave:'#1a1b26',minimal:'#ffffff',wispr:'#fbfaf3','solarized-osaka':'#001f27',olivia:'#1c1b1a',codex:'#0d1117'};

      var catImg=new Image();
      catImg.crossOrigin='anonymous';
      catImg.src='/cat-icon.png';
      catImg.onload=function(){
        var currentTheme=localStorage.getItem('theme')||'light';
        var useSystem=localStorage.getItem('mh-system-theme')==='1';
        if(useSystem&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches){currentTheme='dark';}
        updateFavicon(currentTheme);
      };

      function updateFavicon(theme){
        var favicon=document.getElementById('app-favicon');
        if(!favicon)return;
        var bg=themeBgColors[theme]||themeBgColors['light'];
        var size=180;
        var canvas=document.createElement('canvas');
        canvas.width=size;
        canvas.height=size;
        var ctx=canvas.getContext('2d');
        ctx.fillStyle=bg;
        ctx.fillRect(0,0,size,size);
        if(catImg.complete&&catImg.naturalWidth>0){
          var aspect=catImg.naturalWidth/catImg.naturalHeight;
          var drawW=size;
          var drawH=size/aspect;
          if(drawH>size){drawH=size;drawW=size*aspect;}
          var x=(size-drawW)/2;
          var y=(size-drawH)/2;
          ctx.drawImage(catImg,x,y,drawW,drawH);
        }
        try{
          favicon.href=canvas.toDataURL('image/png');
        }catch{
          // Lienzo bloqueado por el navegador: se mantiene el icono por defecto.
        }
      }

      function systemTheme(){
        return systemThemeQuery&&systemThemeQuery.matches?'dark':'light';
      }

      var customThemeVars=['--bg','--surface','--surface-strong','--ink','--muted','--line','--accent'];

      function clearCustomThemeFromBody(){
        customThemeVars.forEach(function(v){body.style.removeProperty(v);});
      }

      function applyCustomThemeToBody(ct){
        if(!ct)return;
        var map={'bg':'--bg','surface':'--surface','surface-strong':'--surface-strong','ink':'--ink','muted':'--muted','line':'--line','accent':'--accent'};
        Object.keys(map).forEach(function(k){
          if(ct[k]){body.style.setProperty(map[k],ct[k]);}
        });
      }

      function applyTheme(theme){
        body.classList.remove.apply(body.classList,themeClasses);
        if(theme!=='light'){body.classList.add('theme-'+theme);}
        clearCustomThemeFromBody();
        if(theme==='custom'){
          var ct=readJSON('mh-custom-theme',null);
          if(ct){applyCustomThemeToBody(ct);}
        }
        if(chipGrid){
          chipGrid.querySelectorAll('.theme-chip').forEach(function(btn){
            btn.classList.toggle('active',btn.getAttribute('data-theme')===theme);
          });
        }
        var ctSection=document.getElementById('custom-theme-section');
        if(ctSection){ctSection.style.display=theme==='custom'?'block':'none';}
        updateFavicon(theme);
      }

      function applySystemTheme(enabled){
        body.classList.toggle('system-theme-active',enabled);
        if(systemThemeToggle){systemThemeToggle.checked=enabled;}
        if(enabled){applyTheme(systemTheme());}
      }

      function applyGrid(show){
        body.classList.toggle('no-grid',!show);
      }

      function applyCompact(compact){
        body.classList.toggle('compact-ui',compact);
      }

      function applyLargeControls(show){
        body.classList.toggle('large-controls',show);
      }

      function applyWideContent(show){
        body.classList.toggle('wide-content',show);
      }

      function applyDesc(show){
        body.classList.toggle('hide-desc',!show);
      }

      function applyLargeText(show){
        body.classList.toggle('large-text',show);
      }

      function applyHighContrast(show){
        body.classList.toggle('high-contrast',show);
      }

      function applyMotion(reduce){
        body.classList.toggle('reduce-motion',reduce);
      }

      function applyFontSize(size){
        var classes=['text-xs','text-sm','text-md','text-lg','text-xl'];
        body.classList.remove.apply(body.classList,classes);
        if(size&&size!=='md'){body.classList.add('text-'+size);}
      }

      function applyCornerRadius(radius){
        document.documentElement.style.setProperty('--radius',radius+'px');
      }

      function applyGridStyle(style){
        var classes=['grid-style-lines','grid-style-dots','grid-style-checkerboard','grid-style-none'];
        body.classList.remove.apply(body.classList,classes);
        body.classList.add('grid-style-'+style);
      }

      function applyDensity(density){
        var classes=['theme-density-compact','theme-density-normal','theme-density-comfortable'];
        body.classList.remove.apply(body.classList,classes);
        if(density&&density!=='normal'){body.classList.add('theme-density-'+density);}
      }

      function applyTextareaHeight(height){
        document.documentElement.style.setProperty('--textarea-min-height',height+'px');
      }

      function applyStickyOutput(sticky){
        body.classList.toggle('sticky-output',sticky);
      }

      function loadSettings(){
        var theme=localStorage.getItem('theme');
        var prefersDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;
        var useSystem=localStorage.getItem('mh-system-theme')==='1';
        if(systemThemeToggle){systemThemeToggle.checked=useSystem;}
        if(useSystem){applySystemTheme(true);}else{applyTheme(theme||(prefersDark?'dark':'light'));}

        var grid=localStorage.getItem('mh-grid');
        var showGrid=grid===null?true:grid==='1';
        if(gridToggle){gridToggle.checked=showGrid;}
        applyGrid(showGrid);

        var compact=localStorage.getItem('mh-compact');
        var isCompact=compact==='1';
        if(compactToggle){compactToggle.checked=isCompact;}
        applyCompact(isCompact);

        var largeControls=localStorage.getItem('mh-large-controls')==='1';
        if(largeControlsToggle){largeControlsToggle.checked=largeControls;}
        applyLargeControls(largeControls);

        var wideContent=localStorage.getItem('mh-wide-content')==='1';
        if(wideContentToggle){wideContentToggle.checked=wideContent;}
        applyWideContent(wideContent);

        var desc=localStorage.getItem('mh-desc');
        var showDesc=desc===null?true:desc==='1';
        if(descToggle){descToggle.checked=showDesc;}
        applyDesc(showDesc);

        var largeText=localStorage.getItem('mh-large-text')==='1';
        if(largeTextToggle){largeTextToggle.checked=largeText;}
        applyLargeText(largeText);

        var highContrast=localStorage.getItem('mh-high-contrast')==='1';
        if(highContrastToggle){highContrastToggle.checked=highContrast;}
        applyHighContrast(highContrast);

        var reduceMotion=localStorage.getItem('mh-reduce-motion')==='1';
        if(motionToggle){motionToggle.checked=reduceMotion;}
        applyMotion(reduceMotion);

        var rememberTool=localStorage.getItem('mh-remember-tool');
        if(rememberToolToggle){rememberToolToggle.checked=rememberTool===null?true:rememberTool==='1';}

        var quickAccess=localStorage.getItem('mh-quick-access');
        if(quickAccessToggle){quickAccessToggle.checked=quickAccess===null?true:quickAccess==='1';}

        var sidebarFavorites=localStorage.getItem('mh-sidebar-favorites');
        if(sidebarFavoritesToggle){sidebarFavoritesToggle.checked=sidebarFavorites===null?true:sidebarFavorites==='1';}

        var closeMobile=localStorage.getItem('mh-close-mobile');
        if(closeMobileToggle){closeMobileToggle.checked=closeMobile===null?true:closeMobile==='1';}

        var autofocus=localStorage.getItem('mh-autofocus');
        if(autofocusToggle){autofocusToggle.checked=autofocus===null?true:autofocus==='1';}

        var fontSize=localStorage.getItem('mh-font-size')||'md';
        applyFontSize(fontSize);
        var fsGrid=document.getElementById('setting-font-size-grid');
        if(fsGrid){fsGrid.querySelectorAll('.base-btn').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-font-size')===fontSize);});}

        var radius=parseInt(localStorage.getItem('mh-corner-radius'))||8;
        applyCornerRadius(radius);
        var radiusInput=document.getElementById('setting-corner-radius');
        var radiusVal=document.getElementById('setting-corner-radius-val');
        if(radiusInput){radiusInput.value=radius;}
        if(radiusVal){radiusVal.textContent=radius+'px';}

        var gridStyle=localStorage.getItem('mh-grid-style')||'lines';
        applyGridStyle(gridStyle);
        var gsGrid=document.getElementById('setting-grid-style-grid');
        if(gsGrid){gsGrid.querySelectorAll('.base-btn').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-grid-style')===gridStyle);});}

        var density=localStorage.getItem('mh-density')||'normal';
        applyDensity(density);
        var densityGrid=document.getElementById('setting-density-grid');
        if(densityGrid){densityGrid.querySelectorAll('.base-btn').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-density')===density);});}

        var recentCount=parseInt(localStorage.getItem('mh-recent-count'))||5;
        var rcInput=document.getElementById('setting-recent-count');
        var rcVal=document.getElementById('setting-recent-count-val');
        if(rcInput){rcInput.value=recentCount;}
        if(rcVal){rcVal.textContent=recentCount;}

        var confirmDelete=localStorage.getItem('mh-confirm-delete');
        var confirmToggle=document.getElementById('setting-confirm-delete');
        if(confirmToggle){confirmToggle.checked=confirmDelete===null?true:confirmDelete==='1';}

        var textareaHeight=parseInt(localStorage.getItem('mh-textarea-height'))||112;
        applyTextareaHeight(textareaHeight);
        var thInput=document.getElementById('setting-textarea-height');
        var thVal=document.getElementById('setting-textarea-height-val');
        if(thInput){thInput.value=textareaHeight;}
        if(thVal){thVal.textContent=textareaHeight+'px';}

        var stickyOutput=localStorage.getItem('mh-sticky-output')==='1';
        applyStickyOutput(stickyOutput);
        var soToggle=document.getElementById('setting-sticky-output');
        if(soToggle){soToggle.checked=stickyOutput;}

        var autoTheme=localStorage.getItem('mh-auto-theme')==='1';
        var atToggle=document.getElementById('setting-auto-theme');
        if(atToggle){atToggle.checked=autoTheme;}
        var atControls=document.getElementById('auto-theme-controls');
        if(atControls){atControls.style.display=autoTheme?'block':'none';}
        if(autoTheme){scheduleAutoTheme();}
      }

      function openSettings(){
        if(overlay&&panel){
          overlay.classList.add('show');
          panel.classList.add('show');
          if(window.lucide&&typeof window.lucide.createIcons==='function'){window.lucide.createIcons();}
        }
      }

      function closeSettings(){
        if(overlay&&panel){
          overlay.classList.remove('show');
          panel.classList.remove('show');
        }
      }

      loadSettings();

      openBtns.forEach(function(openBtn){openBtn.addEventListener('click',openSettings);});
      if(closeBtn){closeBtn.addEventListener('click',closeSettings);}
      if(overlay){overlay.addEventListener('click',closeSettings);}

      if(chipGrid){
        chipGrid.querySelectorAll('.theme-chip').forEach(function(btn){
          btn.addEventListener('click',function(){
            var theme=this.getAttribute('data-theme');
            localStorage.setItem('mh-system-theme','0');
            applySystemTheme(false);
            applyTheme(theme);
            localStorage.setItem('theme',theme);
          });
        });
      }

      if(systemThemeToggle){
        systemThemeToggle.addEventListener('change',function(){
          applySystemTheme(this.checked);
          localStorage.setItem('mh-system-theme',this.checked?'1':'0');
          if(!this.checked){
            applyTheme(localStorage.getItem('theme')||'light');
          }
        });
      }

      if(systemThemeQuery){
        var onSystemThemeChange=function(){
          if(localStorage.getItem('mh-system-theme')==='1'){applySystemTheme(true);}
        };
        if(systemThemeQuery.addEventListener){systemThemeQuery.addEventListener('change',onSystemThemeChange);}
        else if(systemThemeQuery.addListener){systemThemeQuery.addListener(onSystemThemeChange);}
      }

      if(gridToggle){
        gridToggle.addEventListener('change',function(){
          applyGrid(this.checked);
          localStorage.setItem('mh-grid',this.checked?'1':'0');
        });
      }

      if(compactToggle){
        compactToggle.addEventListener('change',function(){
          applyCompact(this.checked);
          localStorage.setItem('mh-compact',this.checked?'1':'0');
        });
      }

      if(largeControlsToggle){
        largeControlsToggle.addEventListener('change',function(){
          applyLargeControls(this.checked);
          localStorage.setItem('mh-large-controls',this.checked?'1':'0');
        });
      }

      if(wideContentToggle){
        wideContentToggle.addEventListener('change',function(){
          applyWideContent(this.checked);
          localStorage.setItem('mh-wide-content',this.checked?'1':'0');
        });
      }

      if(descToggle){
        descToggle.addEventListener('change',function(){
          applyDesc(this.checked);
          localStorage.setItem('mh-desc',this.checked?'1':'0');
        });
      }

      if(largeTextToggle){
        largeTextToggle.addEventListener('change',function(){
          applyLargeText(this.checked);
          localStorage.setItem('mh-large-text',this.checked?'1':'0');
        });
      }

      if(highContrastToggle){
        highContrastToggle.addEventListener('change',function(){
          applyHighContrast(this.checked);
          localStorage.setItem('mh-high-contrast',this.checked?'1':'0');
        });
      }

      if(motionToggle){
        motionToggle.addEventListener('change',function(){
          applyMotion(this.checked);
          localStorage.setItem('mh-reduce-motion',this.checked?'1':'0');
        });
      }

      if(rememberToolToggle){
        rememberToolToggle.addEventListener('change',function(){
          localStorage.setItem('mh-remember-tool',this.checked?'1':'0');
          if(!this.checked){localStorage.removeItem('mh-active-tool');}
        });
      }

      if(quickAccessToggle){
        quickAccessToggle.addEventListener('change',function(){
          localStorage.setItem('mh-quick-access',this.checked?'1':'0');
          renderQuickAccess();
        });
      }

      if(sidebarFavoritesToggle){
        sidebarFavoritesToggle.addEventListener('change',function(){
          localStorage.setItem('mh-sidebar-favorites',this.checked?'1':'0');
          renderSidebarFavorites();
        });
      }

      if(closeMobileToggle){
        closeMobileToggle.addEventListener('change',function(){
          localStorage.setItem('mh-close-mobile',this.checked?'1':'0');
        });
      }

      if(autofocusToggle){
        autofocusToggle.addEventListener('change',function(){
          localStorage.setItem('mh-autofocus',this.checked?'1':'0');
        });
      }

      var fsGrid=document.getElementById('setting-font-size-grid');
      if(fsGrid){
        fsGrid.querySelectorAll('.base-btn').forEach(function(btn){
          btn.addEventListener('click',function(){
            var size=this.getAttribute('data-font-size');
            fsGrid.querySelectorAll('.base-btn').forEach(function(b){b.classList.remove('active');});
            this.classList.add('active');
            applyFontSize(size);
            localStorage.setItem('mh-font-size',size);
          });
        });
      }

      var radiusInput=document.getElementById('setting-corner-radius');
      var radiusVal=document.getElementById('setting-corner-radius-val');
      if(radiusInput){
        radiusInput.addEventListener('input',function(){
          var v=parseInt(this.value);
          applyCornerRadius(v);
          if(radiusVal){radiusVal.textContent=v+'px';}
          localStorage.setItem('mh-corner-radius',v);
        });
      }

      var gsGrid=document.getElementById('setting-grid-style-grid');
      if(gsGrid){
        gsGrid.querySelectorAll('.base-btn').forEach(function(btn){
          btn.addEventListener('click',function(){
            var style=this.getAttribute('data-grid-style');
            gsGrid.querySelectorAll('.base-btn').forEach(function(b){b.classList.remove('active');});
            this.classList.add('active');
            applyGridStyle(style);
            localStorage.setItem('mh-grid-style',style);
          });
        });
      }

      var densityGrid=document.getElementById('setting-density-grid');
      if(densityGrid){
        densityGrid.querySelectorAll('.base-btn').forEach(function(btn){
          btn.addEventListener('click',function(){
            var density=this.getAttribute('data-density');
            densityGrid.querySelectorAll('.base-btn').forEach(function(b){b.classList.remove('active');});
            this.classList.add('active');
            applyDensity(density);
            localStorage.setItem('mh-density',density);
          });
        });
      }

      var rcInput=document.getElementById('setting-recent-count');
      var rcVal=document.getElementById('setting-recent-count-val');
      if(rcInput){
        rcInput.addEventListener('input',function(){
          var v=parseInt(this.value);
          if(rcVal){rcVal.textContent=v;}
          localStorage.setItem('mh-recent-count',v);
        });
      }

      var confirmToggle=document.getElementById('setting-confirm-delete');
      if(confirmToggle){
        confirmToggle.addEventListener('change',function(){
          localStorage.setItem('mh-confirm-delete',this.checked?'1':'0');
        });
      }

      var atToggle=document.getElementById('setting-auto-theme');
      var atControls=document.getElementById('auto-theme-controls');
      if(atToggle){
        atToggle.addEventListener('change',function(){
          localStorage.setItem('mh-auto-theme',this.checked?'1':'0');
          if(atControls){atControls.style.display=this.checked?'block':'none';}
          if(this.checked){scheduleAutoTheme();}else{clearAutoTheme();}
        });
      }
      ['setting-day-theme','setting-night-theme','setting-sunset','setting-sunrise'].forEach(function(id){
        var el=document.getElementById(id);
        if(el){el.addEventListener('change',function(){if(atToggle&&atToggle.checked){scheduleAutoTheme();}});}
      });

      var thInput=document.getElementById('setting-textarea-height');
      var thVal=document.getElementById('setting-textarea-height-val');
      if(thInput){
        thInput.addEventListener('input',function(){
          var v=parseInt(this.value);
          applyTextareaHeight(v);
          if(thVal){thVal.textContent=v+'px';}
          localStorage.setItem('mh-textarea-height',v);
        });
      }

      var soToggle=document.getElementById('setting-sticky-output');
      if(soToggle){
        soToggle.addEventListener('change',function(){
          applyStickyOutput(this.checked);
          localStorage.setItem('mh-sticky-output',this.checked?'1':'0');
        });
      }

      var customThemeSection=document.getElementById('custom-theme-section');
      var chipGridEl=document.getElementById('theme-chip-grid');
      if(chipGridEl){
        chipGridEl.addEventListener('click',function(e){
          var chip=e.target.closest('.theme-chip');
          if(!chip)return;
          var theme=chip.getAttribute('data-theme');
          if(customThemeSection){
            customThemeSection.style.display=theme==='custom'?'block':'none';
          }
          if(theme==='custom'){
            var ct=readJSON('mh-custom-theme',null);
            if(ct){
              var keys=['bg','surface','surface-strong','ink','muted','line','accent'];
              keys.forEach(function(k){
                var el=document.getElementById('ct-'+k);
                if(el&&ct[k]){el.value=ct[k];}
              });
            }
          }
        });
      }
      var ctSave=document.getElementById('ct-save');
      if(ctSave){
        ctSave.addEventListener('click',function(){
          var ct={};
          var keys=['bg','surface','surface-strong','ink','muted','line','accent'];
          keys.forEach(function(k){
            var el=document.getElementById('ct-'+k);
            if(el){ct[k]=el.value;}
          });
          saveJSON('mh-custom-theme',ct);
          applyCustomThemeToBody(ct);
          showToast('Tema personalizado guardado');
        });
      }
      var ctReset=document.getElementById('ct-reset');
      if(ctReset){
        ctReset.addEventListener('click',function(){
          var defaults={bg:'#faf9f5',surface:'#fffdf8','surface-strong':'#ffffff',ink:'#27211b',muted:'#766d62',line:'#dfd7cb',accent:'#b18100'};
          var keys=['bg','surface','surface-strong','ink','muted','line','accent'];
          keys.forEach(function(k){
            var el=document.getElementById('ct-'+k);
            if(el){el.value=defaults[k];}
          });
          saveJSON('mh-custom-theme',defaults);
          applyCustomThemeToBody(defaults);
          showToast('Tema personalizado restaurado');
        });
      }

      var exportBtn=document.getElementById('setting-export');
      if(exportBtn){
        exportBtn.addEventListener('click',function(){
          var keys=[];
          for(var i=0;i<localStorage.length;i++){keys.push(localStorage.key(i));}
          var data={};
          keys.forEach(function(k){data[k]=localStorage.getItem(k);});
          var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
          var a=document.createElement('a');
          a.href=URL.createObjectURL(blob);
          a.download='miyu-config.json';
          a.click();
          URL.revokeObjectURL(a.href);
          showToast('Configuración exportada');
        });
      }

      var importBtn=document.getElementById('setting-import');
      var importFile=document.getElementById('setting-import-file');
      if(importBtn&&importFile){
        importBtn.addEventListener('click',function(){importFile.click();});
        importFile.addEventListener('change',function(){
          if(!this.files||!this.files[0])return;
          var reader=new FileReader();
          reader.onload=function(e){
            try{
              var data=JSON.parse(e.target.result);
              Object.keys(data).forEach(function(k){localStorage.setItem(k,data[k]);});
              showToast('Configuración importada');
              location.reload();
            }catch{
              showToast('Error al importar');
            }
          };
          reader.readAsText(importFile.files[0]);
        });
      }

      if(clearBtn){
        clearBtn.addEventListener('click',function(){
          var doConfirm=localStorage.getItem('mh-confirm-delete')!=='0';
          if(!doConfirm||confirm('¿Seguro que quieres eliminar todas las configuraciones y datos guardados?')){
            localStorage.clear();
            location.reload();
          }
        });
      }

      function scheduleAutoTheme(){
        clearAutoTheme();
        var dayTheme=localStorage.getItem('mh-day-theme')||'light';
        var nightTheme=localStorage.getItem('mh-night-theme')||'dark';
        var sunset=localStorage.getItem('mh-sunset')||'20:00';
        var sunrise=localStorage.getItem('mh-sunrise')||'07:00';
        var check=function(){
          var now=new Date();
          var hours=now.getHours();
          var mins=now.getMinutes();
          var nowStr=String(hours).padStart(2,'0')+':'+String(mins).padStart(2,'0');
          if(localStorage.getItem('mh-system-theme')==='1')return;
          if(nowStr>=sunset||nowStr<sunrise){
            applyTheme(nightTheme);
            localStorage.setItem('theme',nightTheme);
          }else{
            applyTheme(dayTheme);
            localStorage.setItem('theme',dayTheme);
          }
        };
        check();
        autoThemeInterval=setInterval(check,60000);
      }

      function clearAutoTheme(){
        if(autoThemeInterval){clearInterval(autoThemeInterval);autoThemeInterval=null;}
      }


    })();
