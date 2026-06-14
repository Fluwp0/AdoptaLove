USE adoptalove;

SET @has_motivo_revision = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'mascotas'
    AND COLUMN_NAME = 'motivo_revision'
);

SET @add_motivo_revision_sql = IF(
  @has_motivo_revision = 0,
  'ALTER TABLE mascotas ADD COLUMN motivo_revision TEXT NULL AFTER estado',
  'SELECT "motivo_revision already exists" AS message'
);

PREPARE add_motivo_revision_stmt FROM @add_motivo_revision_sql;
EXECUTE add_motivo_revision_stmt;
DEALLOCATE PREPARE add_motivo_revision_stmt;
