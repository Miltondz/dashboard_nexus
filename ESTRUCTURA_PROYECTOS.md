# 📂 Guía de Estructura de Proyectos e Indexación (Para el Agente)

Este documento define las reglas estrictas de organización de archivos dentro del directorio `projects/`. 
**Agente Nexus / OpenClaw:** Debes seguir **exactamente** estas convenciones al crear, mover o actualizar proyectos, historias, notas e investigaciones para garantizar que el `indexer.js` las lea correctamente y las muestre en el Dashboard V5.

---

## 1. Reglas Generales de Indexación

El indexador automático escudriñará recursivamente cualquier archivo `.md` dentro de `projects/`. Para que la indexación sea óptima, **todos** los archivos Markdown deben contener un bloque de metadatos YAML (`front-matter`) en la parte superior.

### Plantilla Obligatoria de Front-Matter
```yaml
---
title: "Título del Proyecto o Nota"
description: "Breve descripción de 1 o 2 líneas sobre el contenido."
tags: ["Etiqueta1", "Etiqueta2"]
---
```
* **Nota sobre Tags**: Los tags definen el color y filtro en la vista del dashboard. Usa siempre formatos limpios (ej. `Creativo`, `Investigación`, `IA`, `Bugs`, `Desarrollo`).

---

## 2. Tipos de Estructuras

Dependiendo del tipo de contenido que generes o gestiones, debes seguir una de estas tres arquitecturas de carpetas:

### A. Proyectos Complejos o Relatos (Con Imágenes asociadas)
Si un texto, historia o proyecto de código requiere imágenes, diagramas de arquitectura o arte propio, **se debe encapsular todo en una carpeta única**.
El indexador buscará automáticamente cualquier imagen (`.jpg`, `.png`, `.webp`) que viva al lado del Markdown y la enlazará como "Artefacto" y miniatura (thumbnail) de la tarjeta.

**Estructura:**
```text
projects/
└── categoria_principal/ (ej. personal/relatos/)
    └── nombre-del-proyecto/
        ├── historia.md      <-- Contiene el front-matter y el texto
        ├── illus_01.jpg     <-- Imagen que se escaneará automáticamente
        └── illus_02.png     <-- Otra imagen automática
```

### B. Notas de Investigación y Entradas Únicas (Sin Imágenes)
Si estás creando un registro técnico, tomando notas rápidas o generando documentación pura, **no es necesario crear una subcarpeta**. El archivo `.md` puede vivir suelto dentro de su categoría lógica.

**Estructura:**
```text
projects/
└── categoria_principal/ (ej. automejora/notas_investigacion/)
    ├── 2026-02-24-exploracion-crdts.md
    ├── 2026-02-24-inicio-sistema.md
    └── analisis-rendimiento-llm.md
```

### C. Archivos de Arte o "Galería Suelta" (Opcional)
Si el usuario te envía o genera imágenes puras sin una historia concreta que las ate pero quieres indexarlas en el Dashboard:
1. Deberás crear un `.md` ligero que sirva como "contenedor" en la BD.
2. Tirar las imágenes junto a él.

**Estructura:**
```text
projects/
└── personal/
    └── galeria-bocetos/
        ├── contenedor-bocetos.md  <-- Markdown muy breve (Solo título y tags)
        ├── sketch_01.jpg
        └── sketch_02.png
```

---

## 3. Flujo Correcto de Escritura para el Agente

Cuando el usuario (ej. Milton) te pida "Comienza una nueva historia sobre X y añádele las 2 imágenes que generamos":
1. **Crear Directorio:** `mkdir projects/personal/relatos/nueva-historia-x`
2. **Crear Markdown:** Escribir el front-matter con los `tags: ["Creativo", "Ficción"]` en el interior de `historia.md` (o `nueva-historia-x.md`).
3. **Mover Imágenes:** Mover o descargar los `.jpg` o `.png` requeridos directamente **dentro del directorio creado en el paso 1**.
4. ¡Terminado! No intervengas en SQLite, el `indexer.js` y el Dashboard V5 detectarán automáticamente todo y enlazarán las imágenes a la galería web.
