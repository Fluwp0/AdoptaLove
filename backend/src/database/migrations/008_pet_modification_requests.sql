USE adoptalove;

CREATE TABLE IF NOT EXISTS mascota_modificaciones (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  mascota_id BIGINT UNSIGNED NOT NULL,
  fundacion_usuario_id BIGINT UNSIGNED NOT NULL,
  datos_propuestos LONGTEXT NOT NULL,
  estado ENUM('en_revision', 'aprobada', 'rechazada', 'descartada') NOT NULL DEFAULT 'en_revision',
  estado_mascota_anterior VARCHAR(40) NOT NULL DEFAULT 'disponible',
  motivo_revision TEXT NULL,
  revisado_por_usuario_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_mascota_modificaciones_mascota
    FOREIGN KEY (mascota_id) REFERENCES mascotas(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_mascota_modificaciones_fundacion
    FOREIGN KEY (fundacion_usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_mascota_modificaciones_revisor
    FOREIGN KEY (revisado_por_usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  INDEX idx_mascota_modificaciones_mascota (mascota_id),
  INDEX idx_mascota_modificaciones_fundacion (fundacion_usuario_id),
  INDEX idx_mascota_modificaciones_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @estado_anterior_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'mascota_modificaciones'
    AND COLUMN_NAME = 'estado_mascota_anterior'
);

SET @estado_anterior_sql := IF(
  @estado_anterior_exists = 0,
  'ALTER TABLE mascota_modificaciones ADD COLUMN estado_mascota_anterior VARCHAR(40) NOT NULL DEFAULT ''disponible'' AFTER estado',
  'SELECT ''estado_mascota_anterior already exists'' AS info'
);

PREPARE estado_anterior_stmt FROM @estado_anterior_sql;
EXECUTE estado_anterior_stmt;
DEALLOCATE PREPARE estado_anterior_stmt;

UPDATE mascotas m
INNER JOIN mascota_modificaciones mm
  ON mm.mascota_id = m.id
SET m.estado = 'en_revision'
WHERE mm.estado = 'en_revision'
  AND m.estado = 'disponible'
  AND m.eliminada_at IS NULL;
