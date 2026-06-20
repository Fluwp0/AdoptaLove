const db = require('../../config/database');

const PUBLIC_USER_FIELDS = `
  id,
  nombre,
  email,
  rut,
  telefono,
  direccion,
  ciudad,
  comuna,
  numeracion,
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
  direccion,
  ciudad,
  comuna,
  numeracion
}) {
  const [result] = await db.query(
    `INSERT INTO usuarios
      (
        nombre,
        email,
        rut,
        password_hash,
        telefono,
        direccion,
        ciudad,
        comuna,
        numeracion,
        rol,
        estado
      )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nombre,
      email,
      rut,
      passwordHash,
      telefono || null,
      direccion || null,
      ciudad || null,
      comuna || null,
      numeracion || null,
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

async function findUserByEmail(email) {
  const [rows] = await db.query(
    `SELECT
      ${PUBLIC_USER_FIELDS},
      password_hash
    FROM usuarios
    WHERE LOWER(TRIM(email)) = ?
    LIMIT 1`,
    [email]
  );

  return rows[0] || null;
}

async function findUserByRut(rut) {
  const [rows] = await db.query(
    `SELECT ${PUBLIC_USER_FIELDS}
    FROM usuarios
    WHERE ${NORMALIZED_RUT_SQL} = ${NORMALIZED_RUT_PARAM_SQL}
    LIMIT 1`,
    [rut]
  );

  return rows[0] || null;
}

module.exports = {
  createUser,
  findPublicUserById,
  findUserByEmail,
  findUserByRut
};
