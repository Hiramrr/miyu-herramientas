import { toolSections } from '../tools/registry.js';

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
          haystack: [tool.name, tool.description, section.title, tool.id].join(' ').toLowerCase()
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
      } catch (e) {
        return fallback;
      }
    }

    function saveJSON(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
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

      searchInput.addEventListener('input', function() {
        var q = this.value.trim().toLowerCase();
        var list = document.querySelector('.tool-list');
        var empty = document.getElementById('tool-empty');
        var totalVisible = 0;
        if (q) { list.classList.add('searching'); } else { list.classList.remove('searching'); }
        document.querySelectorAll('.tool-item').forEach(function(item) {
          var name = item.querySelector('.tool-name').textContent.toLowerCase();
          var desc = item.querySelector('.tool-desc').textContent.toLowerCase();
          var section = item.closest('.tool-section');
          var sectionTitle = section ? section.querySelector('.tool-section-title').textContent.toLowerCase() : '';
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
      });
    }
    function setupToolNavigation() {
      document.querySelectorAll('.tool-item').forEach(function(item) {
        item.addEventListener('click', function() {
          showTool(item.getAttribute('data-tool'));
        });
        item.addEventListener('keydown', function(event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            showTool(item.getAttribute('data-tool'));
          }
        });
      });
    }
    function showTool(t) {
      if (!t) {
        document.querySelectorAll('.tool-item').forEach(function(i) { i.classList.remove('active'); });
        document.querySelectorAll('.tool-panel').forEach(function(p) { p.classList.remove('active'); });
        var titleElEmpty = document.getElementById('app-header-title');
        if (titleElEmpty) titleElEmpty.textContent = 'Herramientas';
        localStorage.removeItem('mh-active-tool');
        updateFavoriteButtons();
        document.title = 'miyu-herramientas';
        return;
      }
      var item = t ? document.querySelector('.tool-item[data-tool="' + t + '"]') : null;
      var panel = t ? document.getElementById('panel-' + t) : null;
      if (!item || !panel) return;
      document.querySelectorAll('.tool-item').forEach(function(i) { i.classList.remove('active'); });
      document.querySelectorAll('.tool-panel').forEach(function(p) { p.classList.remove('active'); });
      item.classList.add('active');
      panel.classList.add('active');
      var titleEl = document.getElementById('app-header-title');
      if (titleEl && item) {
        titleEl.textContent = item.querySelector('.tool-name').textContent;
      }
      localStorage.setItem('mh-active-tool', t);
      rememberRecentTool(t);
      updateFavoriteButtons();
      document.title = item.querySelector('.tool-name').textContent + ' - miyu-herramientas';
      if (window.matchMedia('(max-width: 768px)').matches) panel.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
    window.showTool = showTool;

    function rememberRecentTool(id) {
      recentTools = [id].concat(recentTools.filter(function(toolId) { return toolId !== id; })).slice(0, 5);
      saveJSON('mh-recent-tools', recentTools);
      renderCommandList('');
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

    function toggleFavorite(id) {
      if (favoriteTools.has(id)) {
        favoriteTools.delete(id);
        showToast('Quitada de favoritas');
      } else {
        favoriteTools.add(id);
        showToast('Guardada como favorita');
      }
      saveJSON('mh-favorites', Array.from(favoriteTools));
      updateFavoriteButtons();
      renderCommandList('');
      if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
    }

    function setupExperienceEnhancements() {
      setupFavorites();
      setupCommandPalette();
      setupCopyFeedback();
      setupCopyButtonFeedback();
      setupFilePickers();
      restoreLastTool();
      setupGlobalShortcuts();
      updateFavoriteButtons();
    }

    function setupFavorites() {
      document.querySelectorAll('.tool-favorite').forEach(function(button) {
        button.addEventListener('click', function(event) {
          event.stopPropagation();
          toggleFavorite(button.getAttribute('data-favorite'));
        });
      });
    }

    function restoreLastTool() {
      var last = localStorage.getItem('mh-active-tool');
      if (last && document.getElementById('panel-' + last)) showTool(last);
    }

    function setupGlobalShortcuts() {
      document.addEventListener('keydown', function(event) {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          openCommandPalette();
          return;
        }
        if (event.key === '/' && !isTypingTarget(event.target)) {
          event.preventDefault();
          var search = document.getElementById('sidebar-search');
          if (search) search.focus();
        }
        if (event.key === 'Escape') {
          closeCommandPalette();
          var settingsPanel = document.getElementById('settings-panel');
          if (settingsPanel && settingsPanel.classList.contains('show')) {
            document.getElementById('settings-overlay').classList.remove('show');
            settingsPanel.classList.remove('show');
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
      var q = (query || '').trim().toLowerCase();
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

    var sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', function() {
        document.body.classList.toggle('sidebar-collapsed');
      });
    }

    var qrDataURL='';function generateQR(){var t=document.getElementById('qr-text').value;var s=parseInt(document.getElementById('qr-size').value);if(!t)return;var c=document.createElement('canvas');QRCode.toCanvas(c,t,{width:s}).then(function(){qrDataURL=c.toDataURL();document.getElementById('qr-output').innerHTML='<img src="'+qrDataURL+'" alt="QR">';});}function downloadQR(){if(qrDataURL){var a=document.createElement('a');a.href=qrDataURL;a.download='qrcode.png';a.click();}}

    function generatePassword(){var l=parseInt(document.getElementById('pwd-len').value);var c='abcdefghijklmnopqrstuvwxyz';if(document.getElementById('pwd-upper').checked)c+='ABCDEFGHIJKLMNOPQRSTUVWXYZ';if(document.getElementById('pwd-numbers').checked)c+='0123456789';if(document.getElementById('pwd-symbols').checked)c+='!@#$%^&*()_+-=[]{}|;:,.<>?';var p='';for(var i=0;i<l;i++)p+=c[Math.floor(Math.random()*c.length)];document.getElementById('pwd-output').textContent=p;}function copyPassword(){var p=document.getElementById('pwd-output').textContent;if(p)navigator.clipboard.writeText(p);}

    function checkStrength(){var p=document.getElementById('passcheck-input').value;var s=0;if(p.length>4)s++;if(p.length>8)s++;if(p.length>12)s++;if(p.match(/[A-Z]/))s++;if(p.match(/[a-z]/))s++;if(p.match(/[0-9]/))s++;if(p.match(/[^a-zA-Z0-9]/))s++;var bar=document.getElementById('str-bar');var out=document.getElementById('passcheck-output');var labels=['Muy débil','Débil','Aceptable','Fuerte','Muy fuerte'];var colors=['#e8a0a0','#d8b888','#b8c888','#88c8a0','#80b8d4'];var idx=Math.min(s,4);bar.style.width=(s/7*100)+'%';bar.style.background=colors[idx];if(p.length<4){out.textContent='Muy corta';bar.style.width='10%';bar.style.background='#e0d8d0';}else{out.textContent=labels[idx];}}

    function textTransform(t){var i=document.getElementById('text-input').value;var o='';switch(t){case'upper':o=i.toUpperCase();break;case'lower':o=i.toLowerCase();break;case'title':o=i.replace(/\w\S*/g,function(t){return t.charAt(0).toUpperCase()+t.substr(1).toLowerCase();});break;case'trim':o=i.replace(/\s+/g,' ').trim();break;case'base64enc':o=btoa(unescape(encodeURIComponent(i)));break;case'base64dec':o=decodeURIComponent(escape(atob(i)));break;case'urlenc':o=encodeURIComponent(i);break;case'urldec':o=decodeURIComponent(i);break;case'reverse':o=i.split('').reverse().join('');break;}document.getElementById('text-output').value=o;updateTextStats(i);}function updateTextStats(t){var w=t.trim()?t.trim().split(/\s+/).length:0;document.getElementById('text-stats').textContent='Caracteres: '+t.length+' | Palabras: '+w+' | Líneas: '+t.split('\n').length;}document.getElementById('text-input').addEventListener('input',function(){updateTextStats(this.value);});

    function findReplace(){var t=document.getElementById('fr-input').value;var f=document.getElementById('fr-find').value;var r=document.getElementById('fr-replace').value;if(!f)return;var cs=document.getElementById('fr-casesens').checked;var flags='g';if(!cs)flags+='i';var re=new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),flags);document.getElementById('fr-output').value=t.replace(re,r);}function copyFR(){var t=document.getElementById('fr-output').value;if(t)navigator.clipboard.writeText(t);}

    function formatJSON(){try{var o=JSON.parse(document.getElementById('json-input').value);document.getElementById('json-output').value=JSON.stringify(o,null,2);}catch(e){document.getElementById('json-output').value='Error: '+e.message;}}function minifyJSON(){try{var o=JSON.parse(document.getElementById('json-input').value);document.getElementById('json-output').value=JSON.stringify(o);}catch(e){document.getElementById('json-output').value='Error: '+e.message;}}function copyJSON(){var j=document.getElementById('json-output').value;if(j)navigator.clipboard.writeText(j);}

    var currentBase=10;function setBase(b){currentBase=b;document.querySelectorAll('.base-btn').forEach(function(btn){btn.classList.remove('active');});document.querySelector('.base-btn[data-base="'+b+'"]').classList.add('active');convertBase();}function convertBase(){var v=document.getElementById('base-input').value;if(!v){document.getElementById('base-output').innerHTML='';return;}var dec;try{dec=parseInt(v,currentBase);if(isNaN(dec)){document.getElementById('base-output').textContent='Valor inválido';return;}}catch(e){document.getElementById('base-output').textContent='Valor inválido';return;}document.getElementById('base-output').innerHTML='<div style="display:grid;grid-template-columns:auto 1fr;gap:8px 16px">'+
      '<span style="color:var(--output-code)">Decimal:</span><span><strong>'+dec+'</strong></span>'+
      '<span style="color:var(--output-code)">Binario:</span><span>'+dec.toString(2)+'</span>'+
      '<span style="color:var(--output-code)">Octal:</span><span>'+dec.toString(8)+'</span>'+
      '<span style="color:var(--output-code)">Hexadecimal:</span><span>'+dec.toString(16).toUpperCase()+'</span></div>';}

    var currentHarmonyPalette=[];
    function convertColor(){var h=document.getElementById('color-picker').value;var r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);var hsl=rgbToHsl(r,g,b);document.getElementById('color-output').innerHTML='<strong>HEX:</strong> '+h+'<br><strong>RGB:</strong> rgb('+r+', '+g+', '+b+')<br><strong>HSL:</strong> hsl('+hsl[0]+', '+hsl[1]+'%, '+hsl[2]+'%)<br><span style="display:inline-block;width:32px;height:32px;background:'+h+';border-radius:8px;vertical-align:middle;border:1px solid var(--line);margin-left:6px"></span>';}
    function rgbToHsl(r,g,b){r/=255;g/=255;b/=255;var max=Math.max(r,g,b),min=Math.min(r,g,b);var h,s,l=(max+min)/2;if(max===min){h=s=0;}else{var d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=((g-b)/d+(g<b?6:0))/6;break;case g:h=((b-r)/d+2)/6;break;case b:h=((r-g)/d+4)/6;break;}}return[Math.round(h*360),Math.round(s*100),Math.round(l*100)];}
    function normHue(h){return((Math.round(h)%360)+360)%360;}
    function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
    function hslToHex(h,s,l){var rgb=hslToRgb(normHue(h),clamp(s,0,100),clamp(l,0,100));return rgbToHexStr(rgb.r,rgb.g,rgb.b);}
    function colorFormat(hex,format){var rgb=hexToRgbObj(hex);var hsl=rgbToHsl(rgb.r,rgb.g,rgb.b);if(format==='rgb')return'rgb('+rgb.r+', '+rgb.g+', '+rgb.b+')';if(format==='hsl')return'hsl('+hsl[0]+', '+hsl[1]+'%, '+hsl[2]+'%)';return hex.toUpperCase();}
    function harmonyStops(type,h,s,l){var soften=function(v){return clamp(v,24,78);};switch(type){case'analogous':return[{n:'Base',h:h,s:s,l:l},{n:'-30°',h:h-30,s:s,l:l},{n:'+30°',h:h+30,s:s,l:l}];case'triadic':return[{n:'Base',h:h,s:s,l:l},{n:'+120°',h:h+120,s:s,l:l},{n:'+240°',h:h+240,s:s,l:l}];case'split':return[{n:'Base',h:h,s:s,l:l},{n:'+150°',h:h+150,s:s,l:l},{n:'+210°',h:h+210,s:s,l:l}];case'square':return[{n:'Base',h:h,s:s,l:l},{n:'+90°',h:h+90,s:s,l:l},{n:'+180°',h:h+180,s:s,l:l},{n:'+270°',h:h+270,s:s,l:l}];case'monochromatic':return[{n:'Claro',h:h,s:s,l:clamp(l+28,0,94)},{n:'Base',h:h,s:s,l:l},{n:'Medio',h:h,s:s,l:soften(l)},{n:'Oscuro',h:h,s:s,l:clamp(l-28,8,100)}];case'double':return[{n:'Base',h:h,s:s,l:l},{n:'+30°',h:h+30,s:s,l:l},{n:'+180°',h:h+180,s:s,l:l},{n:'+210°',h:h+210,s:s,l:l}];case'compound':return[{n:'Base',h:h,s:s,l:l},{n:'Análogo -30°',h:h-30,s:s,l:l},{n:'Complemento',h:h+180,s:s,l:l},{n:'Comp. +30°',h:h+210,s:s,l:l}];case'pentadic':return[{n:'Base',h:h,s:s,l:l},{n:'+72°',h:h+72,s:s,l:l},{n:'+144°',h:h+144,s:s,l:l},{n:'+216°',h:h+216,s:s,l:l},{n:'+288°',h:h+288,s:s,l:l}];case'accent':return[{n:'Análogo -24°',h:h-24,s:s,l:l},{n:'Base',h:h,s:s,l:l},{n:'Análogo +24°',h:h+24,s:s,l:l},{n:'Acento',h:h+180,s:s,l:l}];case'golden':return[{n:'Base',h:h,s:s,l:l},{n:'+137.5°',h:h+137.5,s:s,l:l},{n:'+275°',h:h+275,s:s,l:l},{n:'+52.5°',h:h+412.5,s:s,l:l}];case'near':return[{n:'Base',h:h,s:s,l:l},{n:'+165°',h:h+165,s:s,l:l},{n:'+195°',h:h+195,s:s,l:l}];default:return[{n:'Base',h:h,s:s,l:l},{n:'Complemento',h:h+180,s:s,l:l}];}}
    function generateHarmony(){var base=document.getElementById('harmony-color');var output=document.getElementById('harmony-output');if(!base||!output)return;var h=base.value;var rgb=hexToRgbObj(h);var hsl=rgbToHsl(rgb.r,rgb.g,rgb.b);var type=document.getElementById('harmony-type').value;var format=document.getElementById('harmony-format').value;var stops=harmonyStops(type,hsl[0],hsl[1],hsl[2]);currentHarmonyPalette=stops.map(function(stop){var hex=hslToHex(stop.h,stop.s,stop.l);return{name:stop.n,hex:hex,value:colorFormat(hex,format)};});output.innerHTML=currentHarmonyPalette.map(function(c,i){return'<div class="harmony-swatch"><div class="harmony-chip" style="background:'+c.hex+'"></div><div class="harmony-meta"><strong>'+c.name+'</strong><span>'+c.value+'</span><button type="button" onclick="copyHarmonyColor('+i+')">Copiar</button></div></div>';}).join('');}
    function copyHarmonyColor(i){if(currentHarmonyPalette[i])navigator.clipboard.writeText(currentHarmonyPalette[i].value);}
    function copyHarmonyPalette(){if(currentHarmonyPalette.length)navigator.clipboard.writeText(currentHarmonyPalette.map(function(c){return c.value;}).join('\n'));}
    function copyHarmonyCSS(){if(!currentHarmonyPalette.length)return;var sanitize=function(n){return n.toLowerCase().replace(/[áàäâã]/g,'a').replace(/[éèëê]/g,'e').replace(/[íìïî]/g,'i').replace(/[óòöôõ]/g,'o').replace(/[úùüû]/g,'u').replace(/ñ/g,'n').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');};var css=':root {\n'+currentHarmonyPalette.map(function(c){return'  --color-'+sanitize(c.name)+': '+c.hex+';';}).join('\n')+'\n}';navigator.clipboard.writeText(css);}
    function randomHarmonyColor(){var hex='#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');document.getElementById('harmony-color').value=hex;generateHarmony();}
    convertColor();generateHarmony();

    function updateShadow(){var x=document.getElementById('sx').value;var y=document.getElementById('sy').value;var bl=document.getElementById('sblur').value;var sp=document.getElementById('sspread').value;var c=document.getElementById('scolor').value;document.getElementById('sx-val').textContent=x;document.getElementById('sy-val').textContent=y;document.getElementById('sblur-val').textContent=bl;document.getElementById('sspread-val').textContent=sp;var css=x+'px '+y+'px '+bl+'px '+sp+'px '+c;document.getElementById('shadow-box').style.boxShadow=css;document.getElementById('shadow-css').textContent='box-shadow: '+css+';';}function copyShadow(){var css=document.getElementById('shadow-css').textContent;if(css)navigator.clipboard.writeText(css);}updateShadow();

    var imgBase64='';function imageToBase64(){var f=document.getElementById('img-file').files[0];if(!f)return;var r=new FileReader();r.onload=function(e){imgBase64=e.target.result;document.getElementById('img-output').innerHTML='<img src="'+imgBase64+'" style="max-width:200px;margin-bottom:10px;border-radius:8px"><br><code style="font-size:0.75rem;word-break:break-all">'+imgBase64.slice(0,80)+'...</code>';};r.readAsDataURL(f);}function copyImgBase64(){if(imgBase64)navigator.clipboard.writeText(imgBase64);}

    function renderHTMLPreview(){var h=document.getElementById('htmlpreview-input').value;document.getElementById('htmlpreview-output').innerHTML=h;}

    document.getElementById('ff-preset').addEventListener('change',function(){var e=document.getElementById('ff-extra'),l=document.getElementById('ff-extra-label'),v=document.getElementById('ff-extra-value');e.style.display='none';if(this.value==='gif'){e.style.display='block';l.textContent='FPS (default: 10)';v.placeholder='10';}else if(this.value==='thumbnail'){e.style.display='block';l.textContent='Segundo (default: 1)';v.placeholder='1';}else if(this.value==='trim'){e.style.display='block';l.textContent='Inicio y duración';v.placeholder='00:00:10 00:00:30';}else if(this.value==='resize'){e.style.display='block';l.textContent='Resolución (ej: 1280:720)';v.placeholder='1280:720';}});function generateFFmpeg(){var i=document.getElementById('ff-input').value||'input.mp4';var o=document.getElementById('ff-output').value||'output';var p=document.getElementById('ff-preset').value;var e=document.getElementById('ff-extra-value').value;var c='ffmpeg';switch(p){case'mp3':c+=' -i "'+i+'" -vn -acodec libmp3lame -q:a 2 "'+o.replace(/\.\w+$/,'.mp3')+'"';break;case'gif':c+=' -i "'+i+'" -vf "fps='+(e||10)+',scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 "'+o.replace(/\.\w+$/,'.gif')+'"';break;case'webm':c+=' -i "'+i+'" -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus "'+o.replace(/\.\w+$/,'.webm')+'"';break;case'compress':c+=' -i "'+i+'" -vcodec libx265 -crf 28 -preset fast -acodec aac -b:a 128k "'+o+'"';break;case'thumbnail':c+=' -i "'+i+'" -ss '+(e||1)+' -vframes 1 -q:v 2 "'+o.replace(/\.\w+$/,'.jpg')+'"';break;case'trim':var t=(e||'00:00:10 00:00:30').split(' ');c+=' -i "'+i+'" -ss '+t[0]+' -to '+t[1]+' -c copy "'+o+'"';break;case'resize':c+=' -i "'+i+'" -vf "scale='+(e||'1280:720')+'" -c:a copy "'+o+'"';break;case'audio-compress':c+=' -i "'+i+'" -b:a 128k -ar 44100 "'+o.replace(/\.\w+$/,'.mp3')+'"';break;case'custom':c+=' -i "'+i+'" [tus argumentos] "'+o+'"';break;}document.getElementById('ff-result').textContent=c;}function copyFFmpeg(){var c=document.getElementById('ff-result').textContent;if(c)navigator.clipboard.writeText(c);}

    async function generateHash(){var t=document.getElementById('hash-input').value;if(!t)return;var e=new TextEncoder();var d=e.encode(t);var s1=await crypto.subtle.digest('SHA-1',d);var s2=await crypto.subtle.digest('SHA-256',d);var s5=await crypto.subtle.digest('SHA-512',d);var h=function(b){return Array.from(new Uint8Array(b)).map(function(b){return b.toString(16).padStart(2,'0');}).join('');};document.getElementById('hash-output').innerHTML='<strong>SHA-1:</strong> '+h(s1)+'<br><br><strong>SHA-256:</strong> '+h(s2)+'<br><br><strong>SHA-512:</strong> '+h(s5);}

    function convertUnit(){var v=parseFloat(document.getElementById('unit-value').value);var f=document.getElementById('unit-from').value;var t=document.getElementById('unit-to').value;if(isNaN(v))return;var r;var c={px:1,rem:16,em:16,pt:1.333};var p={px:1,rem:1/16,em:1/16,pt:1/1.333};if(c[f]&&c[t]){r=v*c[f]*p[t];}else if(['kb','mb','gb'].includes(f)&&['kb','mb','gb'].includes(t)){var b={kb:1024,mb:1048576,gb:1073741824};r=v*b[f]/b[t];}else if(f==='celsius'&&t==='fahrenheit'){r=v*9/5+32;}else if(f==='fahrenheit'&&t==='celsius'){r=(v-32)*5/9;}else{r='Conversión no soportada';}document.getElementById('unit-output').textContent=typeof r==='number'?v+' '+f+' = '+r.toFixed(4)+' '+t:r;}

    function generateRandom(){var mn=parseInt(document.getElementById('rand-min').value)||0;var mx=parseInt(document.getElementById('rand-max').value)||1;var ct=parseInt(document.getElementById('rand-count').value)||1;if(mn>mx){var tmp=mn;mn=mx;mx=tmp;}var nums=[];for(var i=0;i<ct;i++){nums.push(Math.floor(Math.random()*(mx-mn+1))+mn);}document.getElementById('rand-output').textContent=nums.join(', ');}function copyRandom(){var t=document.getElementById('rand-output').textContent;if(t)navigator.clipboard.writeText(t);}

    var lw=['lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do','eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua','enim','ad','minim','veniam','quis','nostrud','exercitation','ullamco','laboris','nisi','aliquip','ex','ea','commodo','consequat','duis','aute','irure','in','reprehenderit','voluptate','velit','esse','cillum','fugiat','nulla','pariatur','excepteur','sint','occaecat','cupidatat','non','proident','sunt','culpa','qui','officia','deserunt','mollit','anim','id','est','laborum'];function generateLorem(){var c=parseInt(document.getElementById('lorem-count').value)||3;var p=[];for(var i=0;i<c;i++){var w=[];var l=40+Math.floor(Math.random()*30);for(var j=0;j<l;j++){w.push(lw[Math.floor(Math.random()*lw.length)]);}w[0]=w[0].charAt(0).toUpperCase()+w[0].slice(1);p.push(w.join(' ')+'.');}document.getElementById('lorem-output').textContent=p.join('\n\n');}function copyLorem(){var t=document.getElementById('lorem-output').textContent;if(t)navigator.clipboard.writeText(t);}

    function testRegex(){var p=document.getElementById('regex-pattern').value;var f=document.getElementById('regex-flags').value;var t=document.getElementById('regex-text').value;if(!p||!t)return;try{var r=new RegExp(p,f);var m=t.match(r);if(m){document.getElementById('regex-output').innerHTML='<strong>'+m.length+' coincidencia(s):</strong><br>'+m.map(function(m,i){return (i+1)+'. "'+m+'"';}).join('<br>');}else{document.getElementById('regex-output').textContent='Sin coincidencias';}}catch(e){document.getElementById('regex-output').textContent='Error: '+e.message;}}

    function generateUUID(){var c=parseInt(document.getElementById('uuid-count').value)||5;var u=[];for(var i=0;i<c;i++){u.push('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0;var v=c==='x'?r:(r&0x3|0x8);return v.toString(16);}));}document.getElementById('uuid-output').innerHTML=u.map(function(u){return '<div style="margin:4px 0">'+u+'</div>';}).join('');}function copyUUID(){var u=document.getElementById('uuid-output').textContent;if(u)navigator.clipboard.writeText(u);}

    function tsToDate(){var t=parseInt(document.getElementById('ts-input').value);if(isNaN(t))return;var d=new Date(t*1000);document.getElementById('ts-output').textContent=d.toLocaleString('es-ES');}function dateToTs(){var s=document.getElementById('date-input').value;try{var d=new Date(s);if(isNaN(d.getTime()))throw new Error();document.getElementById('ts-output').textContent=Math.floor(d.getTime()/1000);}catch(e){document.getElementById('ts-output').textContent='Fecha inválida';}}

    function renderMarkdown(){var m=document.getElementById('md-input').value;var h=m.replace(/^### (.*$)/gim,'<h3>$1</h3>').replace(/^## (.*$)/gim,'<h2>$1</h2>').replace(/^# (.*$)/gim,'<h1>$1</h1>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>').replace(/\n/g,'<br>');document.getElementById('md-output').innerHTML=h;}

    function convertCase(t){var i=document.getElementById('case-input').value;var o='';switch(t){case'camel':o=i.replace(/(?:^\w|[A-Z]|\b\w)/g,function(w,i){return i===0?w.toLowerCase():w.toUpperCase();}).replace(/\s+/g,'');break;case'snake':o=i.replace(/\s+/g,'_').toLowerCase();break;case'kebab':o=i.replace(/\s+/g,'-').toLowerCase();break;case'pascal':o=i.replace(/(?:^\w|[A-Z]|\b\w)/g,function(w){return w.toUpperCase();}).replace(/\s+/g,'');break;case'upper':o=i.replace(/\s+/g,'_').toUpperCase();break;case'lower':o=i.toLowerCase();break;case'slug':o=i.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');break;case'title':o=i.replace(/\w\S*/g,function(t){return t.charAt(0).toUpperCase()+t.substr(1).toLowerCase();});break;}document.getElementById('case-output').value=o;}

    function escapeHTML(){var i=document.getElementById('html-input').value;var o=i.replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c];});document.getElementById('html-output').value=o;}function unescapeHTML(){var i=document.getElementById('html-input').value;var o=i.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g,function(c){return{'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"}[c];});document.getElementById('html-output').value=o;}function copyHTML(){var h=document.getElementById('html-output').value;if(h)navigator.clipboard.writeText(h);}

    function updateGradient(){var c1=document.getElementById('grad-color1').value;var c2=document.getElementById('grad-color2').value;var a=document.getElementById('grad-angle').value;var css='linear-gradient('+a+'deg, '+c1+', '+c2+')';document.getElementById('grad-preview').style.background=css;document.getElementById('grad-css').textContent='background: '+css+';';}function copyGradient(){var c=document.getElementById('grad-css').textContent;if(c)navigator.clipboard.writeText(c);}updateGradient();

    var swI=null,swS=0,cdI=null,cdS=0;function fmt(s){return String(Math.floor(s/3600)).padStart(2,'0')+':'+String(Math.floor((s%3600)/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}function startStopwatch(){if(swI)return;swI=setInterval(function(){swS++;document.getElementById('timer-display').textContent=fmt(swS);},1000);}function pauseStopwatch(){clearInterval(swI);swI=null;}function resetStopwatch(){pauseStopwatch();swS=0;document.getElementById('timer-display').textContent='00:00:00';}function startCountdown(){var m=parseInt(document.getElementById('timer-min').value)||0;cdS=m*60;if(cdI)return;cdI=setInterval(function(){if(cdS<=0){clearInterval(cdI);cdI=null;return;}cdS--;document.getElementById('timer-display').textContent=fmt(cdS);},1000);}function pauseCountdown(){clearInterval(cdI);cdI=null;}function resetCountdown(){pauseCountdown();cdS=0;document.getElementById('timer-display').textContent='00:00:00';}

    var notes=document.getElementById('quick-notes');notes.value=localStorage.getItem('quickNotes')||'';notes.addEventListener('input',function(){localStorage.setItem('quickNotes',notes.value);document.getElementById('notes-status').textContent='Guardado automáticamente';setTimeout(function(){document.getElementById('notes-status').textContent='';},2000);});function clearNotes(){notes.value='';localStorage.removeItem('quickNotes');}

    function compareText(){var o=document.getElementById('diff-orig').value;var n=document.getElementById('diff-new').value;var ol=o.split('\n');var nl=n.split('\n');var out='';var len=Math.max(ol.length,nl.length);for(var i=0;i<len;i++){var a=ol[i]||'';var b=nl[i]||'';if(a===b){out+='  '+(i+1)+': '+a+'\n';}else{if(a)out+='- '+(i+1)+': '+a+'\n';if(b)out+='+ '+(i+1)+': '+b+'\n';}}document.getElementById('diff-output').textContent=out||'Sin diferencias';}

    var asciiPresets={standard:' .:-=+*#%@',blocks:' ░▒▓█',detailed:" .'`^\":;Il!i><~+_-?][}{1)(|\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",minimal:' ░█',braille:' ⣀⣄⣆⣇⣏⣟⣿'};
    var asciiImageData=null;
    var bayerMatrix=[[0,32,8,40,2,34,10,42],[48,16,56,24,50,18,58,26],[12,44,4,36,14,46,6,38],[60,28,52,20,62,30,54,22],[3,35,11,43,1,33,9,41],[51,19,59,27,49,17,57,25],[15,47,7,39,13,45,5,37],[63,31,55,23,61,29,53,21]];
    document.getElementById('ascii-dropzone').addEventListener('click',function(){document.getElementById('ascii-file').click();});
    document.getElementById('ascii-preview').addEventListener('click',function(){document.getElementById('ascii-file').click();});
    document.getElementById('ascii-type').addEventListener('change',function(){document.getElementById('ascii-custom-section').style.display=this.value==='custom'?'block':'none';if(asciiImageData)generateAscii();});
    function asciiDrop(e){e.preventDefault();this.style.borderColor='#d8c8b8';this.style.background='transparent';var files=e.dataTransfer.files;if(files.length>0){document.getElementById('ascii-file').files=files;processAsciiImage();}}
    function processAsciiImage(){var file=document.getElementById('ascii-file').files[0];if(!file)return;var reader=new FileReader();reader.onload=function(e){var img=new Image();img.onload=function(){var preview=document.getElementById('ascii-preview');var previewImg=document.getElementById('ascii-preview-img');var dropzone=document.getElementById('ascii-dropzone');preview.style.display='inline-block';preview.style.cursor='pointer';preview.title='Haz clic para cambiar la imagen';previewImg.src=img.src;if(dropzone)dropzone.style.display='none';asciiImageData=img;generateAscii();};img.src=e.target.result;};reader.readAsDataURL(file);}
    function getAsciiTextColor(bgColor){var hex=(bgColor||'#000000').replace('#','');if(hex.length===3)hex=hex.split('').map(function(ch){return ch+ch;}).join('');var r=parseInt(hex.slice(0,2),16)||0,g=parseInt(hex.slice(2,4),16)||0,b=parseInt(hex.slice(4,6),16)||0;return (0.2126*r+0.7152*g+0.0722*b)>150?'#111111':'#ffffff';}
    function generateAscii(){if(!asciiImageData)return;var type=document.getElementById('ascii-type').value;var width=parseInt(document.getElementById('ascii-width').value)||100;var invert=document.getElementById('ascii-invert').checked;var color=document.getElementById('ascii-color').checked;var bgColor=(document.getElementById('ascii-bg-color')&&document.getElementById('ascii-bg-color').value)||'#000000';var contrast=parseFloat(document.getElementById('ascii-contrast').value)||1;var brightness=parseInt(document.getElementById('ascii-brightness').value)||0;var ratio=parseFloat(document.getElementById('ascii-ratio').value)||0.5;var spacing=parseFloat(document.getElementById('ascii-spacing')&&document.getElementById('ascii-spacing').value)||1;var dither=document.getElementById('ascii-dither').value;var chars=type==='custom'?document.getElementById('ascii-custom-chars').value:asciiPresets[type];if(!chars||chars.length<2)chars=asciiPresets.standard;
      var baseCharW=6;var charW=baseCharW*spacing;var charH=Math.round(baseCharW/ratio);var fontSize=charH;
      var sourceW=width;var sourceH=Math.round(asciiImageData.height*(width/asciiImageData.width)*ratio);
      var srcCanvas=document.createElement('canvas');srcCanvas.width=sourceW;srcCanvas.height=sourceH;var srcCtx=srcCanvas.getContext('2d');srcCtx.drawImage(asciiImageData,0,0,sourceW,sourceH);
      var srcData=srcCtx.getImageData(0,0,sourceW,sourceH).data;var brightnesses=[];
      for(var y=0;y<sourceH;y++){var row=[];for(var x=0;x<sourceW;x++){var i=(y*sourceW+x)*4;var r=srcData[i],g=srcData[i+1],b=srcData[i+2];var lum=0.2126*r+0.7152*g+0.0722*b;lum=(lum-128)*contrast+128+brightness;lum=Math.max(0,Math.min(255,lum));row.push(lum/255);}brightnesses.push(row);}
      if(dither==='floyd'){for(var y=0;y<sourceH;y++){for(var x=0;x<sourceW;x++){var oldVal=brightnesses[y][x];var newVal=Math.round(oldVal);var err=oldVal-newVal;brightnesses[y][x]=newVal;if(x+1<sourceW)brightnesses[y][x+1]+=err*7/16;if(y+1<sourceH){if(x>0)brightnesses[y+1][x-1]+=err*3/16;brightnesses[y+1][x]+=err*5/16;if(x+1<sourceW)brightnesses[y+1][x+1]+=err*1/16;}}}}
      if(dither==='ordered'){for(var y=0;y<sourceH;y++){for(var x=0;x<sourceW;x++){var threshold=(bayerMatrix[y%8][x%8]+0.5)/64;var val=brightnesses[y][x];brightnesses[y][x]=val<threshold?0:1;}}}
      var output=document.getElementById('ascii-output');var outCanvas=document.getElementById('ascii-canvas');var outCtx=outCanvas.getContext('2d');var textColor=getAsciiTextColor(bgColor);
      outCanvas.width=Math.ceil(sourceW*charW);outCanvas.height=sourceH*charH;outCtx.fillStyle=bgColor;outCtx.fillRect(0,0,outCanvas.width,outCanvas.height);outCtx.font=fontSize+'px monospace';outCtx.textBaseline='top';
      var textLines=[];var textColors=[];
      for(var y=0;y<sourceH;y++){var lineChars='';var lineColors=[];for(var x=0;x<sourceW;x++){var b=brightnesses[y][x];if(invert)b=1-b;var idx=Math.floor(b*(chars.length-1));var ch=chars[Math.min(Math.max(idx,0),chars.length-1)];lineChars+=ch;
          if(color){var i=(y*sourceW+x)*4;lineColors.push('rgb('+srcData[i]+','+srcData[i+1]+','+srcData[i+2]+')');}
          outCtx.fillStyle=color&&lineColors.length>0?lineColors[lineColors.length-1]:textColor;outCtx.fillText(ch,x*charW,y*charH);}
        textLines.push(lineChars);if(color)textColors.push(lineColors);}
      if(color){output.innerHTML='';for(var y=0;y<textLines.length;y++){var lineDiv=document.createElement('div');lineDiv.style.height=charH+'px';for(var x=0;x<textLines[y].length;x++){var span=document.createElement('span');span.textContent=textLines[y][x];span.style.color=textColors[y][x];span.style.display='inline-block';span.style.width=charW+'px';span.style.height=charH+'px';span.style.lineHeight=charH+'px';span.style.textAlign='center';lineDiv.appendChild(span);}output.appendChild(lineDiv);}}
      else{output.textContent=textLines.join('\n');}
      output.style.display='block';output.style.background=bgColor;output.style.color=textColor;output.style.fontSize=charH+'px';output.style.lineHeight=charH+'px';output.style.letterSpacing=color?'0px':(charW-baseCharW)+'px';}
    function copyAscii(){var output=document.getElementById('ascii-output');if(output.style.display==='none')return;var text=output.textContent||'';if(!text){var lines=output.querySelectorAll('div');var t=[];lines.forEach(function(line){var spans=line.querySelectorAll('span');var s='';spans.forEach(function(sp){s+=sp.textContent;});t.push(s);});text=t.join('\n');}navigator.clipboard.writeText(text);}
    function downloadAsciiText(){var output=document.getElementById('ascii-output');if(output.style.display==='none')return;var text=output.textContent||'';if(!text){var lines=output.querySelectorAll('div');var t=[];lines.forEach(function(line){var spans=line.querySelectorAll('span');var s='';spans.forEach(function(sp){s+=sp.textContent;});t.push(s);});text=t.join('\n');}var blob=new Blob([text],{type:'text/plain'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='ascii-art.txt';a.click();}
    function downloadAscii(){var canvas=document.getElementById('ascii-canvas');if(canvas.width===0||canvas.height===0)return;var a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download='ascii-art.png';a.click();}

    var _compressedPDF=null;
    function pdfSelected(){document.getElementById('pdf-output').innerHTML='';document.getElementById('pdf-download').style.display='none';}
    async function compressPDF(){var f=document.getElementById('pdf-file').files[0];if(!f){document.getElementById('pdf-output').textContent='Selecciona un archivo PDF primero';return;}
      var l=parseInt(document.getElementById('pdf-level').value);var quality=[0.92,0.85,0.78,0.7,0.6,0.5,0.4,0.3,0.2,0.1][l-1];var dpi=[200,180,160,140,120,100,85,72,60,50][l-1];
      var bar=document.getElementById('pdf-progress-bar');var prog=document.getElementById('pdf-progress');prog.classList.add('active');bar.style.width='5%';
      try{
        var buf=await f.arrayBuffer();bar.style.width='10%';
        var pdfjsLib=window.pdfjsLib;pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        var pdf=await pdfjsLib.getDocument({data:buf}).promise;var n=pdf.numPages;bar.style.width='15%';
        var newDoc=await PDFLib.PDFDocument.create();
        for(var i=1;i<=n;i++){
          var page=await pdf.getPage(i);var origVp=page.getViewport({scale:1});var pageW=origVp.width;var pageH=origVp.height;
          var targetDPI=dpi;var scale=targetDPI/72;
          var vp=page.getViewport({scale:scale});
          var canvas=document.createElement('canvas');canvas.width=vp.width;canvas.height=vp.height;
          var ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,vp.width,vp.height);
          await page.render({canvasContext:ctx,viewport:vp}).promise;
          var jpegData=canvas.toDataURL('image/jpeg',quality);
          var bs=atob(jpegData.split(',')[1]);var len=bs.length;var bytes=new Uint8Array(len);
          for(var j=0;j<len;j++)bytes[j]=bs.charCodeAt(j);
          var img=await newDoc.embedJpg(bytes);
          var p=newDoc.addPage([pageW,pageH]);
          p.drawImage(img,{x:0,y:0,width:pageW,height:pageH});
          bar.style.width=15+((i/n)*75)+'%';
        }
        var compressed=await newDoc.save({useObjectStreams:true});bar.style.width='100%';
        _compressedPDF=compressed;
        var orig=f.size;var comp=compressed.length;var red=((1-comp/orig)*100).toFixed(1);
        var note=red<0?' <span style="color:var(--error)">(no se pudo reducir, intenta un nivel más alto)</span>':'';
        document.getElementById('pdf-output').innerHTML='<strong>Original:</strong> '+fmtBytes(orig)+'<br><strong>Comprimido:</strong> '+fmtBytes(comp)+'<br><strong>Reducción:</strong> '+red+'%'+note+'<br><small style="color:var(--muted)">(el PDF se recompone a partir de imágenes para lograr compresión)</small>';
        document.getElementById('pdf-download').style.display='inline-flex';
      }catch(e){
        document.getElementById('pdf-output').textContent='Error: '+(e.message||'no se pudo comprimir el PDF');
      }
      prog.classList.remove('active');
    }
    function fmtBytes(b){if(b<1024)return b+' B';if(b<1048576)return(b/1024).toFixed(1)+' KB';return(b/1048576).toFixed(1)+' MB';}
    function downloadPDF(){if(_compressedPDF){var b=new Blob([_compressedPDF],{type:'application/pdf'});var u=URL.createObjectURL(b);var a=document.createElement('a');a.href=u;a.download='comprimido.pdf';a.click();URL.revokeObjectURL(u);}}

    function parsePages(input,max){var out=[];if(!input)return out;var parts=input.split(',');for(var i=0;i<parts.length;i++){var p=parts[i].trim();if(!p)continue;var range=p.split('-');if(range.length===1){var n=parseInt(range[0]);if(!isNaN(n)&&n>=1&&n<=max)out.push(n);}else if(range.length===2){var start=parseInt(range[0]);var end=parseInt(range[1]);if(!isNaN(start)&&!isNaN(end)){for(var j=start;j<=end;j++){if(j>=1&&j<=max)out.push(j);}}}}return out;}

    var _mergeFiles=[];
    var _mergedPDF=null;
    function renderMergeList(){var list=document.getElementById('pdf-merge-list');list.innerHTML='';for(var i=0;i<_mergeFiles.length;i++){var li=document.createElement('li');li.style.display='flex';li.style.alignItems='center';li.style.justifyContent='space-between';li.style.gap='8px';li.style.padding='6px 0';li.style.borderBottom='1px solid var(--line)';var info=document.createElement('span');info.textContent=(i+1)+'. '+_mergeFiles[i].name+' ('+fmtBytes(_mergeFiles[i].size)+')';info.style.overflow='hidden';info.style.textOverflow='ellipsis';info.style.whiteSpace='nowrap';var btn=document.createElement('button');btn.textContent='×';btn.style.flexShrink='0';btn.style.width='24px';btn.style.height='24px';btn.style.border='1px solid var(--line)';btn.style.borderRadius='4px';btn.style.background='var(--surface)';btn.style.color='var(--danger)';btn.style.cursor='pointer';btn.style.fontWeight='700';btn.style.lineHeight='1';btn.onclick=function(idx){return function(){_mergeFiles.splice(idx,1);renderMergeList();};}(i);li.appendChild(info);li.appendChild(btn);list.appendChild(li);}}
    function addMergeFiles(){var files=document.getElementById('pdf-merge-files').files;for(var i=0;i<files.length;i++){_mergeFiles.push(files[i]);}renderMergeList();document.getElementById('pdf-merge-files').value='';}
    function clearMergeFiles(){_mergeFiles=[];renderMergeList();document.getElementById('pdf-merge-output').innerHTML='';document.getElementById('pdf-merge-download').style.display='none';}
    async function mergePDFs(){if(_mergeFiles.length<2){document.getElementById('pdf-merge-output').textContent='Agrega al menos 2 PDFs';return;}document.getElementById('pdf-merge-output').textContent='Procesando...';try{var merged=await PDFLib.PDFDocument.create();for(var i=0;i<_mergeFiles.length;i++){var buf=await _mergeFiles[i].arrayBuffer();var src=await PDFLib.PDFDocument.load(buf);var pages=await merged.copyPages(src,src.getPageIndices());for(var j=0;j<pages.length;j++){merged.addPage(pages[j]);}}var bytes=await merged.save();_mergedPDF=bytes;document.getElementById('pdf-merge-output').innerHTML='<strong>Archivos unidos:</strong> '+_mergeFiles.length+'<br><strong>Tamaño:</strong> '+fmtBytes(bytes.length);document.getElementById('pdf-merge-download').style.display='inline-flex';}catch(e){document.getElementById('pdf-merge-output').textContent='Error: '+(e.message||'no se pudieron unir los PDFs');}}
    function downloadMergedPDF(){if(_mergedPDF){var b=new Blob([_mergedPDF],{type:'application/pdf'});var u=URL.createObjectURL(b);var a=document.createElement('a');a.href=u;a.download='unido.pdf';a.click();URL.revokeObjectURL(u);}}

    var _splitPDF=null;
    var _splitTotalPages=0;
    var _splitSelected=[];
    async function loadSplitPDF(){var f=document.getElementById('pdf-split-file').files[0];if(!f)return;var wrap=document.getElementById('pdf-split-thumb-wrap');var grid=document.getElementById('pdf-split-grid');var prog=document.getElementById('pdf-split-progress');var bar=document.getElementById('pdf-split-progress-bar');prog.classList.add('active');bar.style.width='10%';wrap.style.display='none';grid.innerHTML='';_splitSelected=[];_splitTotalPages=0;document.getElementById('pdf-split-output').innerHTML='';document.getElementById('pdf-split-download').style.display='none';try{var buf=await f.arrayBuffer();var pdfjsLib=window.pdfjsLib;pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';var pdf=await pdfjsLib.getDocument({data:buf}).promise;_splitTotalPages=pdf.numPages;for(var i=1;i<=_splitTotalPages;i++){var page=await pdf.getPage(i);var scale=110/Math.max(page.getViewport({scale:1}).width,page.getViewport({scale:1}).height);if(scale>2)scale=2;var vp=page.getViewport({scale:scale});var canvas=document.createElement('canvas');canvas.width=vp.width;canvas.height=vp.height;canvas.className='pdf-thumb-canvas';var ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,vp.width,vp.height);await page.render({canvasContext:ctx,viewport:vp}).promise;var item=document.createElement('div');item.className='pdf-thumb-item';item.dataset.page=i;item.onclick=function(p){return function(){toggleSplitPage(p);};}(i);var label=document.createElement('div');label.className='pdf-thumb-label';label.textContent='Pág. '+i;item.appendChild(canvas);item.appendChild(label);grid.appendChild(item);bar.style.width=(i/_splitTotalPages*100)+'%';}wrap.style.display='block';prog.classList.remove('active');_splitSelected=[];for(var i=1;i<=_splitTotalPages;i++)_splitSelected.push(i);updateSplitSelectionUI();}catch(e){document.getElementById('pdf-split-output').textContent='Error: '+(e.message||'no se pudo cargar el PDF');prog.classList.remove('active');}}
    function toggleSplitPage(p){var idx=_splitSelected.indexOf(p);if(idx!==-1){_splitSelected.splice(idx,1);}else{_splitSelected.push(p);_splitSelected.sort(function(a,b){return a-b;});}updateSplitSelectionUI();}
    function updateSplitSelectionUI(){document.querySelectorAll('.pdf-thumb-item').forEach(function(item){var p=parseInt(item.dataset.page);if(_splitSelected.indexOf(p)!==-1){item.classList.add('selected');}else{item.classList.remove('selected');}});document.getElementById('pdf-split-output').innerHTML='<strong>Seleccionadas:</strong> '+_splitSelected.length+' / '+_splitTotalPages+' páginas';}
    function selectAllSplit(){_splitSelected=[];for(var i=1;i<=_splitTotalPages;i++)_splitSelected.push(i);updateSplitSelectionUI();}
    function deselectAllSplit(){_splitSelected=[];updateSplitSelectionUI();}
    function applySplitRange(){var input=document.getElementById('pdf-split-pages').value;if(!input||!_splitTotalPages)return;var parsed=parsePages(input,_splitTotalPages);for(var i=0;i<parsed.length;i++){if(_splitSelected.indexOf(parsed[i])===-1){_splitSelected.push(parsed[i]);}}_splitSelected.sort(function(a,b){return a-b;});updateSplitSelectionUI();document.getElementById('pdf-split-pages').value='';}
    async function splitPDF(){if(_splitSelected.length===0){document.getElementById('pdf-split-output').textContent='Selecciona al menos una página';return;}document.getElementById('pdf-split-output').textContent='Procesando...';try{var f=document.getElementById('pdf-split-file').files[0];var buf=await f.arrayBuffer();var src=await PDFLib.PDFDocument.load(buf);var out=await PDFLib.PDFDocument.create();var copied=await out.copyPages(src,_splitSelected.map(function(p){return p-1;}));for(var i=0;i<copied.length;i++){out.addPage(copied[i]);}var bytes=await out.save();_splitPDF=bytes;document.getElementById('pdf-split-output').innerHTML='<strong>Páginas extraídas:</strong> '+_splitSelected.length+'<br><strong>Tamaño:</strong> '+fmtBytes(bytes.length);document.getElementById('pdf-split-download').style.display='inline-flex';}catch(e){document.getElementById('pdf-split-output').textContent='Error: '+(e.message||'no se pudo dividir el PDF');}}
    function downloadSplitPDF(){if(_splitPDF){var b=new Blob([_splitPDF],{type:'application/pdf'});var u=URL.createObjectURL(b);var a=document.createElement('a');a.href=u;a.download='extraido.pdf';a.click();URL.revokeObjectURL(u);}}

    var _img2pdf=null;
    function img2pdfList(){var files=document.getElementById('pdf-img2pdf-files').files;var list=document.getElementById('pdf-img2pdf-list');list.innerHTML='';for(var i=0;i<files.length;i++){var li=document.createElement('li');li.textContent=(i+1)+'. '+files[i].name+' ('+fmtBytes(files[i].size)+')';li.style.padding='3px 0';li.style.borderBottom='1px solid var(--line)';list.appendChild(li);}}
    async function imagesToPDF(){var files=document.getElementById('pdf-img2pdf-files').files;if(files.length===0){document.getElementById('pdf-img2pdf-output').textContent='Selecciona al menos una imagen';return;}document.getElementById('pdf-img2pdf-output').textContent='Procesando...';try{var pdf=await PDFLib.PDFDocument.create();for(var i=0;i<files.length;i++){var buf=await files[i].arrayBuffer();var imgBytes=new Uint8Array(buf);var img; if(files[i].type==='image/png'){img=await pdf.embedPng(imgBytes);}else{img=await pdf.embedJpg(imgBytes);}var dims=img.scale(1);var page=pdf.addPage([dims.width,dims.height]);page.drawImage(img,{x:0,y:0,width:dims.width,height:dims.height});}var bytes=await pdf.save();_img2pdf=bytes;document.getElementById('pdf-img2pdf-output').innerHTML='<strong>Imágenes:</strong> '+files.length+'<br><strong>Tamaño:</strong> '+fmtBytes(bytes.length);document.getElementById('pdf-img2pdf-download').style.display='inline-flex';}catch(e){document.getElementById('pdf-img2pdf-output').textContent='Error: '+(e.message||'no se pudo crear el PDF');}}
    function downloadImg2PDF(){if(_img2pdf){var b=new Blob([_img2pdf],{type:'application/pdf'});var u=URL.createObjectURL(b);var a=document.createElement('a');a.href=u;a.download='imagenes.pdf';a.click();URL.revokeObjectURL(u);}}

    async function pdfToImages(){var f=document.getElementById('pdf-pdf2img-file').files[0];if(!f){document.getElementById('pdf-pdf2img-output').textContent='Selecciona un PDF primero';return;}var scale=parseFloat(document.getElementById('pdf-pdf2img-scale').value)||1.5;document.getElementById('pdf-pdf2img-output').textContent='Renderizando páginas...';document.getElementById('pdf-pdf2img-grid').innerHTML='';var prog=document.getElementById('pdf-pdf2img-progress');var bar=document.getElementById('pdf-pdf2img-progress-bar');prog.classList.add('active');bar.style.width='5%';try{var buf=await f.arrayBuffer();var pdfjsLib=window.pdfjsLib;pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';var pdf=await pdfjsLib.getDocument({data:buf}).promise;var n=pdf.numPages;var grid=document.getElementById('pdf-pdf2img-grid');for(var i=1;i<=n;i++){var page=await pdf.getPage(i);var vp=page.getViewport({scale:scale});var canvas=document.createElement('canvas');canvas.width=vp.width;canvas.height=vp.height;var ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,vp.width,vp.height);await page.render({canvasContext:ctx,viewport:vp}).promise;var dataUrl=canvas.toDataURL('image/png');var wrapper=document.createElement('div');wrapper.style.border='1px solid var(--line)';wrapper.style.borderRadius='var(--radius)';wrapper.style.padding='8px';wrapper.style.background='var(--surface-strong)';var img=document.createElement('img');img.src=dataUrl;img.style.width='100%';img.style.borderRadius='4px';img.style.display='block';var btn=document.createElement('button');btn.className='btn';btn.style.width='100%';btn.style.marginTop='8px';btn.style.minHeight='32px';btn.style.padding='6px';btn.style.fontSize='0.72rem';btn.innerHTML='<i data-lucide="download"></i> Página '+i;btn.onclick=function(url,pageNum){return function(){var a=document.createElement('a');a.href=url;a.download='pagina_'+pageNum+'.png';a.click();};}(dataUrl,i);wrapper.appendChild(img);wrapper.appendChild(btn);grid.appendChild(wrapper);bar.style.width=(i/n*100)+'%';if(window.lucide&&typeof window.lucide.createIcons==='function'){window.lucide.createIcons();}}document.getElementById('pdf-pdf2img-output').textContent='Se generaron '+n+' imagen(es). Haz clic en cada botón para descargar.';prog.classList.remove('active');}catch(e){document.getElementById('pdf-pdf2img-output').textContent='Error: '+(e.message||'no se pudo convertir el PDF');prog.classList.remove('active');}}

    var _rotatedPDF=null;
    function toggleRotatePages(){var all=document.getElementById('pdf-rotate-all').checked;document.getElementById('pdf-rotate-pages-wrap').style.display=all?'none':'block';}
    async function rotatePDF(){var f=document.getElementById('pdf-rotate-file').files[0];if(!f){document.getElementById('pdf-rotate-output').textContent='Selecciona un PDF primero';return;}var angle=parseInt(document.getElementById('pdf-rotate-angle').value)||90;var all=document.getElementById('pdf-rotate-all').checked;document.getElementById('pdf-rotate-output').textContent='Procesando...';try{var buf=await f.arrayBuffer();var src=await PDFLib.PDFDocument.load(buf);var total=src.getPageCount();var pagesToRotate=all?[]:parsePages(document.getElementById('pdf-rotate-pages').value,total);var pdf=await PDFLib.PDFDocument.create();var copied=await pdf.copyPages(src,src.getPageIndices());for(var i=0;i<copied.length;i++){var p=copied[i];if(all||pagesToRotate.indexOf(i+1)!==-1){var curr=p.getRotation().degrees;p.setRotation(PDFLib.degrees(curr+angle));}pdf.addPage(p);}var bytes=await pdf.save();_rotatedPDF=bytes;document.getElementById('pdf-rotate-output').innerHTML='<strong>Páginas rotadas:</strong> '+(all?total:pagesToRotate.length)+' / '+total+'<br><strong>Tamaño:</strong> '+fmtBytes(bytes.length);document.getElementById('pdf-rotate-download').style.display='inline-flex';}catch(e){document.getElementById('pdf-rotate-output').textContent='Error: '+(e.message||'no se pudo rotar el PDF');}}
    function downloadRotatedPDF(){if(_rotatedPDF){var b=new Blob([_rotatedPDF],{type:'application/pdf'});var u=URL.createObjectURL(b);var a=document.createElement('a');a.href=u;a.download='rotado.pdf';a.click();URL.revokeObjectURL(u);}}

    var _removedPDF=null;
    async function removePDFPages(){var f=document.getElementById('pdf-remove-file').files[0];if(!f){document.getElementById('pdf-remove-output').textContent='Selecciona un PDF primero';return;}var input=document.getElementById('pdf-remove-pages').value;if(!input){document.getElementById('pdf-remove-output').textContent='Especifica las páginas a eliminar';return;}document.getElementById('pdf-remove-output').textContent='Procesando...';try{var buf=await f.arrayBuffer();var src=await PDFLib.PDFDocument.load(buf);var total=src.getPageCount();var toRemove=parsePages(input,total);if(toRemove.length===0){document.getElementById('pdf-remove-output').textContent='No se encontraron páginas válidas para eliminar';return;}var keep=[];for(var i=1;i<=total;i++){if(toRemove.indexOf(i)===-1)keep.push(i-1);}if(keep.length===0){document.getElementById('pdf-remove-output').textContent='No puedes eliminar todas las páginas';return;}var out=await PDFLib.PDFDocument.create();var copied=await out.copyPages(src,keep);for(var i=0;i<copied.length;i++){out.addPage(copied[i]);}var bytes=await out.save();_removedPDF=bytes;document.getElementById('pdf-remove-output').innerHTML='<strong>Páginas eliminadas:</strong> '+toRemove.length+'<br><strong>Páginas restantes:</strong> '+keep.length+'<br><strong>Tamaño:</strong> '+fmtBytes(bytes.length);document.getElementById('pdf-remove-download').style.display='inline-flex';}catch(e){document.getElementById('pdf-remove-output').textContent='Error: '+(e.message||'no se pudieron eliminar las páginas');}}
    function downloadRemovedPDF(){if(_removedPDF){var b=new Blob([_removedPDF],{type:'application/pdf'});var u=URL.createObjectURL(b);var a=document.createElement('a');a.href=u;a.download='sin_paginas.pdf';a.click();URL.revokeObjectURL(u);}}

    async function extractPDFText(){var f=document.getElementById('pdf-text-file').files[0];if(!f){document.getElementById('pdf-text-output').value='Selecciona un PDF primero';return;}var prog=document.getElementById('pdf-text-progress');var bar=document.getElementById('pdf-text-progress-bar');prog.classList.add('active');bar.style.width='10%';document.getElementById('pdf-text-output').value='Extrayendo...';try{var buf=await f.arrayBuffer();var pdfjsLib=window.pdfjsLib;pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';var pdf=await pdfjsLib.getDocument({data:buf}).promise;var n=pdf.numPages;var text='';for(var i=1;i<=n;i++){var page=await pdf.getPage(i);var content=await page.getTextContent();var items=content.items.map(function(item){return item.str;});text+='--- Página '+i+' ---\n'+items.join(' ')+'\n\n';bar.style.width=(i/n*100)+'%';}document.getElementById('pdf-text-output').value=text.trim();document.getElementById('pdf-text-copy').style.display='inline-flex';prog.classList.remove('active');}catch(e){document.getElementById('pdf-text-output').value='Error: '+(e.message||'no se pudo extraer el texto');prog.classList.remove('active');}}
    function copyExtractedText(){var t=document.getElementById('pdf-text-output').value;if(t)navigator.clipboard.writeText(t);}

    function contrastLum(r,g,b){var R=r/255,G=g/255,B=b/255;R=R<=0.03928?R/12.92:Math.pow((R+0.055)/1.055,2.4);G=G<=0.03928?G/12.92:Math.pow((G+0.055)/1.055,2.4);B=B<=0.03928?B/12.92:Math.pow((B+0.055)/1.055,2.4);return 0.2126*R+0.7152*G+0.0722*B;}
    function contrastRatioHex(h1,h2){var c1=hexToRgbObj(h1),c2=hexToRgbObj(h2);var l1=contrastLum(c1.r,c1.g,c1.b),l2=contrastLum(c2.r,c2.g,c2.b);var light=Math.max(l1,l2),dark=Math.min(l1,l2);return(light+0.05)/(dark+0.05);}
    function hexToRgbObj(h){var r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return{r:r,g:g,b:b};}
    function rgbToHexStr(r,g,b){return'#'+[r,g,b].map(function(v){return Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0');}).join('');}
    function hslToRgb(h,s,l){s/=100;l/=100;var c=(1-Math.abs(2*l-1))*s;var x=c*(1-Math.abs((h/60)%2-1));var m=l-c/2;var r=0,g=0,b=0;if(h<60){r=c;g=x;}else if(h<120){r=x;g=c;}else if(h<180){g=c;b=x;}else if(h<240){g=x;b=c;}else if(h<300){r=x;b=c;}else{r=c;b=x;}return{r:Math.round((r+m)*255),g:Math.round((g+m)*255),b:Math.round((b+m)*255)};}
    function rgbToHslObj(r,g,b){r/=255;g/=255;b/=255;var max=Math.max(r,g,b),min=Math.min(r,g,b);var h=0,s=0,l=(max+min)/2;if(max!==min){var d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=((g-b)/d+(g<b?6:0))*60;break;case g:h=((b-r)/d+2)*60;break;case b:h=((r-g)/d+4)*60;break;}}return{h:h,s:s*100,l:l*100};}
    function updateContrast(){var bg=document.getElementById('contrast-bg').value;var fg=document.getElementById('contrast-fg').value;document.getElementById('contrast-bg-hex').value=bg;document.getElementById('contrast-fg-hex').value=fg;var preview=document.getElementById('contrast-preview');preview.style.backgroundColor=bg;preview.style.color=fg;var ratio=contrastRatioHex(bg,fg);var rText=ratio.toFixed(2)+':1';document.getElementById('contrast-ratio').textContent=rText;var v='';if(ratio>=12){v='Super';}else if(ratio>=7){v='Excellent';}else if(ratio>=4.5){v='Good';}else if(ratio>=3){v='Fair';}else{v='Poor';}document.getElementById('contrast-verdict').textContent=v;setBadge('contrast-aa-normal',ratio>=4.5,'Normal Text (4.5:1)');setBadge('contrast-aa-large',ratio>=3,'Large Text (3:1)');setBadge('contrast-aaa-normal',ratio>=7,'Normal Text (7:1)');setBadge('contrast-aaa-large',ratio>=4.5,'Large Text (4.5:1)');}
    function setBadge(id,pass,text){var el=document.getElementById(id);if(!el)return;el.textContent=(pass?'✓ ':'✗ ')+text;el.className='contrast-badge '+(pass?'ok':'fail');}
    function contrastHexInput(type){var input=document.getElementById('contrast-'+type+'-hex');var val=input.value.replace(/[^0-9a-fA-F#]/g,'');if(!val.startsWith('#'))val='#'+val;if(val.length===7){document.getElementById('contrast-'+type).value=val.toLowerCase();updateContrast();}}
    function flipContrastColors(){var bg=document.getElementById('contrast-bg').value;var fg=document.getElementById('contrast-fg').value;document.getElementById('contrast-bg').value=fg;document.getElementById('contrast-fg').value=bg;updateContrast();}
    function fixContrast(level){var bg=document.getElementById('contrast-bg').value;var fg=document.getElementById('contrast-fg').value;var target=level==='AAA'?7:4.5;var bgRgb=hexToRgbObj(bg);var bgLum=contrastLum(bgRgb.r,bgRgb.g,bgRgb.b);var fgRgb=hexToRgbObj(fg);var hsl=rgbToHslObj(fgRgb.r,fgRgb.g,fgRgb.b);var bestPass=null;var bestOverall=null;for(var l=0;l<=100;l+=0.5){var rgb=hslToRgb(hsl.h,hsl.s,l);var lum=contrastLum(rgb.r,rgb.g,rgb.b);var ratio=(Math.max(lum,bgLum)+0.05)/(Math.min(lum,bgLum)+0.05);var candidate={rgb:rgb,ratio:ratio,delta:Math.abs(l-hsl.l)};if(!bestOverall||candidate.ratio>bestOverall.ratio||(candidate.ratio===bestOverall.ratio&&candidate.delta<bestOverall.delta)){bestOverall=candidate;}if(ratio>=target&&(!bestPass||candidate.delta<bestPass.delta)){bestPass=candidate;}}var picked=bestPass||bestOverall;if(picked){document.getElementById('contrast-fg').value=rgbToHexStr(picked.rgb.r,picked.rgb.g,picked.rgb.b);updateContrast();}}

    (function(){
      var body=document.body;
      var overlay=document.getElementById('settings-overlay');
      var panel=document.getElementById('settings-panel');
      var openBtn=document.getElementById('settings-open');
      var closeBtn=document.getElementById('settings-close');
      var chipGrid=document.getElementById('theme-chip-grid');
      var systemThemeToggle=document.getElementById('setting-system-theme');
      var gridToggle=document.getElementById('setting-grid');
      var compactToggle=document.getElementById('setting-compact');
      var descToggle=document.getElementById('setting-desc');
      var largeTextToggle=document.getElementById('setting-large-text');
      var highContrastToggle=document.getElementById('setting-high-contrast');
      var motionToggle=document.getElementById('setting-motion');
      var clearBtn=document.getElementById('setting-clear');
      var systemThemeQuery=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)'):null;

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
        }catch(e){}
      }

      function systemTheme(){
        return systemThemeQuery&&systemThemeQuery.matches?'dark':'light';
      }

      function applyTheme(theme){
        body.classList.remove.apply(body.classList,themeClasses);
        if(theme!=='light'){body.classList.add('theme-'+theme);}
        if(chipGrid){
          chipGrid.querySelectorAll('.theme-chip').forEach(function(btn){
            btn.classList.toggle('active',btn.getAttribute('data-theme')===theme);
          });
        }
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

      if(openBtn){openBtn.addEventListener('click',openSettings);}
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

      if(clearBtn){
        clearBtn.addEventListener('click',function(){
          if(confirm('¿Seguro que quieres eliminar todas las configuraciones y datos guardados?')){
            localStorage.clear();
            location.reload();
          }
        });
      }
    })();

const publicApi = {
  showTool: typeof showTool !== 'undefined' ? showTool : undefined,
  generateQR: typeof generateQR !== 'undefined' ? generateQR : undefined,
  downloadQR: typeof downloadQR !== 'undefined' ? downloadQR : undefined,
  generatePassword: typeof generatePassword !== 'undefined' ? generatePassword : undefined,
  copyPassword: typeof copyPassword !== 'undefined' ? copyPassword : undefined,
  checkPassword: typeof checkPassword !== 'undefined' ? checkPassword : undefined,
  textTransform: typeof textTransform !== 'undefined' ? textTransform : undefined,
  findReplace: typeof findReplace !== 'undefined' ? findReplace : undefined,
  copyFR: typeof copyFR !== 'undefined' ? copyFR : undefined,
  formatJSON: typeof formatJSON !== 'undefined' ? formatJSON : undefined,
  minifyJSON: typeof minifyJSON !== 'undefined' ? minifyJSON : undefined,
  copyJSON: typeof copyJSON !== 'undefined' ? copyJSON : undefined,
  setBase: typeof setBase !== 'undefined' ? setBase : undefined,
  convertBase: typeof convertBase !== 'undefined' ? convertBase : undefined,
  convertColor: typeof convertColor !== 'undefined' ? convertColor : undefined,
  generateHarmony: typeof generateHarmony !== 'undefined' ? generateHarmony : undefined,
  copyHarmonyColor: typeof copyHarmonyColor !== 'undefined' ? copyHarmonyColor : undefined,
  randomHarmonyColor: typeof randomHarmonyColor !== 'undefined' ? randomHarmonyColor : undefined,
  copyHarmonyPalette: typeof copyHarmonyPalette !== 'undefined' ? copyHarmonyPalette : undefined,
  copyHarmonyCSS: typeof copyHarmonyCSS !== 'undefined' ? copyHarmonyCSS : undefined,
  flipContrastColors: typeof flipContrastColors !== 'undefined' ? flipContrastColors : undefined,
  fixContrast: typeof fixContrast !== 'undefined' ? fixContrast : undefined,
  contrastHexInput: typeof contrastHexInput !== 'undefined' ? contrastHexInput : undefined,
  updateContrast: typeof updateContrast !== 'undefined' ? updateContrast : undefined,
  updateShadow: typeof updateShadow !== 'undefined' ? updateShadow : undefined,
  copyShadow: typeof copyShadow !== 'undefined' ? copyShadow : undefined,
  imgToBase64: typeof imgToBase64 !== 'undefined' ? imgToBase64 : undefined,
  copyImgBase64: typeof copyImgBase64 !== 'undefined' ? copyImgBase64 : undefined,
  renderHTMLPreview: typeof renderHTMLPreview !== 'undefined' ? renderHTMLPreview : undefined,
  generateFFmpeg: typeof generateFFmpeg !== 'undefined' ? generateFFmpeg : undefined,
  copyFFmpeg: typeof copyFFmpeg !== 'undefined' ? copyFFmpeg : undefined,
  generateHash: typeof generateHash !== 'undefined' ? generateHash : undefined,
  convertUnit: typeof convertUnit !== 'undefined' ? convertUnit : undefined,
  generateRandom: typeof generateRandom !== 'undefined' ? generateRandom : undefined,
  copyRandom: typeof copyRandom !== 'undefined' ? copyRandom : undefined,
  generateLorem: typeof generateLorem !== 'undefined' ? generateLorem : undefined,
  copyLorem: typeof copyLorem !== 'undefined' ? copyLorem : undefined,
  testRegex: typeof testRegex !== 'undefined' ? testRegex : undefined,
  generateUUID: typeof generateUUID !== 'undefined' ? generateUUID : undefined,
  copyUUID: typeof copyUUID !== 'undefined' ? copyUUID : undefined,
  tsToDate: typeof tsToDate !== 'undefined' ? tsToDate : undefined,
  dateToTs: typeof dateToTs !== 'undefined' ? dateToTs : undefined,
  renderMarkdown: typeof renderMarkdown !== 'undefined' ? renderMarkdown : undefined,
  convertCase: typeof convertCase !== 'undefined' ? convertCase : undefined,
  escapeHTML: typeof escapeHTML !== 'undefined' ? escapeHTML : undefined,
  unescapeHTML: typeof unescapeHTML !== 'undefined' ? unescapeHTML : undefined,
  copyHTML: typeof copyHTML !== 'undefined' ? copyHTML : undefined,
  updateGradient: typeof updateGradient !== 'undefined' ? updateGradient : undefined,
  copyGradient: typeof copyGradient !== 'undefined' ? copyGradient : undefined,
  startStopwatch: typeof startStopwatch !== 'undefined' ? startStopwatch : undefined,
  pauseStopwatch: typeof pauseStopwatch !== 'undefined' ? pauseStopwatch : undefined,
  resetStopwatch: typeof resetStopwatch !== 'undefined' ? resetStopwatch : undefined,
  startCountdown: typeof startCountdown !== 'undefined' ? startCountdown : undefined,
  pauseCountdown: typeof pauseCountdown !== 'undefined' ? pauseCountdown : undefined,
  resetCountdown: typeof resetCountdown !== 'undefined' ? resetCountdown : undefined,
  clearNotes: typeof clearNotes !== 'undefined' ? clearNotes : undefined,
  compareText: typeof compareText !== 'undefined' ? compareText : undefined,
  asciiDrop: typeof asciiDrop !== 'undefined' ? asciiDrop : undefined,
  processAsciiImage: typeof processAsciiImage !== 'undefined' ? processAsciiImage : undefined,
  generateAscii: typeof generateAscii !== 'undefined' ? generateAscii : undefined,
  copyAscii: typeof copyAscii !== 'undefined' ? copyAscii : undefined,
  downloadAsciiText: typeof downloadAsciiText !== 'undefined' ? downloadAsciiText : undefined,
  downloadAscii: typeof downloadAscii !== 'undefined' ? downloadAscii : undefined,
  pdfSelected: typeof pdfSelected !== 'undefined' ? pdfSelected : undefined,
  compressPDF: typeof compressPDF !== 'undefined' ? compressPDF : undefined,
  downloadPDF: typeof downloadPDF !== 'undefined' ? downloadPDF : undefined,
  addMergeFiles: typeof addMergeFiles !== 'undefined' ? addMergeFiles : undefined,
  clearMergeFiles: typeof clearMergeFiles !== 'undefined' ? clearMergeFiles : undefined,
  mergePDFs: typeof mergePDFs !== 'undefined' ? mergePDFs : undefined,
  downloadMergedPDF: typeof downloadMergedPDF !== 'undefined' ? downloadMergedPDF : undefined,
  loadSplitPDF: typeof loadSplitPDF !== 'undefined' ? loadSplitPDF : undefined,
  toggleSplitPage: typeof toggleSplitPage !== 'undefined' ? toggleSplitPage : undefined,
  selectAllSplit: typeof selectAllSplit !== 'undefined' ? selectAllSplit : undefined,
  deselectAllSplit: typeof deselectAllSplit !== 'undefined' ? deselectAllSplit : undefined,
  applySplitRange: typeof applySplitRange !== 'undefined' ? applySplitRange : undefined,
  splitPDF: typeof splitPDF !== 'undefined' ? splitPDF : undefined,
  downloadSplitPDF: typeof downloadSplitPDF !== 'undefined' ? downloadSplitPDF : undefined,
  img2pdfList: typeof img2pdfList !== 'undefined' ? img2pdfList : undefined,
  imagesToPDF: typeof imagesToPDF !== 'undefined' ? imagesToPDF : undefined,
  downloadImg2PDF: typeof downloadImg2PDF !== 'undefined' ? downloadImg2PDF : undefined,
  pdfToImages: typeof pdfToImages !== 'undefined' ? pdfToImages : undefined,
  toggleRotatePages: typeof toggleRotatePages !== 'undefined' ? toggleRotatePages : undefined,
  rotatePDF: typeof rotatePDF !== 'undefined' ? rotatePDF : undefined,
  downloadRotatedPDF: typeof downloadRotatedPDF !== 'undefined' ? downloadRotatedPDF : undefined,
  removePDFPages: typeof removePDFPages !== 'undefined' ? removePDFPages : undefined,
  downloadRemovedPDF: typeof downloadRemovedPDF !== 'undefined' ? downloadRemovedPDF : undefined,
  extractPDFText: typeof extractPDFText !== 'undefined' ? extractPDFText : undefined,
  copyExtractedText: typeof copyExtractedText !== 'undefined' ? copyExtractedText : undefined
};
Object.entries(publicApi).forEach(([name, fn]) => {
  if (typeof fn === 'function') {
    window[name] = fn;
  }
});
