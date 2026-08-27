const D1_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS _sites_schema (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `INSERT OR IGNORE INTO _sites_schema (version) VALUES (1)`,
  `CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    rut TEXT,
    password_hash TEXT NOT NULL,
    telefono TEXT,
    region TEXT,
    ciudad TEXT,
    comuna TEXT,
    direccion TEXT,
    numeracion TEXT,
    complemento_direccion TEXT,
    red_social_tipo TEXT,
    red_social_valor TEXT,
    rol TEXT NOT NULL DEFAULT 'adoptante' CHECK (rol IN ('adoptante','fundacion','administrador')),
    estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','inactivo','suspendido')),
    eliminado_at TEXT,
    motivo_eliminacion TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  'CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)',
  'CREATE INDEX IF NOT EXISTS idx_usuarios_rut ON usuarios(rut)',
  `CREATE TABLE IF NOT EXISTS mascotas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    publicado_por_usuario_id INTEGER NOT NULL,
    publicado_por_nombre TEXT,
    nombre TEXT NOT NULL,
    especie TEXT NOT NULL,
    raza TEXT,
    sexo TEXT NOT NULL DEFAULT 'desconocido' CHECK (sexo IN ('macho','hembra','desconocido')),
    edad_anios INTEGER,
    edad_meses INTEGER,
    fecha_nacimiento_estimada TEXT,
    tamano TEXT NOT NULL DEFAULT 'mediano' CHECK (tamano IN ('pequeno','mediano','grande')),
    descripcion TEXT,
    foto_url TEXT,
    estado TEXT NOT NULL DEFAULT 'en_revision' CHECK (estado IN ('disponible','en_revision','rechazada','adoptada','inactiva')),
    motivo_revision TEXT,
    eliminada_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (publicado_por_usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT
  )`,
  'CREATE INDEX IF NOT EXISTS idx_mascotas_publicado_por ON mascotas(publicado_por_usuario_id)',
  'CREATE INDEX IF NOT EXISTS idx_mascotas_estado ON mascotas(estado)',
  `CREATE TABLE IF NOT EXISTS mascota_modificaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mascota_id INTEGER NOT NULL,
    fundacion_usuario_id INTEGER NOT NULL,
    datos_propuestos TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'en_revision' CHECK (estado IN ('en_revision','aprobada','rechazada','descartada')),
    estado_mascota_anterior TEXT NOT NULL DEFAULT 'disponible',
    motivo_revision TEXT,
    revisado_por_usuario_id INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (fundacion_usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (revisado_por_usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL
  )`,
  'CREATE INDEX IF NOT EXISTS idx_mascota_modificaciones_estado ON mascota_modificaciones(estado)',
  `CREATE TABLE IF NOT EXISTS solicitudes_adopcion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    adoptante_usuario_id INTEGER NOT NULL,
    mascota_id INTEGER NOT NULL,
    mensaje TEXT,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','en_revision','aprobada','rechazada','cancelada')),
    motivo_estado TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (adoptante_usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON UPDATE CASCADE ON DELETE RESTRICT
  )`,
  'CREATE INDEX IF NOT EXISTS idx_solicitudes_adoptante ON solicitudes_adopcion(adoptante_usuario_id)',
  'CREATE INDEX IF NOT EXISTS idx_solicitudes_mascota ON solicitudes_adopcion(mascota_id)',
  `CREATE TABLE IF NOT EXISTS adopciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    solicitud_adopcion_id INTEGER NOT NULL UNIQUE,
    adoptante_usuario_id INTEGER NOT NULL,
    mascota_id INTEGER NOT NULL,
    fecha_adopcion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','finalizada','cancelada')),
    observaciones TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (solicitud_adopcion_id) REFERENCES solicitudes_adopcion(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (adoptante_usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON UPDATE CASCADE ON DELETE RESTRICT
  )`,
  `CREATE TABLE IF NOT EXISTS donaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    monto NUMERIC NOT NULL CHECK (monto > 0),
    moneda TEXT NOT NULL DEFAULT 'CLP',
    metodo_pago TEXT NOT NULL DEFAULT 'otro' CHECK (metodo_pago IN ('tarjeta','transferencia','webpay','otro')),
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','completada','fallida','cancelada')),
    referencia_pago TEXT,
    mensaje TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL
  )`,
  `CREATE TABLE IF NOT EXISTS chatbot_preguntas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pregunta TEXT NOT NULL,
    categoria TEXT,
    estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','inactiva')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS chatbot_respuestas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pregunta_id INTEGER NOT NULL,
    respuesta TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','inactiva')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pregunta_id) REFERENCES chatbot_preguntas(id) ON UPDATE CASCADE ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS preguntas_compatibilidad (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pregunta TEXT NOT NULL,
    tipo_respuesta TEXT NOT NULL CHECK (tipo_respuesta IN ('texto','opcion_unica','opcion_multiple','numero','booleano')),
    opciones TEXT,
    peso NUMERIC NOT NULL DEFAULT 1,
    estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','inactiva')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS respuestas_compatibilidad (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    pregunta_id INTEGER NOT NULL,
    respuesta_texto TEXT,
    respuesta_numero NUMERIC,
    respuesta_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (pregunta_id) REFERENCES preguntas_compatibilidad(id) ON UPDATE CASCADE ON DELETE CASCADE,
    UNIQUE (usuario_id, pregunta_id)
  )`,
  ...[
    'usuarios',
    'mascotas',
    'mascota_modificaciones',
    'solicitudes_adopcion',
    'adopciones',
    'donaciones',
    'chatbot_preguntas',
    'chatbot_respuestas',
    'preguntas_compatibilidad',
    'respuestas_compatibilidad'
  ].map(
    (table) => `CREATE TRIGGER IF NOT EXISTS trg_${table}_updated_at
      AFTER UPDATE ON ${table}
      FOR EACH ROW
      WHEN NEW.updated_at = OLD.updated_at
      BEGIN
        UPDATE ${table} SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END`
  )
];

module.exports = { D1_SCHEMA_STATEMENTS };
