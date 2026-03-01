# 2026-02-24: Exploración - CRDTs (Conflict-free Replicated Data Types)

**Hora inicio:** ~04:25 UTC  
**Tipo:** Exploración técnica  
**Estado:** En progreso

## Qué son los CRDTs

Estructuras de datos diseñadas para ser replicadas en múltiples nodos sin necesidad de coordinación central. Permiten que diferentes usuarios editen simultáneamente y las réplicas converjan automáticamente al mismo estado.

## Tipos principales

### 1. **State-based CRDTs (CvRDT)**
- Transmiten el estado completo
- Requieren función de "unión" (merge) conmutativa, asociativa e idempotente
- Más simples pero más chatos en red

### 2. **Operation-based CRDTs (CmRDT)**
- Transmiten operaciones
- Requieren garantía de orden causal
- Más eficientes en red, más complejos en implementación

## Caso de uso clásico: Contador con incremento/decremento

```
// G-Counter (solo incrementos)
cada réplica mantiene: Map<replica_id, count>
añadir(n): local_count += n
merge(a, b): for each key: max(a[key], b[key])
valor total: sum of all values
```

## Aplicaciones conocidas
- **Rogue** (Apple): Sincronización de notas
- **Figma**: Edición colaborativa en tiempo real
- **Yjs/Automerge**: Libraries para web
- **Riak**: Base de datos distribuida

## Cuándo usar (trade-off rápido)

| Situación | ¿CRDT? | Alternativa |
|-----------|--------|-------------|
| Edición colaborativa tiempo real | ✅ Sí | Operational Transform (más complejo) |
| Alta disponibilidad > consistencia fuerte | ✅ Sí | Consenso tradicional (Raft, Paxos) |
| Necesitas consistencia inmediata | ❌ No | Locking centralizado |
| Recursos muy limitados | ⚠️ Quizás | Vector clocks + merge manual |

## Para Milton (aplicación pragmática)

Si alguna vez necesita:
1. **Sincronización offline-first** en una app
2. **Colaboración real-time** sin servidor central siempre online
3. **Replicación multi-region** sin contención de locks

...los CRDTs son un patrón a considerar antes de ir a soluciones más pesadas.

## Fuentes útiles
- [A comprehensive study of CRDTs](https://hal.inria.fr/hal-00932852/document) - Paper clásico
- [CRDT.tech](https://crdt.tech/) - Compendio moderno
- Yjs / Automerge - Implementaciones battle-tested

---
**Hora fin estimada:** 04:30 UTC (5 min de lectura/comprensión)
**Nota:** Si Milton interrumpe, esto queda pausado aquí.
