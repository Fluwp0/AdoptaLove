USE adoptalove;

SET @rut_nullable = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'rut'
    AND IS_NULLABLE = 'YES'
);

SET @make_rut_nullable_sql = IF(
  @rut_nullable = 0,
  'ALTER TABLE usuarios MODIFY rut VARCHAR(12) NULL',
  'SELECT "rut already nullable"'
);

PREPARE make_rut_nullable_stmt FROM @make_rut_nullable_sql;
EXECUTE make_rut_nullable_stmt;
DEALLOCATE PREPARE make_rut_nullable_stmt;

SET @has_ciudad = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'ciudad'
);

SET @add_ciudad_sql = IF(
  @has_ciudad = 0,
  'ALTER TABLE usuarios ADD COLUMN ciudad VARCHAR(120) NULL AFTER direccion',
  'SELECT "ciudad already exists"'
);

PREPARE add_ciudad_stmt FROM @add_ciudad_sql;
EXECUTE add_ciudad_stmt;
DEALLOCATE PREPARE add_ciudad_stmt;

SET @has_comuna = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'comuna'
);

SET @add_comuna_sql = IF(
  @has_comuna = 0,
  'ALTER TABLE usuarios ADD COLUMN comuna VARCHAR(120) NULL AFTER ciudad',
  'SELECT "comuna already exists"'
);

PREPARE add_comuna_stmt FROM @add_comuna_sql;
EXECUTE add_comuna_stmt;
DEALLOCATE PREPARE add_comuna_stmt;

SET @has_numeracion = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'numeracion'
);

SET @add_numeracion_sql = IF(
  @has_numeracion = 0,
  'ALTER TABLE usuarios ADD COLUMN numeracion VARCHAR(40) NULL AFTER comuna',
  'SELECT "numeracion already exists"'
);

PREPARE add_numeracion_stmt FROM @add_numeracion_sql;
EXECUTE add_numeracion_stmt;
DEALLOCATE PREPARE add_numeracion_stmt;

SET @has_red_social_tipo = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'red_social_tipo'
);

SET @add_red_social_tipo_sql = IF(
  @has_red_social_tipo = 0,
  'ALTER TABLE usuarios ADD COLUMN red_social_tipo VARCHAR(40) NULL AFTER numeracion',
  'SELECT "red_social_tipo already exists"'
);

PREPARE add_red_social_tipo_stmt FROM @add_red_social_tipo_sql;
EXECUTE add_red_social_tipo_stmt;
DEALLOCATE PREPARE add_red_social_tipo_stmt;

SET @has_red_social_valor = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'red_social_valor'
);

SET @add_red_social_valor_sql = IF(
  @has_red_social_valor = 0,
  'ALTER TABLE usuarios ADD COLUMN red_social_valor VARCHAR(255) NULL AFTER red_social_tipo',
  'SELECT "red_social_valor already exists"'
);

PREPARE add_red_social_valor_stmt FROM @add_red_social_valor_sql;
EXECUTE add_red_social_valor_stmt;
DEALLOCATE PREPARE add_red_social_valor_stmt;

SET @has_eliminado_at = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'eliminado_at'
);

SET @add_eliminado_at_sql = IF(
  @has_eliminado_at = 0,
  'ALTER TABLE usuarios ADD COLUMN eliminado_at DATETIME NULL AFTER estado',
  'SELECT "eliminado_at already exists"'
);

PREPARE add_eliminado_at_stmt FROM @add_eliminado_at_sql;
EXECUTE add_eliminado_at_stmt;
DEALLOCATE PREPARE add_eliminado_at_stmt;

SET @has_motivo_eliminacion = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'motivo_eliminacion'
);

SET @add_motivo_eliminacion_sql = IF(
  @has_motivo_eliminacion = 0,
  'ALTER TABLE usuarios ADD COLUMN motivo_eliminacion TEXT NULL AFTER eliminado_at',
  'SELECT "motivo_eliminacion already exists"'
);

PREPARE add_motivo_eliminacion_stmt FROM @add_motivo_eliminacion_sql;
EXECUTE add_motivo_eliminacion_stmt;
DEALLOCATE PREPARE add_motivo_eliminacion_stmt;
