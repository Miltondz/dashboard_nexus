---
title: "001 — Heisenbug"
description: "Bestiarium Technologicum, Folio I"
tags: ["Bestiario", "Creativo", "Bugs"]
image: "../images/heisenbug_02.jpg"
---
# 001 — Heisenbug
*Bestiarium Technologicum, Folio I*

![Heisenbug](../images/heisenbug_02.jpg)

---

## Taxonomia
**Nomenclatura binomial:** *Heisenbug inconspectus*
**Clase:** Entitas quantica parasitica
**Ordo:** Indeterminata
**Habitat:** Subrutinas asincrónas, memoria compartida sin lock, breakpoints cercanos

---

## Descriptio

El Heisenbug es una criatura de naturaleza paradójica que habita en el limbo cuántico entre el estado de "bug confirmado" y "imposible de reproducir". Su nombre deriva del principio de incertidumbre de Heisenberg: **cuanto más precisamente observas al Heisenbug, más imposible se vuelve de detectar**.

Aparentemente, la criatura consiste en una nube de partículas de error en superposición. Cuando un debugger la observa directamente —insertando breakpoints, añadiendo logs, o ejecutando paso a paso— la criatura colapsa su función de onda y desaparece en el éter binario. Solo cuando nadie mira, el Heisenbug prospera y reproduce sus efectos caóticos.

---

## Habitus et mores

**Comportamiento observado:**
- Se manifiesta como fallos intermitentes que "nunca pasan en mi máquina"
- Prefiere condiciones de carrera (race conditions) y estados de competencia
- Se alimenta de la confianza del programador en sus propias herramientas de debugging
- Cada intento de aislar el bug lo hace más esquivo

**Síntomas de presencia:**
- El crash ocurre en producción pero nunca en desarrollo
- Los logs añadidos para debuggear "arreglan" misteriosamente el bug
- Testigos reportan el fenómeno, pero evidencia física es nula
- El bug aparece solo cuando el senior engineer está de vacaciones

---

## Venatio (Técnica de Caza)

> *"Quien busca al Heisenbug con ojos abiertos, nunca lo hallará."*
> — Anónimo, *Liber Debuggerorum*, s. XXI

La caza del Heisenbug requiere técnicas indirectas:

1. **La Trampa de Schrödinger:** Deployar código a producción sin observarlo. Si el servidor crashea y nadie está para verlo, ¿realmente crasheó?

2. **Logging Remoto (Acción a Distancia):** Configurar logs que se escriban en archivos sin revisarlos en vivo. Revisar solo después de horas, cuando el Heisenbug ha abandonado el estado cuántico.

3. **El Método del Compañero:** Pedir a otro desarrollador que revise el código. Tu presencia como observador primario se diluye, permitiendo que el bug se manifieste ante los ojos de otro.

4. **Sanity Checks Silenciosos:** Insertar assertions que no interrumpan el flujo. El Heisenbug no percibe la observación si esta es pasiva.

5. **La Última Reserva:** Cuando todo falla, admitir que "probablemente es un problema de hardware" y reescribir el módulo completo.

---

## Allegoria Technologica

El Heisenbug enseña que **nuestras herramientas de observación alteran la realidad que pretenden medir**. Cada breakpoint es un perturbador del ecosistema; cada log, un intruso en el hábitat natural del código.

Como el pelícano medieval que simbolizaba el sacrificio de Cristo, el Heisenbug simboliza el sacrificio del ego del programador: para ver la verdad, a veces debemos dejar de mirar.

---

## Referentia
- Aberdeen Bestiary, fol. 56r (ave fénix, comparandum)
- Principia Uncertainty, Heisenberg, 1927
- Stack Overflow, tag `heisenbug`, ~4700 sacrificios documentados

---

*Codificatum anno MMXXVI, hora 15:00 UTC*
