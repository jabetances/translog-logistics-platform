# TransLog — sistema de logística

Monorepo para la prueba técnica: API NestJS + PostgreSQL y frontend Angular standalone con Angular Material.

## Arranque rápido (Docker)

1. Copia `.env.example` a `.env` y cambia `DB_PASSWORD`, `JWT_SECRET` y `BOOTSTRAP_SUPERVISOR_PASSWORD` por valores propios.
2. Ejecuta `docker compose up --build` en la raíz.
3. Abre `http://localhost:4200`, Swagger en `http://localhost:3000/api/docs`.
4. Inicia sesión usando el correo y contraseña configurados como bootstrap supervisor.

La base de datos crea sus tablas automáticamente solo en este entorno de desarrollo (`DB_SYNCHRONIZE=true`). En producción se debe desactivar y usar migraciones.

## Ejecución local sin contenedores

- Si PostgreSQL está instalado en Ubuntu: crea el usuario y la base con `sudo -u postgres createuser --pwprompt translog` y `sudo -u postgres createdb --owner=translog translog`. Elige una contraseña local y pon exactamente esa en `DB_PASSWORD` del archivo `backend/.env`.
- En `backend/`, ejecuta `cp .env.example .env`; cambia `DB_PASSWORD`, `JWT_SECRET` y las credenciales `BOOTSTRAP_SUPERVISOR_*`. Mantén `DB_HOST=localhost` y `DB_SYNCHRONIZE=true` solo para desarrollo. Luego `npm ci && npm run start:dev`.
- En otra terminal, dentro de `frontend/`, ejecuta `npm ci && npm start`.
- Alternativamente, con Docker: `docker compose up -d postgres`, configura `backend/.env` con `DB_HOST=localhost` y sigue los dos pasos de ejecución anteriores.

## API

- `POST /api/auth/login` — JWT.
- `POST /api/auth/register` — solo supervisor autenticado.
- `GET /api/users` — listado de usuarios (solo supervisor); nunca devuelve contraseñas ni hashes.
- `PATCH /api/users/:id` — actualizar nombre, correo o rol (solo supervisor); no permite cambiar el propio rol ni degradar al último supervisor. La contraseña no se modifica desde esta operación.
- `DELETE /api/users/:id` — eliminar usuarios sin envíos/eventos asociados; protege la cuenta activa y al último supervisor.
- `POST /api/shipments`, `GET /api/shipments?page=1&limit=20&status=IN_WAREHOUSE&q=texto&sortBy=createdAt&sortDirection=DESC`, `GET /api/shipments/:id`. La lista admite filtro por estado, búsqueda por código/destinatario/dirección/teléfono y orden por código, destinatario, destino, estado o fecha.
- `PATCH /api/shipments/:id/status`, `DELETE /api/shipments/:id`.
- `POST /api/shipments/assign-vehicles` — First Fit Decreasing; todos deben existir y estar IN_WAREHOUSE.
- `GET /api/tracking/:trackingCode` — público.

## Modelo y decisiones

`User` representa operador/supervisor; `Shipment` contiene estado actual, peso y datos de entrega; `ShipmentEvent` conserva el historial con responsable, fecha, ubicación y notas. `Shipment.createdById` y `ShipmentEvent.actorId` tienen relaciones y FK a `User` con borrado restrictivo; la vista interna muestra nombres de responsables, mientras el tracking público no los revela. Los cambios de estado corren dentro de transacciones y bloquean la fila para prevenir carreras. El endpoint público no revela identificadores ni usuarios internos.

El listado valida sus parámetros mediante `ListShipmentsQueryDto` (`page` entero positivo, `limit` de 1 a 100, filtros/orden permitidos y búsqueda de hasta 100 caracteres). El `numeric(10,3)` de PostgreSQL se transforma a `number` en la API. El código público de tracking se normaliza a mayúsculas; la proyección pública omite los responsables.

En desarrollo, el `.env.example` activa `DB_SYNCHRONIZE` y usa el esquema `public`. Para arrancar desde una base vacía sin sincronización, configura `DB_SYNCHRONIZE=false` y `DB_MIGRATIONS_RUN=true`: `InitialSchema`, generada con `typeorm migration:generate` desde las entidades, crea tablas, tipos, índices y FKs. Si detecta el esquema completo que creó `synchronize`, lo adopta y registra la migración sin duplicar restricciones; ante un esquema parcial/incompatible, aborta sin tocarlo. La CLI usa `src/data-source.ts`; `npm run migration:generate` genera cambios futuros y `npm run migration:run` los aplica. `InitialSchema` no se revierte automáticamente para evitar borrar datos de un esquema adoptado.

Los estados internos son `CREATED`, `IN_WAREHOUSE`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `RETURNED` y `CANCELLED`. La interpretación aplicada es: `CREATED → IN_WAREHOUSE → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED`; se puede cancelar antes de entregar y registrar `RETURNED` desde almacén, tránsito o reparto cuando el paquete vuelve al remitente. `RETURNED → CANCELLED` cierra administrativamente esa devolución. `DELIVERED` y `CANCELLED` son terminales. Las transiciones se validan en el dominio y cada cambio conserva un evento.

El componente de fecha del código `ENV-AAAAMMDD-XXXX` usa el calendario de `Europe/Madrid`; así no cambia al día anterior por convertir primero a UTC. Los reintentos de creación se limitan a colisiones PostgreSQL `23505` y a cinco intentos; otros errores de infraestructura se propagan inmediatamente.

La tabla de envíos usa Angular Material `mat-table` y `mat-paginator` con etiquetas en español. Los errores HTTP muestran un `MatSnackBar` además del mensaje contextual de cada pantalla.

First Fit Decreasing (FFD) ordena los paquetes de mayor a menor peso y coloca cada uno en el primer vehículo con espacio disponible. No es óptimo global; tiene complejidad sencilla y da una solución determinista para el caso.

## Verificación

- Backend: `cd backend && npm test && npm run build && npm run lint`.
- HTTP e2e aislado (sin base de datos): `cd backend && npm run test:e2e`.
- Frontend: `cd frontend && npm run build`.
- Datos seed: el supervisor se crea al iniciar solo si se definen `BOOTSTRAP_SUPERVISOR_EMAIL` y `BOOTSTRAP_SUPERVISOR_PASSWORD` y aún no hay supervisor.

## Seguridad / límites

No usar credenciales de ejemplo en un entorno público; secretos por variables de entorno. JWT en localStorage por simplicidad de la prueba (en producción valorar cookies httpOnly/CSP). `synchronize` solo para desarrollo. La vista pública solo devuelve tracking necesario.