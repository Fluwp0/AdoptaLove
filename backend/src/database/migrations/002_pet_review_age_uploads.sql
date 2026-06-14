USE adoptalove;

SET @has_edad_meses = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'mascotas'
    AND COLUMN_NAME = 'edad_meses'
);

SET @add_edad_meses_sql = IF(
  @has_edad_meses = 0,
  'ALTER TABLE mascotas ADD COLUMN edad_meses TINYINT UNSIGNED NULL AFTER edad_anios',
  'SELECT "edad_meses already exists"'
);

PREPARE add_edad_meses_stmt FROM @add_edad_meses_sql;
EXECUTE add_edad_meses_stmt;
DEALLOCATE PREPARE add_edad_meses_stmt;

ALTER TABLE mascotas
  MODIFY estado ENUM('disponible', 'en_revision', 'rechazada', 'adoptada', 'inactiva')
    NOT NULL DEFAULT 'en_revision';
