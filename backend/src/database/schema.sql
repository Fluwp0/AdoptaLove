CREATE DATABASE IF NOT EXISTS adoptalove
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE adoptalove;

CREATE TABLE IF NOT EXISTS usuarios (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  rut VARCHAR(12) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  telefono VARCHAR(30) NULL,
  direccion VARCHAR(255) NULL,
  rol ENUM('adoptante', 'fundacion', 'administrador') NOT NULL DEFAULT 'adoptante',
  estado ENUM('activo', 'inactivo', 'suspendido') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mascotas (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  publicado_por_usuario_id BIGINT UNSIGNED NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  especie VARCHAR(80) NOT NULL,
  raza VARCHAR(120) NULL,
  sexo ENUM('macho', 'hembra', 'desconocido') NOT NULL DEFAULT 'desconocido',
  edad_anios TINYINT UNSIGNED NULL,
  tamano ENUM('pequeno', 'mediano', 'grande') NOT NULL DEFAULT 'mediano',
  descripcion TEXT NULL,
  foto_url VARCHAR(500) NULL,
  estado ENUM('disponible', 'en_revision', 'adoptada', 'inactiva') NOT NULL DEFAULT 'disponible',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_mascotas_publicado_por
    FOREIGN KEY (publicado_por_usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  INDEX idx_mascotas_publicado_por (publicado_por_usuario_id),
  INDEX idx_mascotas_estado (estado),
  INDEX idx_mascotas_especie (especie)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS solicitudes_adopcion (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  adoptante_usuario_id BIGINT UNSIGNED NOT NULL,
  mascota_id BIGINT UNSIGNED NOT NULL,
  mensaje TEXT NULL,
  estado ENUM('pendiente', 'en_revision', 'aprobada', 'rechazada', 'cancelada') NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_solicitudes_adoptante
    FOREIGN KEY (adoptante_usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_solicitudes_mascota
    FOREIGN KEY (mascota_id) REFERENCES mascotas(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  INDEX idx_solicitudes_adoptante (adoptante_usuario_id),
  INDEX idx_solicitudes_mascota (mascota_id),
  INDEX idx_solicitudes_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS adopciones (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  solicitud_adopcion_id BIGINT UNSIGNED NOT NULL UNIQUE,
  adoptante_usuario_id BIGINT UNSIGNED NOT NULL,
  mascota_id BIGINT UNSIGNED NOT NULL,
  fecha_adopcion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('activa', 'finalizada', 'cancelada') NOT NULL DEFAULT 'activa',
  observaciones TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_adopciones_solicitud
    FOREIGN KEY (solicitud_adopcion_id) REFERENCES solicitudes_adopcion(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_adopciones_adoptante
    FOREIGN KEY (adoptante_usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_adopciones_mascota
    FOREIGN KEY (mascota_id) REFERENCES mascotas(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  INDEX idx_adopciones_adoptante (adoptante_usuario_id),
  INDEX idx_adopciones_mascota (mascota_id),
  INDEX idx_adopciones_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS donaciones (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT UNSIGNED NULL,
  monto DECIMAL(10,2) NOT NULL,
  moneda CHAR(3) NOT NULL DEFAULT 'CLP',
  metodo_pago ENUM('tarjeta', 'transferencia', 'webpay', 'otro') NOT NULL DEFAULT 'otro',
  estado ENUM('pendiente', 'completada', 'fallida', 'cancelada') NOT NULL DEFAULT 'pendiente',
  referencia_pago VARCHAR(120) NULL,
  mensaje TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_donaciones_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT chk_donaciones_monto_positivo CHECK (monto > 0),
  INDEX idx_donaciones_usuario (usuario_id),
  INDEX idx_donaciones_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chatbot_preguntas (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pregunta VARCHAR(255) NOT NULL,
  categoria VARCHAR(100) NULL,
  estado ENUM('activa', 'inactiva') NOT NULL DEFAULT 'activa',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_chatbot_preguntas_estado (estado),
  INDEX idx_chatbot_preguntas_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chatbot_respuestas (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pregunta_id BIGINT UNSIGNED NOT NULL,
  respuesta TEXT NOT NULL,
  estado ENUM('activa', 'inactiva') NOT NULL DEFAULT 'activa',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_chatbot_respuestas_pregunta
    FOREIGN KEY (pregunta_id) REFERENCES chatbot_preguntas(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  INDEX idx_chatbot_respuestas_pregunta (pregunta_id),
  INDEX idx_chatbot_respuestas_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS preguntas_compatibilidad (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pregunta VARCHAR(255) NOT NULL,
  tipo_respuesta ENUM('texto', 'opcion_unica', 'opcion_multiple', 'numero', 'booleano') NOT NULL,
  opciones LONGTEXT NULL,
  peso DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  estado ENUM('activa', 'inactiva') NOT NULL DEFAULT 'activa',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_preguntas_compatibilidad_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS respuestas_compatibilidad (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT UNSIGNED NOT NULL,
  pregunta_id BIGINT UNSIGNED NOT NULL,
  respuesta_texto TEXT NULL,
  respuesta_numero DECIMAL(10,2) NULL,
  respuesta_json LONGTEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_respuestas_compatibilidad_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_respuestas_compatibilidad_pregunta
    FOREIGN KEY (pregunta_id) REFERENCES preguntas_compatibilidad(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  UNIQUE KEY uq_respuestas_compatibilidad_usuario_pregunta (usuario_id, pregunta_id),
  INDEX idx_respuestas_compatibilidad_usuario (usuario_id),
  INDEX idx_respuestas_compatibilidad_pregunta (pregunta_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
