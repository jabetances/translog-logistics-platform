# API de TransLog

Servicio de seguimiento de envíos desarrollado con NestJS, TypeORM y PostgreSQL. La descripción general del sistema, sus rutas y el modelo de datos está en el [README principal](../README.md).

## Requisitos

- Node.js y npm (consulta la versión fijada en el proyecto si necesitas reproducir el entorno).
- PostgreSQL local, o Docker para levantar la base de datos.

## Configuración local

Desde esta carpeta, crea tu archivo de variables de entorno y completa los secretos:

```bash
cp .env.example .env
```

Configura al menos `DB_PASSWORD`, `JWT_SECRET` y las variables `BOOTSTRAP_SUPERVISOR_*`. Para PostgreSQL instalado en Ubuntu, puedes crear el usuario y la base así:

```bash
sudo -u postgres createuser --pwprompt translog
sudo -u postgres createdb --owner=translog translog
```

Pon en `DB_PASSWORD` la contraseña que hayas elegido. Para esta configuración local, usa `DB_HOST=localhost`. También puedes iniciar únicamente PostgreSQL con `docker compose up -d postgres` desde la raíz del repositorio y mantener `DB_HOST=localhost`.

Instala dependencias e inicia el servidor en modo de desarrollo:

```bash
npm ci
npm run start:dev
```

La API queda disponible en el puerto configurado; en el arranque rápido habitual, Swagger está en `http://localhost:3000/api/docs`.

## Comandos habituales

```bash
npm run build       # Compilar
npm run start       # Iniciar
npm run start:dev   # Iniciar y recargar al cambiar archivos
npm run start:prod  # Iniciar la versión compilada
npm test            # Ejecutar pruebas unitarias
npm run test:e2e    # Ejecutar pruebas de extremo a extremo
npm run lint        # Revisar el código
```

## Base de datos y seguridad

`DB_SYNCHRONIZE=true` se utiliza únicamente en desarrollo local. En producción, desactívalo y gestiona los cambios del esquema mediante migraciones. No publiques archivos `.env` ni uses secretos de ejemplo en un entorno accesible desde Internet.
