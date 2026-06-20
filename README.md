# AdoptaLove

AdoptaLove es una aplicación web orientada a la adopción responsable de mascotas. El sistema permite registrar adoptantes, fundaciones y administradores; publicar mascotas; gestionar solicitudes de adopción; calcular compatibilidad; recibir donaciones para la sostenibilidad de la plataforma; y entregar apoyo mediante un chatbot con IA.

## Estado del proyecto

El proyecto está organizado como un monorepo con frontend y backend separados:

```text
AdoptaLove/
  frontend/        Aplicación web React + Vite
  backend/         API REST Node.js + Express.js
```

La arquitectura del proyecto es cliente-servidor con API REST y backend modular. No se trabaja como microservicios separados en esta versión, sino como un monolito modular para facilitar el desarrollo, pruebas y entrega académica.

## Stack tecnológico

- Frontend: React + Vite
- Backend: Node.js + Express.js
- Base de datos: MySQL
- Autenticación: JWT + bcrypt
- Subida de imágenes: Multer + carpeta `backend/uploads/`
- Chatbot: módulo interno conectado a OpenAI mediante `OPENAI_API_KEY`
- Arquitectura: API REST + monolito modular

## Funcionalidades principales

### Usuarios y autenticación

- Registro e inicio de sesión.
- Control de roles: `adoptante`, `fundacion` y `administrador`.
- Validación de correo, RUT, teléfono y contraseña.
- Eliminación lógica de usuarios.
- Reutilización de correo y RUT solo cuando el usuario anterior está inactivo o eliminado lógicamente.

### Adoptantes

- Catálogo de mascotas disponibles.
- Detalle de mascota.
- Formulario de postulación.
- Seguimiento de solicitudes desde el perfil.
- Quiz de compatibilidad.
- Acceso a donaciones y chatbot.

### Fundaciones

- Panel de fundación.
- Publicación de mascotas.
- Edición de mascotas mediante solicitud de modificación.
- Revisión de postulaciones recibidas.
- Aprobación o rechazo de solicitudes con motivo.

### Administración

- Panel administrativo.
- Gestión de usuarios.
- Gestión de publicaciones.
- Revisión de publicaciones enviadas por fundaciones.
- Revisión de modificaciones pendientes.
- Aprobación o rechazo con motivo.
- Eliminación lógica de usuarios y mascotas.

### Mascotas y adopciones

- Publicación de mascotas con imagen.
- Estados de mascota: `disponible`, `en_revision`, `rechazada`, `adoptada` e `inactiva`.
- Solicitudes de adopción con estados de revisión.
- Registro de adopciones aprobadas.
- Contadores para métricas públicas según datos de la base de datos.

### Chatbot

- Módulo de chatbot para preguntas frecuentes y apoyo al usuario.
- Configuración opcional con OpenAI usando las variables `OPENAI_API_KEY` y `OPENAI_MODEL`.

### Donaciones

- Módulo de donaciones para apoyar la sostenibilidad financiera de la plataforma.
- Registro de monto, método de pago, estado y mensaje opcional.

### Página pública

- Inicio.
- Catálogo de compañeros disponibles.
- Página unificada de Sobre nosotros y Contacto.
- Enlaces a redes sociales oficiales.
- Footer visible para usuarios no administradores.

## Rutas principales del frontend

```text
/                         Inicio
/mascotas                 Catálogo de mascotas
/mascotas/:id             Detalle de mascota
/mascotas/:id/postular    Formulario de postulación
/sobre-nosotros           Sobre nosotros y contacto
/contacto                 Redirección visual a Sobre nosotros y contacto
/login                    Inicio de sesión
/registro                 Registro
/perfil                   Perfil del adoptante
/compatibilidad           Quiz de compatibilidad
/donaciones               Donaciones
/chatbot                  Chatbot
/fundacion                Panel de fundación
/panel-fundacion          Panel de fundación
/admin                    Panel administrador
/admin/inicio             Inicio administrador
/admin/usuarios           Gestión de usuarios
/admin/publicaciones      Gestión de publicaciones
/admin/modificaciones     Revisión de modificaciones
```

## Rutas principales del backend

La API se expone desde `/api`.

```text
GET  /api/health          Estado general de la API
GET  /api/health/db       Estado de conexión con MySQL

/api/about
/api/auth
/api/users
/api/mascotas
/api/pets
/api/solicitudes-adopcion
/api/adoption-requests
/api/adoptions
/api/compatibility
/api/chatbot
/api/donations
/api/admin
/api/foundation
/api/fundacion
```

