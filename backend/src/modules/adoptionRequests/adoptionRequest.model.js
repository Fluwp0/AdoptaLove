const db = require('../../config/database');

async function findUserById(id) {
  const [rows] = await db.query(
    `SELECT id, nombre, email, rol, estado
    FROM usuarios
    WHERE id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function findPetById(id) {
  const [rows] = await db.query(
    `SELECT id, nombre, estado
    FROM mascotas
    WHERE id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function findAdoptionRequestById(id) {
  const [rows] = await db.query(
    `SELECT
      id,
      adoptante_usuario_id,
      mascota_id,
      mensaje,
      estado,
      created_at,
      updated_at
    FROM solicitudes_adopcion
    WHERE id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function createAdoptionRequest({ adoptanteUsuarioId, mascotaId, mensaje }) {
  const [result] = await db.query(
    `INSERT INTO solicitudes_adopcion
      (adoptante_usuario_id, mascota_id, mensaje, estado)
    VALUES (?, ?, ?, ?)`,
    [adoptanteUsuarioId, mascotaId, mensaje, 'pendiente']
  );

  return findAdoptionRequestById(result.insertId);
}

module.exports = {
  createAdoptionRequest,
  findPetById,
  findUserById
};
