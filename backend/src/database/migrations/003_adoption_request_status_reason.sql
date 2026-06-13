USE adoptalove;

SET @column_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'solicitudes_adopcion'
    AND COLUMN_NAME = 'motivo_estado'
);

SET @sql := IF(
  @column_exists = 0,
  'ALTER TABLE solicitudes_adopcion ADD COLUMN motivo_estado TEXT NULL AFTER estado',
  'SELECT "motivo_estado already exists" AS message'
);

PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;
