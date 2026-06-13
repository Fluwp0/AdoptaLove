const db = require('../../config/database');

function buildOwnerWhere(userId, alias = 'm') {
  return userId ? ` AND ${alias}.publicado_por_usuario_id = ?` : '';
}

function buildOwnerParams(userId) {
  return userId ? [userId] : [];
}

async function getDashboardSummary(userId = null) {
  const [petRows] = await db.query(
    `SELECT
      COUNT(*) AS mascotas_publicadas,
      SUM(CASE WHEN estado = 'disponible' THEN 1 ELSE 0 END) AS mascotas_disponibles
    FROM mascotas m
    WHERE m.eliminada_at IS NULL${buildOwnerWhere(userId, 'm')}`,
    buildOwnerParams(userId)
  );

  const [requestRows] = await db.query(
    `SELECT
      COUNT(s.id) AS postulaciones_recibidas,
      SUM(CASE WHEN s.estado = 'pendiente' THEN 1 ELSE 0 END) AS postulaciones_pendientes
    FROM solicitudes_adopcion s
    INNER JOIN mascotas m
      ON s.mascota_id = m.id
    WHERE m.eliminada_at IS NULL${buildOwnerWhere(userId, 'm')}`,
    buildOwnerParams(userId)
  );

  return {
    mascotas_publicadas: Number(petRows[0]?.mascotas_publicadas || 0),
    mascotas_disponibles: Number(petRows[0]?.mascotas_disponibles || 0),
    postulaciones_recibidas: Number(requestRows[0]?.postulaciones_recibidas || 0),
    postulaciones_pendientes: Number(requestRows[0]?.postulaciones_pendientes || 0)
  };
}

async function findPetsByOwner(userId = null) {
  const [rows] = await db.query(
    `SELECT
      m.id,
      m.publicado_por_usuario_id,
      u.nombre AS publicada_por,
      m.nombre,
      m.especie,
      m.raza,
      m.sexo,
      m.edad_anios,
      m.edad_meses,
      m.tamano,
      m.descripcion,
      m.foto_url,
      m.estado,
      m.eliminada_at,
      m.created_at,
      m.updated_at
    FROM mascotas m
    INNER JOIN usuarios u
      ON m.publicado_por_usuario_id = u.id
    WHERE m.eliminada_at IS NULL${buildOwnerWhere(userId, 'm')}
    ORDER BY m.created_at DESC, m.id DESC`,
    buildOwnerParams(userId)
  );

  return rows;
}

async function findPetById(id) {
  const [rows] = await db.query(
    `SELECT
      id,
      publicado_por_usuario_id,
      nombre,
      especie,
      raza,
      sexo,
      edad_anios,
      edad_meses,
      tamano,
      descripcion,
      foto_url,
      estado,
      eliminada_at,
      created_at,
      updated_at
    FROM mascotas
    WHERE id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function createPet(pet) {
  const [result] = await db.query(
    `INSERT INTO mascotas
      (
        publicado_por_usuario_id,
        nombre,
        especie,
        raza,
        sexo,
        edad_anios,
        edad_meses,
        tamano,
        descripcion,
        foto_url,
        estado
      )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      pet.publicadoPorUsuarioId,
      pet.nombre,
      pet.especie,
      pet.raza,
      pet.sexo,
      pet.edadAnios,
      pet.edadMeses,
      pet.tamano,
      pet.descripcion,
      pet.fotoUrl,
      pet.estado
    ]
  );

  return findPetById(result.insertId);
}

async function updatePet(id, pet) {
  await db.query(
    `UPDATE mascotas
    SET
      nombre = ?,
      especie = ?,
      raza = ?,
      sexo = ?,
      edad_anios = ?,
      edad_meses = ?,
      tamano = ?,
      descripcion = ?,
      foto_url = ?,
      estado = ?
    WHERE id = ?`,
    [
      pet.nombre,
      pet.especie,
      pet.raza,
      pet.sexo,
      pet.edadAnios,
      pet.edadMeses,
      pet.tamano,
      pet.descripcion,
      pet.fotoUrl,
      pet.estado,
      id
    ]
  );

  return findPetById(id);
}

