<script>
	import { activeTool } from '../tools/activeTool.svelte.js';

	var asciiPresets={standard:' .:-=+*#%@',blocks:' ░▒▓█',detailed:" .'`^\":;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",minimal:' ░█',braille:' ⣀⣄⣆⣇⣏⣟⣿'};
	var asciiImageData=null;
	var bayerMatrix=[[0,32,8,40,2,34,10,42],[48,16,56,24,50,18,58,26],[12,44,4,36,14,46,6,38],[60,28,52,20,62,30,54,22],[3,35,11,43,1,33,9,41],[51,19,59,27,49,17,57,25],[15,47,7,39,13,45,5,37],[63,31,55,23,61,29,53,21]];

	function asciiDrop(e){e.preventDefault();e.currentTarget.style.borderColor='#d8c8b8';e.currentTarget.style.background='transparent';var files=e.dataTransfer.files;if(files.length>0){document.getElementById('ascii-file').files=files;processAsciiImage();}}

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

	function handleDropzoneClick(){document.getElementById('ascii-file').click();}

	function handlePreviewClick(){document.getElementById('ascii-file').click();}

	function handlePickerKeydown(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();document.getElementById('ascii-file').click();}}

	function handleTypeChange(e){document.getElementById('ascii-custom-section').style.display=e.currentTarget.value==='custom'?'block':'none';if(asciiImageData)generateAscii();}
</script>

{#if activeTool.id === 'ascii'}
<div class="tool-panel" id="panel-ascii">
	<div class="panel-header">
		<h2><i data-lucide="image"></i> Generador ASCII Pro</h2>
		<p>Convierte imágenes a arte ASCII con muestreo por área, dithering y color</p>
	</div>
	<div id="ascii-dropzone" role="button" tabindex="0" aria-controls="ascii-file" style="border:2px dashed var(--dropzone-border);border-radius:12px;padding:30px;text-align:center;color:var(--muted);cursor:pointer;transition:all .2s" ondragover={e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }} ondragleave={e => { e.currentTarget.classList.remove('drag-over'); }} ondrop={e => { e.currentTarget.classList.remove('drag-over'); asciiDrop(e); }} onclick={handleDropzoneClick} onkeydown={handlePickerKeydown}>
		<i data-lucide="upload-cloud" style="width:32px;height:32px;margin-bottom:8px"></i>
		<div style="font-weight:600;font-size:.9rem">Arrastra una imagen aquí</div>
		<div style="font-size:.75rem;margin-top:4px">o haz clic para seleccionar</div>
		<input type="file" id="ascii-file" accept="image/*" style="display:none" onchange={processAsciiImage}>
	</div>
	<div id="ascii-preview" role="button" tabindex="0" aria-controls="ascii-file" style="margin-top:12px;max-width:100%;display:none" onclick={handlePreviewClick} onkeydown={handlePickerKeydown}><img id="ascii-preview-img" alt="Vista previa de la imagen ASCII" style="max-width:100%;max-height:200px;border-radius:8px;display:block"></div>
	<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px">
		<div>
			<label for="ascii-type">Tipo de caracteres</label>
			<select id="ascii-type" onchange={handleTypeChange}>
				<option value="standard">Standard</option>
				<option value="blocks">Bloques</option>
				<option value="detailed">Detallado</option>
				<option value="minimal">Minimal</option>
				<option value="braille">Braille</option>
				<option value="custom">Personalizado</option>
			</select>
		</div>
		<div>
			<label for="ascii-width">Ancho: <span id="ascii-width-val">100</span></label>
			<input type="range" id="ascii-width" min="30" max="240" value="100" oninput={e => { document.getElementById('ascii-width-val').textContent = e.currentTarget.value; generateAscii(); }}>
		</div>
	</div>
	<div id="ascii-custom-section" style="display:none;margin-top:8px">
		<label for="ascii-custom-chars">Caracteres personalizados (oscuro → claro)</label>
		<input type="text" id="ascii-custom-chars" value="@%#*+=-:. " oninput={generateAscii}>
	</div>
	<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px">
		<div>
			<label for="ascii-contrast">Contraste: <span id="ascii-contrast-val">1.0</span></label>
			<input type="range" id="ascii-contrast" min="0.5" max="3" step="0.1" value="1" oninput={e => { document.getElementById('ascii-contrast-val').textContent = e.currentTarget.value; generateAscii(); }}>
		</div>
		<div>
			<label for="ascii-brightness">Brillo: <span id="ascii-brightness-val">0</span></label>
			<input type="range" id="ascii-brightness" min="-100" max="100" value="0" oninput={e => { document.getElementById('ascii-brightness-val').textContent = e.currentTarget.value; generateAscii(); }}>
		</div>
	</div>
	<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px">
		<div>
			<label for="ascii-ratio">Ratio pixel: <span id="ascii-ratio-val">0.50</span></label>
			<input type="range" id="ascii-ratio" min="0.30" max="0.70" step="0.02" value="0.50" oninput={e => { document.getElementById('ascii-ratio-val').textContent = parseFloat(e.currentTarget.value).toFixed(2); generateAscii(); }}>
		</div>
		<div>
			<label for="ascii-spacing">Espaciado: <span id="ascii-spacing-val">1.00</span></label>
			<input type="range" id="ascii-spacing" min="0.70" max="1.80" step="0.05" value="1.00" oninput={e => { document.getElementById('ascii-spacing-val').textContent = parseFloat(e.currentTarget.value).toFixed(2); generateAscii(); }}>
		</div>
	</div>
	<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px">
		<div>
			<label for="ascii-dither">Dithering</label>
			<select id="ascii-dither" onchange={generateAscii}>
				<option value="none">Ninguno</option>
				<option value="floyd">Floyd-Steinberg</option>
				<option value="ordered">Ordenado (Bayer)</option>
			</select>
		</div>
	</div>
	<div style="display:flex;gap:16px;margin-top:12px">
		<div class="checkbox-row"><input type="checkbox" id="ascii-invert" onchange={generateAscii}><label for="ascii-invert">Invertir</label></div>
		<div class="checkbox-row"><input type="checkbox" id="ascii-color" onchange={generateAscii}><label for="ascii-color">Color</label></div>
		<div class="checkbox-row"><label for="ascii-bg-color" style="margin:0">Fondo</label><input type="color" id="ascii-bg-color" value="#000000" onchange={generateAscii} style="width:44px;height:32px;padding:2px;border-radius:8px;border:1.5px solid var(--line);cursor:pointer"></div>
	</div>
	<div class="btn-row">
		<button class="btn" onclick={copyAscii}><i data-lucide="copy"></i> Copiar</button>
		<button class="btn" onclick={downloadAsciiText}><i data-lucide="file-text"></i> TXT</button>
		<button class="btn btn-green" onclick={downloadAscii}><i data-lucide="download"></i> PNG</button>
	</div>
	<pre id="ascii-output" style="font-family:monospace;font-size:5px;line-height:5px;white-space:pre;overflow-x:auto;background:#000000;color:#ffffff;padding:12px;border-radius:8px;margin-top:10px;display:none"></pre>
	<canvas id="ascii-canvas" style="display:none"></canvas>
</div>
{/if}
