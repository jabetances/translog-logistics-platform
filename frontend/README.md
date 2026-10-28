# Interfaz web de TransLog

Aplicación de gestión y seguimiento de envíos, construida con Angular y Angular Material. Consulta el [README principal](../README.md) para conocer el sistema completo y sus servicios.

## Requisitos y configuración

Necesitas Node.js y npm. Desde esta carpeta, instala las dependencias:

```bash
npm ci
```

La configuración de la dirección de la API está en los archivos de entorno de la aplicación. Para el entorno local con Docker, la interfaz se publica en `http://localhost:4200`.

## Desarrollo

```bash
npm start
```

Abre `http://localhost:4200/` en el navegador. El servidor de desarrollo recarga la aplicación al detectar cambios en los archivos fuente.

## Compilación y pruebas

```bash
npm run build
npm test
```

La compilación genera los archivos de distribución en `dist/`. Las pruebas se ejecutan con el ejecutor configurado por Angular CLI y Vitest. El proyecto no define actualmente un comando de pruebas de extremo a extremo.

## Comandos del entorno Angular

Para consultar los comandos y generadores disponibles:

```bash
npx ng --help
npx ng generate component nombre-del-componente
```

La [documentación de Angular CLI](https://angular.dev/tools/cli) explica el resto de opciones.
