USE adoptalove;

SET @has_eliminada_at = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'mascotas'
    AND COLUMN_NAME = 'eliminada_at'
);

SET @add_eliminada_at_sql = IF(
  @has_eliminada_at = 0,
  'ALTER TABLE mascotas ADD COLUMN eliminada_at DATETIME NULL AFTER estado',
  'SELECT "eliminada_at already exists"'
);

PREPARE add_eliminada_at_stmt FROM @add_eliminada_at_sql;
EXECUTE add_eliminada_at_stmt;
DEALLOCATE PREPARE add_eliminada_at_stmt;

