# miyu-herramientas

Coleccion de utilidades web ejecutadas completamente en el navegador.

## Desarrollo

```bash
pnpm install
pnpm run dev
```

## Build de produccion

```bash
pnpm run build
pnpm run preview
```

El resultado desplegable se genera en `dist/`.

## Estructura

```text
.
├── index.html
├── src/
│   ├── app/
│   │   ├── App.svelte
│   │   ├── AppHeader.svelte
│   │   ├── LegacyPanels.svelte
│   │   └── Sidebar.svelte
│   ├── legacy/
│   │   └── panels.js
│   ├── scripts/
│   │   └── app.js
│   └── styles/
│       └── main.css
│   ├── tools/
│   │   └── registry.js
│   └── main.js
├── package.json
└── utilidades.html
```

`utilidades.html` se conserva como entrada de compatibilidad y redirige a `index.html`.

La app usa Svelte + Vite como SPA estatica. No requiere backend: las herramientas corren en el navegador y el build final se publica desde `dist/`.
