const db = require('../../config/database');

const PUBLIC_USER_FIELDS = `
  id,
  nombre,
  email,
  rut,
  telefono,
  region,
  direccion,
  ciudad,
  comuna,
  numeracion,
  complemento_direccion,
  rol,
  estado,
  created_at,
  updated_at
`;

const NORMALIZED_RUT_SQL = `
  UPPER(REPLACE(REPLACE(REPLACE(COALESCE(rut, ''), '.', ''), '-', ''), ' ', ''))
`;

const NORMALIZED_RUT_PARAM_SQL = `
  UPPER(REPLACE(REPLACE(REPLACE(?, '.', ''), '-', ''), ' ', ''))
`;

async function createUser({
  nombre,
  email,
  rut,
  passwordHash,
  telefono,
  region,
  direccion,
  ciudad,
  comuna,
  numeracion,
  complementoDireccion
}) {
  const [result] = await db.query(
    `INSERT INTO usuarios
      (
        nombre,
        email,
        rut,
        password_hash,
        telefono,
        region,
        direccion,
        ciudad,
        comuna,
        numeracion,
        complemento_direccion,
        rol,
        estado
      )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nombre,
      email,
      rut,
      passwordHash,
      telefono || null,
      region || null,
      direccion || null,
      ciudad || null,
      comuna || null,
      numeracion || null,
      complementoDireccion || null,
      'adoptante',
      'activo'
    ]
  );

  return findPublicUserById(result.insertId);
}

async function findPublicUserById(id) {
  const [rows] = await db.query(
    `SELECT ${PUBLIC_USER_FIELDS}
    FROM usuarios
    WHERE id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function findActiveUserByEmail(email) {
  const [rows] = await db.query(
    `SELECT
      ${PUBLIC_USER_FIELDS},
      password_hash
    FROM usuarios
    WHERE LOWER(TRIM(email)) = ?
      AND estado = 'activo'
      AND eliminado_at IS NULL
    LIMIT 1`,
    [email]
  );

  return rows[0] || null;
}

async function findActiveUserByRut(rut) {
  const [rows] = await db.query(
    `SELECT ${PUBLIC_USER_FIELDS}
    FROM usuarios
    WHERE ${NORMALIZED_RUT_SQL} = ${NORMALIZED_RUT_PARAM_SQL}
      AND estado = 'activo'
      AND eliminado_at IS NULL
    LIMIT 1`,
    [rut]
  );

  return rows[0] || null;
}

async function updateUserLocation(id, location) {
  await db.query(
    `UPDATE usuarios
    SET
      region = ?,
      ciudad = ?,
      comuna = ?,
      direccion = ?,
      numeracion = ?,
      complemento_direccion = ?
    WHERE id = ?`,
    [
      location.region || null,
      location.ciudad || null,
      location.comuna || null,
      location.direccion || null,
      location.numeracion || null,
      location.complementoDireccion || null,
      id
    ]
  );

  return findPublicUserById(id);
}

module.exports = {
  createUser,
  findActiveUserByEmail,
  findActiveUserByRut,
  findPublicUserById,
  updateUserLocation
};
