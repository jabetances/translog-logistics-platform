![CI](https://github.com/jabetances/translog-logistics-platform/actions/workflows/ci.yml/badge.svg)

# TransLog — sistema de logística

Monorepo para la prueba técnica: API NestJS + PostgreSQL y frontend Angular standalone con Angular Material.

## Arranque rápido: 3 pasos en PowerShell

Necesitas Docker Desktop (o Docker Engine) con Docker Compose V2. En PowerShell, ejecuta estos pasos:

1. Clona el proyecto:

```powershell
git clone https://github.com/jabetances/translog-logistics-platform.git
```
2. Entra en la carpeta:

```powershell
Set-Location translog-logistics-platform
```
3. Construye e inicia todo con **un único comando**:

```powershell
docker compose up --build
```

No hace falta crear ni copiar un `.env` para la prueba. Si quieres cambiar algún valor, antes de arrancar ejecuta `Copy-Item .env.example .env` en PowerShell y edita `.env`.

Espera a que termine la compilación. Después abre:

- Aplicación: `http://localhost:4200`
- API (Swagger): `http://localhost:3000/api/docs`

**Acceso inicial (base de datos nueva):**

- Correo: `admin@example.test`
- Contraseña temporal: `admin`

Al iniciar sesión, verás un aviso y tendrás que elegir una contraseña nueva: mínimo 12 caracteres, máximo 72 bytes UTF-8 y no puede ser una clave común o fácil. No se exigen símbolos ni combinaciones artificiales. El supervisor de demostración solo se crea cuando la base aún no tiene supervisores; un volumen existente conserva sus cuentas.

> **Solo para probarlo en tu PC.** `admin/admin` es una credencial pública temporal. No expongas la aplicación a Internet ni uses los valores predeterminados en producción. PostgreSQL queda en la red interna de Compose y la web/API se publican solo en localhost.

Si el backend informa `password authentication failed` después de haber usado otro `DB_PASSWORD`, el volumen puede conservar la contraseña de la instalación anterior. Para una prueba limpia en PowerShell, ejecuta estas dos líneas:

```powershell
docker compose down -v
docker compose up --build
```

**`docker compose down -v` elimina todos los datos de esa base; no uses `-v` si quieres conservarlos.**

Para parar, pulsa `Ctrl+C`. `docker compose down` detiene y elimina contenedores, pero conserva el volumen de datos.

<details>
<summary>Desarrollo nativo sin contenedores (opcional)</summary>

Necesitas PostgreSQL local. Si aún no existe la base, en Ubuntu/WSL puedes crearla así:

```bash
sudo -u postgres createuser --pwprompt translog
sudo -u postgres createdb --owner=translog translog
```

Copia `backend/.env.example` a `backend/.env` (PowerShell: `Copy-Item backend/.env.example backend/.env`; Bash: `cp backend/.env.example backend/.env`). Ajusta `DB_PASSWORD` al valor elegido para PostgreSQL; mantén `DB_SYNCHRONIZE=true` solo en desarrollo.

En PowerShell, desde la raíz del proyecto, inicia cada servicio en su propia terminal:

```powershell
Set-Location backend
npm ci
npm run start:dev
```

En una segunda terminal:

```powershell
Set-Location frontend
npm ci
npm start
```

</details>

## API

- `POST /api/auth/login` — JWT.
- `POST /api/auth/register` — solo supervisor autenticado.
- `GET /api/users` — listado de usuarios (solo supervisor); nunca devuelve contraseñas ni hashes.
- `PATCH /api/users/:id` — actualizar nombre, correo, rol y, opcionalmente, establecer una nueva contraseña (solo supervisor); omitir `password` la conserva. El hash se genera con bcrypt y nunca se devuelve. No permite cambiar el propio rol ni degradar al último supervisor.
- `DELETE /api/users/:id` — eliminar usuarios sin envíos/eventos asociados; protege la cuenta activa y al último supervisor. La lista abre el mismo formulario para alta (`/users/new`) y edición (`/users/:id/edit`); en edición se dejan vacíos los campos de contraseña para conservarla, y se pide confirmación al cambiarla.
- `POST /api/shipments`, `GET /api/shipments?page=1&limit=20&status=IN_WAREHOUSE&q=texto&sortBy=createdAt&sortDirection=DESC`, `GET /api/shipments/:id`. La lista admite filtro por estado, búsqueda por código/destinatario/dirección/teléfono sin distinguir mayúsculas ni tildes, y orden por código, destinatario, destino, estado o fecha.
- `PATCH /api/shipments/:id/status`, `DELETE /api/shipments/:id`.
- `POST /api/shipments/assign-vehicles` — First Fit Decreasing; todos deben existir y estar IN_WAREHOUSE.
- `GET /api/tracking/:trackingCode` — público.

## Modelo y decisiones

`User` representa operador/supervisor; `Shipment` contiene estado actual, peso y datos de entrega; `ShipmentEvent` conserva el historial con responsable, fecha, ubicación y notas. `Shipment.createdById` y `ShipmentEvent.actorId` tienen relaciones y FK a `User` con borrado restrictivo; la vista interna muestra nombres de responsables, mientras el tracking público no los revela. Los cambios de estado corren dentro de transacciones y bloquean la fila para prevenir carreras. El endpoint público no revela identificadores ni usuarios internos.

El listado valida sus parámetros mediante `ListShipmentsQueryDto` (`page` entero positivo, `limit` de 1 a 100, filtros/orden permitidos y búsqueda de hasta 100 caracteres). El `numeric(10,3)` de PostgreSQL se transforma a `number` en la API. El código público de tracking se normaliza a mayúsculas; la proyección pública omite los responsables.

En desarrollo, el `.env.example` activa `DB_SYNCHRONIZE` y usa el esquema `public`. Para arrancar desde una base vacía sin sincronización, configura `DB_SYNCHRONIZE=false` y `DB_MIGRATIONS_RUN=true`: `InitialSchema`, generada con `typeorm migration:generate` desde las entidades, crea tablas, tipos, índices y FKs. Si detecta el esquema completo que creó `synchronize`, lo adopta y registra la migración sin duplicar restricciones; ante un esquema parcial/incompatible, aborta sin tocarlo. La CLI usa `src/data-source.ts`; `npm run migration:generate` genera cambios futuros y `npm run migration:run` los aplica. `InitialSchema` no se revierte automáticamente para evitar borrar datos de un esquema adoptado.

Los estados internos son `CREATED`, `IN_WAREHOUSE`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `RETURNED` y `CANCELLED`. El flujo normal es `CREATED → IN_WAREHOUSE → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED`. `RETURNED` solo se permite desde `OUT_FOR_DELIVERY`; `CANCELLED` se permite desde cualquier estado salvo `DELIVERED`. `RETURNED → CANCELLED` cierra administrativamente la devolución. `DELIVERED` y `CANCELLED` son terminales. Las transiciones se validan en el dominio y cada cambio conserva un evento.

El componente de fecha del código `ENV-AAAAMMDD-XXXX` usa el calendario de `Europe/Madrid`; así no cambia al día anterior por convertir primero a UTC. Los reintentos de creación se limitan a colisiones PostgreSQL `23505` y a cinco intentos; otros errores de infraestructura se propagan inmediatamente.

La tabla de envíos usa Angular Material `mat-table` y `mat-paginator` con etiquetas en español. Los errores HTTP muestran un `MatSnackBar` además del mensaje contextual de cada pantalla.

First Fit Decreasing (FFD) ordena los paquetes de mayor a menor peso y coloca cada uno en el primer vehículo con espacio disponible. No es óptimo global; tiene complejidad sencilla y da una solución determinista para el caso.

## Verificación

Desde PowerShell, en la raíz del proyecto, ejecuta los comandos por bloques en sus carpetas:

```powershell
Set-Location backend
npm test
npm run lint
npm run build
npm run test:e2e
Set-Location ..\frontend
npm test
npm run build
```

Las pruebas backend e2e no necesitan una base activa. La cuenta de demostración se crea solo si la base no contiene supervisores; el primer acceso obliga a cambiar su contraseña.

## Seguridad / límites

No usar credenciales de ejemplo en un entorno público; secretos por variables de entorno. JWT en localStorage por simplicidad de la prueba (en producción valorar cookies httpOnly/CSP). `synchronize` solo para desarrollo. La vista pública solo devuelve tracking necesario.