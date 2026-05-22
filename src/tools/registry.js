export const toolSections = [
  {
    "id": "texto",
    "title": "Texto",
    "tools": [
      {
        "id": "text",
        "icon": "text",
        "name": "Transformar Texto",
        "description": "Transforma texto"
      },
      {
        "id": "findreplace",
        "icon": "search",
        "name": "Buscar y Reemplazar",
        "description": "Encuentra y reemplaza texto"
      },
      {
        "id": "lorem",
        "icon": "file-text",
        "name": "Lorem Ipsum",
        "description": "Texto de prueba"
      },
      {
        "id": "markdown",
        "icon": "file-text",
        "name": "Markdown",
        "description": "Vista previa MD"
      },
      {
        "id": "case",
        "icon": "case-sensitive",
        "name": "Casos",
        "description": "Convierte nomenclatura"
      },
      {
        "id": "diff",
        "icon": "git-compare",
        "name": "Comparar",
        "description": "Compara textos"
      },
      {
        "id": "password",
        "icon": "lock",
        "name": "Contraseñas",
        "description": "Genera contraseñas seguras"
      },
      {
        "id": "passcheck",
        "icon": "shield",
        "name": "Fortaleza",
        "description": "Evalúa contraseñas"
      }
    ]
  },
  {
    "id": "imagen",
    "title": "Imagen",
    "tools": [
      {
        "id": "qr",
        "icon": "qr-code",
        "name": "Código QR",
        "description": "Genera códigos QR"
      },
      {
        "id": "image",
        "icon": "image",
        "name": "Imagen Base64",
        "description": "Convierte a Base64"
      },
      {
        "id": "ascii",
        "icon": "image",
        "name": "ASCII",
        "description": "Imagen a arte ASCII"
      }
    ]
  },
  {
    "id": "codigo",
    "title": "Código / Datos",
    "tools": [
      {
        "id": "json",
        "icon": "braces",
        "name": "JSON",
        "description": "Formatea y minifica"
      },
      {
        "id": "html",
        "icon": "code",
        "name": "HTML Escape",
        "description": "Escapa caracteres"
      },
      {
        "id": "htmlpreview",
        "icon": "monitor",
        "name": "HTML Preview",
        "description": "Vista previa HTML"
      },
      {
        "id": "regex",
        "icon": "search",
        "name": "Regex",
        "description": "Expresiones regulares"
      },
      {
        "id": "hash",
        "icon": "fingerprint",
        "name": "Hash",
        "description": "SHA-1 SHA-256 SHA-512"
      },
      {
        "id": "uuid",
        "icon": "hash",
        "name": "UUID",
        "description": "Identificadores únicos"
      },
      {
        "id": "bases",
        "icon": "divide",
        "name": "Bases Numéricas",
        "description": "Bin/Oct/Dec/Hex"
      },
      {
        "id": "ffmpeg",
        "icon": "video",
        "name": "FFmpeg",
        "description": "Comandos ffmpeg"
      }
    ]
  },
  {
    "id": "css",
    "title": "CSS / Diseño",
    "tools": [
      {
        "id": "color",
        "icon": "palette",
        "name": "Colores",
        "description": "Conversor HEX RGB HSL"
      },
      {
        "id": "harmony",
        "icon": "swatch-book",
        "name": "Armonía",
        "description": "Generador de armonías"
      },
      {
        "id": "contrast",
        "icon": "contrast",
        "name": "Contraste",
        "description": "Checador WCAG"
      },
      {
        "id": "gradient",
        "icon": "droplets",
        "name": "Gradientes",
        "description": "Gradientes CSS"
      },
      {
        "id": "boxshadow",
        "icon": "square",
        "name": "Box Shadow",
        "description": "Genera sombras CSS"
      }
    ]
  },
  {
    "id": "utilidades",
    "title": "Tiempo / Utilidades",
    "tools": [
      {
        "id": "unit",
        "icon": "ruler",
        "name": "Unidades",
        "description": "Conversor"
      },
      {
        "id": "random",
        "icon": "dice-5",
        "name": "Aleatorios",
        "description": "Números aleatorios"
      },
      {
        "id": "timestamp",
        "icon": "clock",
        "name": "Timestamp",
        "description": "Fecha y timestamp"
      },
      {
        "id": "timer",
        "icon": "timer",
        "name": "Cronómetro",
        "description": "Crono y cuenta atrás"
      },
      {
        "id": "notes",
        "icon": "notebook",
        "name": "Notas",
        "description": "Notas guardadas"
      }
    ]
  },
  {
    "id": "archivos",
    "title": "Archivos",
    "tools": [
      {
        "id": "pdf",
        "icon": "archive",
        "name": "Comprimir PDF",
        "description": "Reduce tamaño de PDFs"
      },
      {
        "id": "pdf-merge",
        "icon": "files",
        "name": "Unir PDFs",
        "description": "Combina varios PDFs"
      },
      {
        "id": "pdf-split",
        "icon": "scissors",
        "name": "Dividir PDF",
        "description": "Extrae páginas"
      },
      {
        "id": "pdf-img2pdf",
        "icon": "image-plus",
        "name": "Imágenes a PDF",
        "description": "Crea PDF desde imágenes"
      },
      {
        "id": "pdf-pdf2img",
        "icon": "images",
        "name": "PDF a Imágenes",
        "description": "Convierte páginas a PNG"
      },
      {
        "id": "pdf-rotate",
        "icon": "rotate-cw",
        "name": "Rotar PDF",
        "description": "Gira páginas del PDF"
      },
      {
        "id": "pdf-remove",
        "icon": "trash-2",
        "name": "Eliminar Páginas",
        "description": "Borra páginas del PDF"
      },
      {
        "id": "pdf-text",
        "icon": "type",
        "name": "Extraer Texto",
        "description": "Extrae texto del PDF"
      }
    ]
  }
];

export const tools = toolSections.flatMap((section) => section.tools);
