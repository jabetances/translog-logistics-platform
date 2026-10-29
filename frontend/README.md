# Interfaz web de TransLog

Aplicación de gestión y seguimiento de envíos, construida con Angular standalone y Angular Material. Consulta el [README principal](../README.md) para levantar el sistema completo.

## Ejecutar con Docker

Desde la raíz del repositorio, sigue los tres pasos de PowerShell del README principal. La interfaz queda en `http://localhost:4200`.

## Desarrollo local

Necesitas Node.js y npm. Desde esta carpeta:

```powershell
npm ci
npm start
```

La interfaz espera la API en `http://localhost:3000/api`; esa dirección está definida en los servicios del frontend. Abre `http://localhost:4200/`.

## Compilación y pruebas

```bash
npm run build
npm test
```

Las pruebas unitarias usan Vitest mediante Angular CLI y se ejecutan una vez, sin quedarse en modo watch.
