# Tamaño recomendado para ilustraciones (portada y escenas)

La web muestra la misma imagen en **móvil/tablet** y **PC**, pero con **recortes distintos** (CSS). Por eso conviene elegir un formato “base” y saber qué pasa en cada pantalla.

## Cómo se muestra hoy (resumen)

| Pantalla | Caja aproximada | Comportamiento |
|----------|-----------------|----------------|
| **Móvil / tablet** (≤1024px) | **16:9**, alto máx. **~240px**, ancho hasta **~720px** | `object-fit: **cover**` → rellena el 16:9 y puede **recortar** bordes |
| **PC** (≥1025px) | **Cuadrado**, máx. **380×380px** (aprox.) | `object-fit: **contain**` → se ve **toda** la imagen; pueden quedar **bandas** si no es cuadrada |

Área útil aproximada en pantalla:

- **Móvil:** ~360–400px de ancho × hasta **240px** de alto (16:9).
- **PC:** hasta **380×380px** (cuadrado).

---

## Opción A (recomendada para la mayoría): imagen **cuadrada**

Exportar las ilustraciones en **proporción 1:1**.

| Uso | Tamaño en píxeles | Notas |
|-----|-------------------|--------|
| **Mínimo** | **800 × 800** | Suficiente para pantallas normales |
| **Recomendado** | **1200 × 1200** o **1600 × 1600** | Se ve nítida en tablets y monitores |
| **Máximo razonable** | **2048 × 2048** | Solo si necesitas mucho detalle; comprime bien el archivo |

- En **PC** encaja bien (contain dentro del cuadrado).
- En **móvil/tablet** el recuadro es **16:9** con `cover`: se **recorta** arriba/abajo o los lados para llenar; el centro suele verse bien si la composición no pone lo importante en los bordes.

**Consejo de composición:** deja un poco de “aire” alrededor del personaje o foco principal para que un recorte 16:9 no lo corte.

---

## Opción B: priorizar móvil con **16:9**

Si te importa más cómo se ve en **celular/tablet**:

| Tamaño | Notas |
|--------|--------|
| **1280 × 720** (HD) | Buen equilibrio peso/calidad |
| **1920 × 1080** (Full HD) | Muy nítido; comprime (WebP/JPEG) |

- En **móvil** encaja la proporción nativa.
- En **PC** el cuadrado usa **contain**: verás **bandas** arriba/abajo (o laterales) si la imagen no es cuadrada; no se recorta.

---

## Formato de archivo

- **WebP** (preferible) o **JPEG** para fotos/ilustraciones con muchos colores.
- **PNG** si necesitas transparencia (suele pesar más).
- Objetivo de peso: **~150–400 KB por imagen** en web (ajusta calidad); menos en móvil = carga más rápida.

---

## Resumen en una frase

**Lo más versátil para tu app actual:** exportar **cuadradas 1200×1200 px** (o 1600×1600), composición con margen alrededor del sujeto, en **WebP** o JPEG optimizado.

Si quieres un solo número para “master”: **1200 × 1200 px, cuadrado, WebP.**
