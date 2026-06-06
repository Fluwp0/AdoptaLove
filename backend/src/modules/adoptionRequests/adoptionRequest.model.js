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

async function findAdoptionRequests() {
  const [rows] = await db.query(
    `SELECT
      s.id,
      a.nombre AS adoptante_nombre,
      a.email AS adoptante_email,
      m.nombre AS mascota_nombre,
      m.especie AS mascota_especie,
      s.estado,
      s.mensaje,
      s.created_at AS fecha_creacion
    FROM solicitudes_adopcion s
    INNER JOIN usuarios a
      ON s.adoptante_usuario_id = a.id
    INNER JOIN mascotas m
      ON s.mascota_id = m.id
    ORDER BY s.created_at DESC, s.id DESC`
  );

  return rows;
}

async function findAdoptionRequestDetailById(id) {
  const [rows] = await db.query(
    `SELECT
      s.id,
      s.adoptante_usuario_id,
      a.nombre AS adoptante_nombre,
      a.email AS adoptante_email,
      s.mascota_id,
      m.nombre AS mascota_nombre,
      m.especie AS mascota_especie,
      s.estado,
      s.mensaje,
      s.created_at AS fecha_creacion,
      s.updated_at
    FROM solicitudes_adopcion s
    INNER JOIN usuarios a
      ON s.adoptante_usuario_id = a.id
    INNER JOIN mascotas m
      ON s.mascota_id = m.id
    WHERE s.id = ?
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
  findAdoptionRequestDetailById,
  findAdoptionRequests,
  findPetById,
  findUserById
};
