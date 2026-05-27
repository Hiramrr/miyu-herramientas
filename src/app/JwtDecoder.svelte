<script>
  let token = $state('');
  let header = $state('');
  let payload = $state('');
  let signature = $state('');
  let error = $state('');
  let expired = $state(null);
  let expDate = $state('');
  let iatDate = $state('');
  let timeLeft = $state('');

  function decodeBase64Url(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return decodeURIComponent(
      atob(str)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  }

  function formatTimeLeft(seconds) {
    if (seconds <= 0) return 'Expirado';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts = [];
    if (d > 0) parts.push(d + 'd');
    if (h > 0) parts.push(h + 'h');
    if (m > 0) parts.push(m + 'm');
    if (s > 0 && d === 0) parts.push(s + 's');
    return parts.join(' ') || 'Menos de 1s';
  }

  function decode() {
    error = '';
    header = '';
    payload = '';
    signature = '';
    expired = null;
    expDate = '';
    iatDate = '';
    timeLeft = '';

    if (!token.trim()) {
      error = 'Pega un JWT para decodificar';
      return;
    }

    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      error = 'JWT inválido: debe tener 3 partes separadas por puntos';
      return;
    }

    try {
      const h = JSON.parse(decodeBase64Url(parts[0]));
      header = JSON.stringify(h, null, 2);
    } catch (e) {
      error = 'Header inválido: ' + e.message;
      return;
    }

    try {
      const p = JSON.parse(decodeBase64Url(parts[1]));
      payload = JSON.stringify(p, null, 2);

      if (p.exp) {
        const expTime = p.exp * 1000;
        const now = Date.now();
        expired = now > expTime;
        expDate = new Date(expTime).toLocaleString('es-ES', {
          dateStyle: 'full',
          timeStyle: 'long'
        });
        timeLeft = formatTimeLeft((expTime - now) / 1000);
      }

      if (p.iat) {
        iatDate = new Date(p.iat * 1000).toLocaleString('es-ES', {
          dateStyle: 'full',
          timeStyle: 'long'
        });
      }
    } catch (e) {
      error = 'Payload inválido: ' + e.message;
      return;
    }

    signature = parts[2];
  }

  function clearAll() {
    token = '';
    header = '';
    payload = '';
    signature = '';
    error = '';
    expired = null;
    expDate = '';
    iatDate = '';
    timeLeft = '';
  }

  function copyText(text) {
    if (!text) return;
    navigator.clipboard.writeText(text);
  }

  $effect(() => {
    if (token.trim()) decode();
    else {
      header = '';
      payload = '';
      signature = '';
      error = '';
      expired = null;
      expDate = '';
      iatDate = '';
      timeLeft = '';
    }
  });
</script>

<div class="panel-header">
  <h2><i data-lucide="key-round"></i> JWT Decoder</h2>
  <p>Decodifica tokens JWT y visualiza header, payload y firma. Todo en el navegador.</p>
</div>

<label for="jwt-input">Token JWT</label>
<textarea
  id="jwt-input"
  bind:value={token}
  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
  rows="4"
></textarea>

{#if error}
  <div class="output" style="color: var(--error, #e74c3c); border-color: var(--error, #e74c3c);">{error}</div>
{/if}

{#if header}
  {#if expired !== null}
    <div class="output" style="border-left: 4px solid {expired ? 'var(--error, #e74c3c)' : 'var(--success, #2ecc71)'}; padding: 10px 14px;">
      <strong>{expired ? 'Token expirado' : 'Token vigente'}</strong>
      {#if expDate}
        <br><span style="opacity:0.8">Expira: {expDate}</span>
      {/if}
      {#if timeLeft}
        <br><span style="opacity:0.8">Tiempo restante: {timeLeft}</span>
      {/if}
      {#if iatDate}
        <br><span style="opacity:0.8">Emitido: {iatDate}</span>
      {/if}
    </div>
  {/if}

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:12px;">
    <div>
      <label for="jwt-header">Header</label>
      <textarea id="jwt-header" readonly value={header} rows="8" style="font-family:monospace;font-size:0.85rem;"></textarea>
      <button class="btn btn-green" onclick={() => copyText(header)} style="margin-top:6px;">
        <i data-lucide="copy"></i> Copiar
      </button>
    </div>
    <div>
      <label for="jwt-payload">Payload</label>
      <textarea id="jwt-payload" readonly value={payload} rows="8" style="font-family:monospace;font-size:0.85rem;"></textarea>
      <button class="btn btn-green" onclick={() => copyText(payload)} style="margin-top:6px;">
        <i data-lucide="copy"></i> Copiar
      </button>
    </div>
  </div>

  <label for="jwt-signature" style="margin-top:12px;">Signature</label>
  <input type="text" id="jwt-signature" readonly value={signature} style="font-family:monospace;font-size:0.82rem;">
  <button class="btn btn-green" onclick={() => copyText(signature)} style="margin-top:6px;">
    <i data-lucide="copy"></i> Copiar firma
  </button>
{/if}

<div class="btn-row" style="margin-top:16px;">
  <button class="btn btn-quiet" onclick={clearAll}>
    <i data-lucide="eraser"></i> Limpiar
  </button>
</div>
