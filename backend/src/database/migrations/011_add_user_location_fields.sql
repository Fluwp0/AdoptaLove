USE adoptalove;

SET @has_region := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'region'
);

SET @add_region_sql := IF(
  @has_region = 0,
  'ALTER TABLE usuarios ADD COLUMN region VARCHAR(120) NULL AFTER telefono',
  'SELECT ''region already exists'' AS info'
);

PREPARE add_region_stmt FROM @add_region_sql;
EXECUTE add_region_stmt;
DEALLOCATE PREPARE add_region_stmt;

SET @has_complemento_direccion := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'complemento_direccion'
);

SET @add_complemento_direccion_sql := IF(
  @has_complemento_direccion = 0,
  'ALTER TABLE usuarios ADD COLUMN complemento_direccion VARCHAR(255) NULL AFTER numeracion',
  'SELECT ''complemento_direccion already exists'' AS info'
);

PREPARE add_complemento_direccion_stmt FROM @add_complemento_direccion_sql;
EXECUTE add_complemento_direccion_stmt;
DEALLOCATE PREPARE add_complemento_direccion_stmt;
