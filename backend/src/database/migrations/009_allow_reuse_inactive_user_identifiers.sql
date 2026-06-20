USE adoptalove;

-- Permite reutilizar correo y RUT de cuentas no activas. La unicidad entre
-- usuarios activos se valida en los servicios de auth y administración.
SET @unique_identifier_indexes = (
  SELECT GROUP_CONCAT(
    CONCAT('DROP INDEX `', REPLACE(identifier_indexes.INDEX_NAME, '`', '``'), '`')
    SEPARATOR ', '
  )
  FROM (
    SELECT INDEX_NAME
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'usuarios'
      AND NON_UNIQUE = 0
    GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
      AND MAX(COLUMN_NAME) IN ('email', 'rut')
  ) AS identifier_indexes
);

SET @drop_unique_identifier_indexes_sql = IF(
  @unique_identifier_indexes IS NULL,
  'SELECT "No unique email or RUT indexes found" AS info',
  CONCAT('ALTER TABLE usuarios ', @unique_identifier_indexes)
);

PREPARE drop_unique_identifier_indexes_stmt FROM @drop_unique_identifier_indexes_sql;
EXECUTE drop_unique_identifier_indexes_stmt;
DEALLOCATE PREPARE drop_unique_identifier_indexes_stmt;

SET @has_email_index = (
  SELECT COUNT(*)
  FROM (
    SELECT INDEX_NAME
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'usuarios'
      AND NON_UNIQUE = 1
    GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
      AND MAX(COLUMN_NAME) = 'email'
  ) AS email_indexes
);

SET @add_email_index_sql = IF(
  @has_email_index = 0,
  'ALTER TABLE usuarios ADD INDEX idx_usuarios_email (email)',
  'SELECT "Non-unique email index already exists" AS info'
);

PREPARE add_email_index_stmt FROM @add_email_index_sql;
EXECUTE add_email_index_stmt;
DEALLOCATE PREPARE add_email_index_stmt;

SET @has_rut_index = (
  SELECT COUNT(*)
  FROM (
    SELECT INDEX_NAME
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'usuarios'
      AND NON_UNIQUE = 1
    GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
      AND MAX(COLUMN_NAME) = 'rut'
  ) AS rut_indexes
);

SET @add_rut_index_sql = IF(
  @has_rut_index = 0,
  'ALTER TABLE usuarios ADD INDEX idx_usuarios_rut (rut)',
  'SELECT "Non-unique RUT index already exists" AS info'
);

PREPARE add_rut_index_stmt FROM @add_rut_index_sql;
EXECUTE add_rut_index_stmt;
DEALLOCATE PREPARE add_rut_index_stmt;
