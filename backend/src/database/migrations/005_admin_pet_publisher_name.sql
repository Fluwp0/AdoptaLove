USE adoptalove;

SET @has_publicado_por_nombre = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'mascotas'
    AND COLUMN_NAME = 'publicado_por_nombre'
);

SET @add_publicado_por_nombre_sql = IF(
  @has_publicado_por_nombre = 0,
  'ALTER TABLE mascotas ADD COLUMN publicado_por_nombre VARCHAR(160) NULL AFTER publicado_por_usuario_id',
  'SELECT "publicado_por_nombre already exists"'
);

PREPARE add_publicado_por_nombre_stmt FROM @add_publicado_por_nombre_sql;
EXECUTE add_publicado_por_nombre_stmt;
DEALLOCATE PREPARE add_publicado_por_nombre_stmt;