## Instalación local

### 1. Clonar el repositorio

```bash
git clone https://github.com/Fluwp0/AdoptaLove.git
cd AdoptaLove
```

### 2. Instalar dependencias

Desde la raíz del proyecto:

```bash
npm run install:all
```

Este comando instala las dependencias de `frontend` y `backend`.

### 3. Configurar variables de entorno

Copiar los archivos de ejemplo:

```bash
copy frontend\.env.example frontend\.env
copy backend\.env.example backend\.env
```

En sistemas Linux/macOS:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

### 4. Configurar `frontend/.env`

```env
VITE_API_URL=http://localhost:3000/api
```

### 5. Configurar `backend/.env`

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=adoptalove

JWT_SECRET=change_me
JWT_EXPIRES_IN=1d
CORS_ORIGIN=http://localhost:5173

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

Importante: los archivos `.env` no deben subirse a GitHub.

## Base de datos

El esquema principal de MySQL está en:

```text
backend/src/database/schema.sql
```

Para una instalación nueva, ejecutar ese archivo en MySQL Workbench o desde consola.

Ejemplo desde consola:

```bash
mysql -u root -p < backend/src/database/schema.sql
```

También existe una carpeta de migraciones para actualizar bases de datos antiguas:

```text
backend/src/database/migrations/
```

Tablas principales:

- `usuarios`
- `mascotas`
- `mascota_modificaciones`
- `solicitudes_adopcion`
- `adopciones`
- `donaciones`
- `chatbot_preguntas`
- `chatbot_respuestas`
- `preguntas_compatibilidad`
- `respuestas_compatibilidad`

## Ejecutar el proyecto

### Ejecutar backend

Desde la raíz:

```bash
npm run dev:backend
```

El backend queda disponible en:

```text
http://localhost:3000
```

Pruebas rápidas:

```text
http://localhost:3000/api/health
http://localhost:3000/api/health/db
```

### Ejecutar frontend

En otra terminal, desde la raíz:

```bash
npm run dev:frontend
```

El frontend queda disponible normalmente en:

```text
http://localhost:5173
```

## Ejecutar en red local o temporalmente online con ngrok

Este modo sirve para probar la página desde un celular, desde otra red o para compartir una URL temporal de demostración.

### Opción usada para exponer el frontend

Abrir tres terminales.

Terminal 1: levantar backend.

```bash
npm run dev --prefix backend
```

Terminal 2: levantar frontend escuchando conexiones externas.

```bash
npm run dev --prefix frontend -- --host 0.0.0.0
```

Terminal 3: exponer el frontend con ngrok.

```bash
C:\ngrok\ngrok.exe http 5173
```

Luego se debe copiar la URL HTTPS entregada por ngrok y abrirla desde el celular u otro dispositivo.

### Importante sobre el backend

Si la página se abre desde otro dispositivo y el frontend tiene configurado:

```env
VITE_API_URL=http://localhost:3000/api
```

las peticiones al backend pueden fallar, porque `localhost` apuntará al dispositivo que está abriendo la página y no al computador donde corre el backend.

Para una prueba online completa, también se puede exponer el backend con otro túnel de ngrok:

```bash
C:\ngrok\ngrok.exe http 3000
```

En ese caso, configurar el frontend con la URL pública del backend:

```env
VITE_API_URL=https://URL-BACKEND-NGROK/api
```

Y configurar el backend para aceptar el origen público del frontend:

```env
CORS_ORIGIN=https://URL-FRONTEND-NGROK
```

Después de cambiar variables de entorno, reiniciar backend y frontend.

## Comandos útiles

```bash
npm run install:all      # Instala dependencias de frontend y backend
npm run dev:frontend    # Ejecuta React + Vite
npm run dev:backend     # Ejecuta API con nodemon
```

Desde cada carpeta también se pueden usar comandos individuales:

```bash
cd frontend
npm run build
npm run preview
```

```bash
cd backend
npm start
```

## Archivos y carpetas que no deben subirse

El proyecto ya ignora archivos sensibles o generados, incluyendo:

- `.env`
- `.env.*`, excepto `.env.example`
- `node_modules/`
- `dist/`
- `build/`
- `logs/`
- `backend/uploads/`