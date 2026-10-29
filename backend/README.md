# API de TransLog

API de seguimiento de envíos desarrollada con NestJS, TypeORM y PostgreSQL. La guía completa de ejecución y el modelo del sistema están en el [README principal](../README.md).

## Ejecutar la entrega con Docker

Desde la raíz del repositorio, basta con:

```powershell
docker compose up --build
```

No hace falta crear un `.env`: Compose aplica valores de demostración locales. La primera cuenta, en una base sin supervisores, es `admin@example.test` / `admin`; el primer acceso exige cambiarla por una frase única de al menos 12 caracteres. Se rechazan claves comunes y contraseñas de más de 72 bytes UTF-8; no se fuerzan símbolos ni mayúsculas.

## Desarrollo nativo (opcional)

Necesitas Node.js, npm y PostgreSQL. Desde esta carpeta, copia la plantilla de entorno:

PowerShell:

```powershell
Copy-Item .env.example .env
```

Bash (Linux, macOS o WSL):

```bash
cp .env.example .env
```

Ajusta `DB_PASSWORD` a la contraseña del usuario de PostgreSQL si no usas el valor local de la plantilla. Mantén `DB_HOST=localhost` y `DB_SYNCHRONIZE=true` solo para desarrollo. Si PostgreSQL ya está instalado en Ubuntu, puedes crear el usuario y la base así:

```bash
sudo -u postgres createuser --pwprompt translog
sudo -u postgres createdb --owner=translog translog
```

Instala y arranca la API desde esta carpeta:

```bash
npm ci
npm run start:dev
```

Swagger está en `http://localhost:3000/api/docs` con la configuración local habitual.

## Comandos y pruebas

```bash
npm run build
npm run lint
npm test
npm run test:e2e
```

Las pruebas e2e son HTTP aisladas y no necesitan una base activa. En producción, desactiva `DB_SYNCHRONIZE` y aplica migraciones. Nunca publiques un archivo `.env` ni uses los valores de demostración fuera de un entorno local.
