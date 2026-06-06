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

async function updateAdoptionRequestStatus(id, estado) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT id, adoptante_usuario_id, mascota_id
      FROM solicitudes_adopcion
      WHERE id = ?
      LIMIT 1`,
      [id]
    );

    const solicitud = rows[0];

    if (!solicitud) {
      await connection.rollback();
      return null;
    }

    await connection.query(
      `UPDATE solicitudes_adopcion
      SET estado = ?
      WHERE id = ?`,
      [estado, id]
    );

    if (estado === 'aprobada') {
      await connection.query(
        `UPDATE mascotas
        SET estado = ?
        WHERE id = ?`,
        ['adoptada', solicitud.mascota_id]
      );

      await connection.query(
        `INSERT IGNORE INTO adopciones
          (
            solicitud_adopcion_id,
            adoptante_usuario_id,
            mascota_id,
            estado,
            observaciones
          )
        VALUES (?, ?, ?, ?, ?)`,
        [
          solicitud.id,
          solicitud.adoptante_usuario_id,
          solicitud.mascota_id,
          'activa',
          'Adopción generada automáticamente al aprobar la solicitud.'
        ]
      );

      await connection.query(
        `UPDATE solicitudes_adopcion
        SET estado = ?
        WHERE mascota_id = ?
          AND id <> ?
          AND estado IN (?, ?)`,
        ['rechazada', solicitud.mascota_id, solicitud.id, 'pendiente', 'en_revision']
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return findAdoptionRequestDetailById(id);
}

module.exports = {
  createAdoptionRequest,
  findAdoptionRequestDetailById,
  findAdoptionRequests,
  findPetById,
  findUserById,
  updateAdoptionRequestStatus
};
