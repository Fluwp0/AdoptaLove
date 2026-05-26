# AdoptaLove

AdoptaLove es una aplicacion para gestionar adopcion responsable de mascotas,
solicitudes, compatibilidad entre adoptantes y mascotas, donaciones,
administracion y soporte por chatbot.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express.js
- Base de datos: MySQL
- Arquitectura: API REST con backend modular
- Autenticacion: JWT + bcrypt

## Estructura inicial

```text
AdoptaLove/
  frontend/        Aplicacion web React + Vite
  backend/         API REST Node.js + Express.js
```

## Modulos previstos

- Auth
- Usuarios
- Mascotas
- Solicitudes de adopcion
- Adopciones
- Match de compatibilidad
- Chatbot
- Donaciones
- Administracion

## Instalacion local

Instalar dependencias de ambos proyectos:

```bash
npm run install:all
```

Ejecutar frontend:

```bash
npm run dev:frontend
```

Ejecutar backend:

```bash
npm run dev:backend
```

## Variables de entorno

Cada aplicacion incluye un archivo `.env.example` como base:

- `frontend/.env.example`
- `backend/.env.example`

Copiar cada archivo a `.env` y ajustar los valores segun el entorno local.

## Base de datos

El esquema inicial de MySQL esta en `backend/src/database/schema.sql`.

Incluye las tablas principales:

- `usuarios`: personas registradas con rol `adoptante`, `fundacion` o `administrador`.
- `mascotas`: mascotas publicadas por usuarios con rol de fundacion o administracion.
- `solicitudes_adopcion`: solicitudes realizadas por adoptantes sobre mascotas.
- `adopciones`: registro de solicitudes aprobadas y convertidas en adopcion.
- `donaciones`: donaciones simuladas asociadas opcionalmente a usuarios.
- `chatbot_preguntas` y `chatbot_respuestas`: preguntas frecuentes almacenadas en base de datos para el chatbot inicial.
- `preguntas_compatibilidad` y `respuestas_compatibilidad`: formulario base para calcular compatibilidad entre adoptantes y mascotas.
