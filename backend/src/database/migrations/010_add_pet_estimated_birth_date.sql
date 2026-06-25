USE adoptalove;

SET @has_fecha_nacimiento_estimada := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'mascotas'
    AND COLUMN_NAME = 'fecha_nacimiento_estimada'
);

SET @add_fecha_nacimiento_estimada_sql := IF(
  @has_fecha_nacimiento_estimada = 0,
  'ALTER TABLE mascotas ADD COLUMN fecha_nacimiento_estimada DATE NULL AFTER edad_meses',
  'SELECT ''fecha_nacimiento_estimada already exists'' AS info'
);

PREPARE add_fecha_nacimiento_estimada_stmt FROM @add_fecha_nacimiento_estimada_sql;
EXECUTE add_fecha_nacimiento_estimada_stmt;
DEALLOCATE PREPARE add_fecha_nacimiento_estimada_stmt;

SET @has_idx_mascotas_fecha_nacimiento := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'mascotas'
    AND INDEX_NAME = 'idx_mascotas_fecha_nacimiento_estimada'
);

SET @add_idx_mascotas_fecha_nacimiento_sql := IF(
  @has_idx_mascotas_fecha_nacimiento = 0,
  'ALTER TABLE mascotas ADD INDEX idx_mascotas_fecha_nacimiento_estimada (fecha_nacimiento_estimada)',
  'SELECT ''idx_mascotas_fecha_nacimiento_estimada already exists'' AS info'
);

PREPARE add_idx_mascotas_fecha_nacimiento_stmt FROM @add_idx_mascotas_fecha_nacimiento_sql;
EXECUTE add_idx_mascotas_fecha_nacimiento_stmt;
DEALLOCATE PREPARE add_idx_mascotas_fecha_nacimiento_stmt;
