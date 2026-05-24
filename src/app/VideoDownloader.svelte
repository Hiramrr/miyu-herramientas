<script>
  let url = '';
  let format = 'mp4';
  let quality = 'best';
  let filename = '%(title)s.%(ext)s';
  let playlist = false;
  let command = '';
  let error = '';

  function shellQuote(value) {
    return "'" + String(value).replace(/'/g, "'\\''") + "'";
  }

  function outputTemplate() {
    return filename.trim() || '%(title)s.%(ext)s';
  }

  function generateVideoDownload() {
    const cleanUrl = url.trim();
    error = '';

    if (!cleanUrl) {
      command = '';
      return;
    }

    try {
      const parsed = new URL(cleanUrl);
      if (!/^https?:$/.test(parsed.protocol)) {
        throw new Error('URL invalida');
      }
    } catch (e) {
      command = '';
      error = 'Pega una URL valida de YouTube, TikTok u otro sitio compatible con yt-dlp.';
      return;
    }

    const args = ['yt-dlp', '--no-warnings'];
    if (!playlist) args.push('--no-playlist');

    if (format === 'audio') {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
    } else if (format === 'mp4') {
      if (quality === 'best') {
        args.push('-f', 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best');
      } else {
        args.push('-f', 'bv*[height<=' + quality + '][ext=mp4]+ba[ext=m4a]/b[height<=' + quality + '][ext=mp4]/best[height<=' + quality + ']');
      }
      args.push('--merge-output-format', 'mp4');
    } else {
      args.push('-f', quality === 'best' ? 'bestvideo+bestaudio/best' : 'bestvideo[height<=' + quality + ']+bestaudio/best[height<=' + quality + ']');
    }

    args.push('-o', outputTemplate(), cleanUrl);
    command = args.map((arg, index) => index === 0 ? arg : shellQuote(arg)).join(' ');
  }

  async function copyVideoDownload() {
    if (!command) generateVideoDownload();
    if (command) await navigator.clipboard.writeText(command);
  }

  async function copyInstallCommand(command) {
    await navigator.clipboard.writeText(command);
  }

  $: {
    url;
    format;
    quality;
    filename;
    playlist;
    generateVideoDownload();
  }
</script>

<div class="tool-panel" id="panel-video-download">
  <div class="panel-header">
    <h2><i data-lucide="download"></i> Descargar Video</h2>
    <p>Genera comandos yt-dlp para guardar videos de YouTube, TikTok y otros sitios compatibles</p>
  </div>

  <label for="vd-url">URL del video</label>
  <input id="vd-url" type="text" bind:value={url} placeholder="https://www.youtube.com/watch?v=...">

  <div class="video-download-grid">
    <div>
      <label for="vd-format">Formato</label>
      <select id="vd-format" bind:value={format}>
        <option value="mp4">Video MP4</option>
        <option value="audio">Solo audio MP3</option>
        <option value="best">Mejor calidad original</option>
      </select>
    </div>
    <div>
      <label for="vd-quality">Calidad</label>
      <select id="vd-quality" bind:value={quality}>
        <option value="best">Mejor disponible</option>
        <option value="1080">Hasta 1080p</option>
        <option value="720">Hasta 720p</option>
        <option value="480">Hasta 480p</option>
      </select>
    </div>
  </div>

  <label for="vd-name">Nombre de archivo</label>
  <input id="vd-name" type="text" bind:value={filename} placeholder="%(title)s.%(ext)s">

  <div class="checkbox-row">
    <input id="vd-playlist" type="checkbox" bind:checked={playlist}>
    <label for="vd-playlist">Permitir playlist completa</label>
  </div>

  <div class="btn-row">
    <button class="btn" type="button" on:click={generateVideoDownload}><i data-lucide="terminal"></i> Generar comando</button>
    <button class="btn btn-green" type="button" on:click={copyVideoDownload}><i data-lucide="copy"></i> Copiar</button>
  </div>

  <div class="output video-download-note">
    Necesitas tener yt-dlp instalado. Usalo solo con videos propios, con licencia abierta o con permiso para descargarlos.
  </div>

  <div class="output video-download-command" class:empty={!command && !error}>
    {#if error}
      {error}
    {:else if command}
      {command}
    {:else}
      Pega una URL para generar el comando.
    {/if}
  </div>

  <div class="video-download-tutorial">
    <div class="video-download-tutorial-head">
      <h3>Instalar yt-dlp</h3>
      <a href="https://github.com/yt-dlp/yt-dlp/wiki/Installation" target="_blank" rel="noreferrer">Guia oficial</a>
    </div>

    <div class="video-download-os-grid">
      <section class="video-download-os">
        <h4><i data-lucide="apple"></i> macOS</h4>
        <p>Opcion facil con Homebrew:</p>
        <button type="button" class="install-command" on:click={() => copyInstallCommand('brew install yt-dlp ffmpeg')}>
          <code>brew install yt-dlp ffmpeg</code>
          <i data-lucide="copy"></i>
        </button>
        <p>Verifica:</p>
        <code class="install-inline">yt-dlp --version</code>
      </section>

      <section class="video-download-os">
        <h4><i data-lucide="monitor"></i> Windows</h4>
        <p>Con Winget en PowerShell:</p>
        <button type="button" class="install-command" on:click={() => copyInstallCommand('winget install yt-dlp.yt-dlp Gyan.FFmpeg')}>
          <code>winget install yt-dlp.yt-dlp Gyan.FFmpeg</code>
          <i data-lucide="copy"></i>
        </button>
        <p>Alternativa: descarga <code>yt-dlp.exe</code> desde Releases y ponlo en una carpeta del PATH.</p>
      </section>

      <section class="video-download-os">
        <h4><i data-lucide="terminal"></i> Linux</h4>
        <p>Binario oficial en sistemas tipo Unix:</p>
        <button type="button" class="install-command" on:click={() => copyInstallCommand('sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && sudo chmod a+rx /usr/local/bin/yt-dlp')}>
          <code>sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && sudo chmod a+rx /usr/local/bin/yt-dlp</code>
          <i data-lucide="copy"></i>
        </button>
        <p>Instala FFmpeg con tu gestor, por ejemplo <code>sudo apt install ffmpeg</code>.</p>
      </section>

      <section class="video-download-os">
        <h4><i data-lucide="package"></i> Python / pipx</h4>
        <p>Buena opcion si ya usas Python:</p>
        <button type="button" class="install-command" on:click={() => copyInstallCommand('pipx install yt-dlp')}>
          <code>pipx install yt-dlp</code>
          <i data-lucide="copy"></i>
        </button>
        <p>Actualizar despues:</p>
        <code class="install-inline">yt-dlp -U</code>
      </section>
    </div>
  </div>
</div>