async function updatePetStatus(id, estado) {
  await db.query(
    `UPDATE mascotas
    SET estado = ?
    WHERE id = ?`,
    [estado, id]
  );

  return findPetById(id);
}

async function softDeletePet(id) {
  await db.query(
    `UPDATE mascotas
    SET
      estado = ?,
      eliminada_at = CURRENT_TIMESTAMP
    WHERE id = ?
      AND eliminada_at IS NULL`,
    ['inactiva', id]
  );
}

async function findAdoptionRequestsByOwner(userId = null) {
  const [rows] = await db.query(
    `SELECT
      s.id,
      s.mascota_id,
      m.nombre AS mascota_nombre,
      m.especie AS mascota_especie,
      m.publicado_por_usuario_id,
      s.adoptante_usuario_id,
      u.nombre AS postulante_nombre,
      u.email AS postulante_email,
      u.telefono AS postulante_telefono,
      u.rut AS postulante_rut,
      s.mensaje,
      s.estado,
      s.motivo_estado,
      s.created_at,
      s.updated_at
    FROM solicitudes_adopcion s
    INNER JOIN mascotas m
      ON s.mascota_id = m.id
    INNER JOIN usuarios u
      ON s.adoptante_usuario_id = u.id
    WHERE m.eliminada_at IS NULL${buildOwnerWhere(userId, 'm')}
    ORDER BY s.created_at DESC, s.id DESC`,
    buildOwnerParams(userId)
  );

  return rows;
}

async function findAdoptionRequestById(id) {
  const [rows] = await db.query(
    `SELECT
      s.id,
      s.mascota_id,
      m.publicado_por_usuario_id,
      s.adoptante_usuario_id,
      s.estado,
      s.motivo_estado
    FROM solicitudes_adopcion s
    INNER JOIN mascotas m
      ON s.mascota_id = m.id
    WHERE s.id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function updateAdoptionRequestStatus(id, estado, motivoEstado = null) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT
        id,
        adoptante_usuario_id,
        mascota_id
      FROM solicitudes_adopcion
      WHERE id = ?
      LIMIT 1`,
      [id]
    );
    const request = rows[0];

    if (!request) {
      await connection.rollback();
      return null;
    }

    await connection.query(
      `UPDATE solicitudes_adopcion
      SET
        estado = ?,
        motivo_estado = ?
      WHERE id = ?`,
      [estado, motivoEstado, id]
    );

    if (estado === 'aprobada') {
      await connection.query(
        `UPDATE mascotas
        SET estado = ?
        WHERE id = ?`,
        ['adoptada', request.mascota_id]
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
          request.id,
          request.adoptante_usuario_id,
          request.mascota_id,
          'activa',
          'Adopción generada automáticamente desde el panel de fundación.'
        ]
      );

      await connection.query(
        `UPDATE solicitudes_adopcion
        SET
          estado = ?,
          motivo_estado = COALESCE(motivo_estado, ?)
        WHERE mascota_id = ?
          AND id <> ?
          AND estado IN (?, ?)`,
        [
          'rechazada',
          'Otra postulación fue aprobada para esta mascota.',
          request.mascota_id,
          request.id,
          'pendiente',
          'en_revision'
        ]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const requests = await findAdoptionRequestsByOwner(null);
  return requests.find((request) => Number(request.id) === Number(id)) || null;
}

module.exports = {
  createPet,
  findAdoptionRequestById,
  findAdoptionRequestsByOwner,
  findPetById,
  findPetsByOwner,
  getDashboardSummary,
  softDeletePet,
  updateAdoptionRequestStatus,
  updatePet,
  updatePetStatus
};
