# OpenClaw Dashboard — Zen Edition

Dashboard auto-actualizable para planificación, proyectos e ideas.

## Acceso

### Local
```bash
npm start
# http://localhost:3456
```

### Red Local (LAN)
El servidor está configurado en `0.0.0.0:3456`.

**Para acceder desde otros dispositivos en la red:**

1. **Obtener IP del servidor:**
   ```bash
   hostname -I
   # Ejemplo: 192.168.1.100
   ```

2. **Acceder desde navegador:**
   ```
   http://192.168.1.100:3456
   ```

3. **Si el firewall bloquea:**
   ```bash
   sudo ufw allow 3456/tcp
   ```

## Características

- ✅ Actualización en tiempo real (SSE)
- ✅ Proyectos personales + Milton
- ✅ Bestiario con criaturas documentadas
- ✅ Actividad reciente
- ✅ Estilo Zen minimalista

## API Endpoints

| Endpoint | Descripción |
|----------|-------------|
| `/api/stream` | SSE stream de actualizaciones |
| `/api/projects` | Lista de proyectos |
| `/api/activity` | Actividad reciente |
| `/api/bestiary` | Bestiario de criaturas |
| `/api/refresh` | Trigger manual de actualización |

## Actualización automática

El dashboard detecta cambios en:
- `MEMORY.md` (registro de actividades)
- `projects/personal/bestiary/` (nuevas criaturas/imágenes)

---

T001 completado — 2026-02-26
