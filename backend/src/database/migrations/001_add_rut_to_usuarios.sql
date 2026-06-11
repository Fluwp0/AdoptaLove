USE adoptalove;

-- Ejecutar una sola vez en bases existentes.
-- La columna parte como NULL para no romper usuarios demo ya creados.
ALTER TABLE usuarios
ADD COLUMN rut VARCHAR(12) NULL AFTER email;

ALTER TABLE usuarios
ADD UNIQUE KEY uq_usuarios_rut (rut);

-- Cuando todos los usuarios existentes tengan RUT, puedes hacer obligatorio el campo:
-- ALTER TABLE usuarios
-- MODIFY COLUMN rut VARCHAR(12) NOT NULL;
