const db = require('../../config/database');
const { buildAgeMonthsSql, buildAgeYearsSql } = require('../../utils/petAge');

async function findUserById(id) {
  const [rows] = await db.query(
    `SELECT
      id,
      nombre,
      email,
      telefono,
      rut,
      region,
      ciudad,
      comuna,
      direccion,
      numeracion,
      complemento_direccion,
      rol,
      estado
    FROM usuarios
    WHERE id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function findPetById(id) {
  const [rows] = await db.query(
    `SELECT id, nombre, estado, publicado_por_usuario_id
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
      motivo_estado,
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
      a.telefono AS adoptante_telefono,
      a.rut AS adoptante_rut,
      a.region AS adoptante_region,
      a.ciudad AS adoptante_ciudad,
      a.comuna AS adoptante_comuna,
      a.direccion AS adoptante_direccion,
      a.numeracion AS adoptante_numeracion,
      a.complemento_direccion AS adoptante_complemento_direccion,
      m.nombre AS mascota_nombre,
      m.especie AS mascota_especie,
      m.publicado_por_usuario_id,
      s.estado,
      s.motivo_estado,
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

async function findAdoptionRequestsByFoundationUserId(userId) {
  const [rows] = await db.query(
    `SELECT
      s.id,
      s.mascota_id,
      m.nombre AS mascota_nombre,
      m.especie AS mascota_especie,
      m.publicado_por_usuario_id,
      s.adoptante_usuario_id,
      a.nombre AS adoptante_nombre,
      a.email AS adoptante_email,
      a.telefono AS adoptante_telefono,
      a.rut AS adoptante_rut,
      a.region AS adoptante_region,
      a.ciudad AS adoptante_ciudad,
      a.comuna AS adoptante_comuna,
      a.direccion AS adoptante_direccion,
      a.numeracion AS adoptante_numeracion,
      a.complemento_direccion AS adoptante_complemento_direccion,
      s.estado,
      s.motivo_estado,
      s.mensaje,
      s.created_at AS fecha_creacion,
      s.updated_at
    FROM solicitudes_adopcion s
    INNER JOIN usuarios a
      ON s.adoptante_usuario_id = a.id
    INNER JOIN mascotas m
      ON s.mascota_id = m.id
    WHERE m.publicado_por_usuario_id = ?
      AND m.eliminada_at IS NULL
    ORDER BY s.created_at DESC, s.id DESC`,
    [userId]
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
      a.telefono AS adoptante_telefono,
      a.rut AS adoptante_rut,
      a.region AS adoptante_region,
      a.ciudad AS adoptante_ciudad,
      a.comuna AS adoptante_comuna,
      a.direccion AS adoptante_direccion,
      a.numeracion AS adoptante_numeracion,
      a.complemento_direccion AS adoptante_complemento_direccion,
      s.mascota_id,
      m.publicado_por_usuario_id,
      m.nombre AS mascota_nombre,
      m.especie AS mascota_especie,
      m.raza AS mascota_raza,
      ${buildAgeYearsSql('m', 'mascota_edad_anios')},
      ${buildAgeMonthsSql('m', 'mascota_edad_meses')},
      m.fecha_nacimiento_estimada AS mascota_fecha_nacimiento_estimada,
      m.tamano AS mascota_tamano,
      m.foto_url AS mascota_foto_url,
      s.estado,
      s.motivo_estado,
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

async function findAdoptionRequestAccessById(id) {
  const [rows] = await db.query(
    `SELECT
      s.id,
      s.adoptante_usuario_id,
      s.mascota_id,
      s.estado,
      s.motivo_estado,
      m.publicado_por_usuario_id
    FROM solicitudes_adopcion s
    INNER JOIN mascotas m
      ON s.mascota_id = m.id
    WHERE s.id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function findAdoptionRequestsByUserId(userId) {
  const [rows] = await db.query(
    `SELECT
      s.id,
      s.adoptante_usuario_id,
      s.mascota_id,
      m.nombre AS mascota_nombre,
      m.especie AS mascota_especie,
      m.raza AS mascota_raza,
      ${buildAgeYearsSql('m', 'mascota_edad_anios')},
      ${buildAgeMonthsSql('m', 'mascota_edad_meses')},
      m.fecha_nacimiento_estimada AS mascota_fecha_nacimiento_estimada,
      m.tamano AS mascota_tamano,
      m.foto_url AS mascota_foto_url,
      s.estado,
      s.motivo_estado,
      s.mensaje,
      s.created_at AS fecha_creacion,
      s.updated_at
    FROM solicitudes_adopcion s
    INNER JOIN mascotas m
      ON s.mascota_id = m.id
    WHERE s.adoptante_usuario_id = ?
    ORDER BY s.created_at DESC, s.id DESC`,
    [userId]
  );

  return rows;
}

async function findActiveAdoptionRequestByUserId(userId) {
  const [rows] = await db.query(
    `SELECT
      s.id,
      s.adoptante_usuario_id,
      s.mascota_id,
      m.nombre AS mascota_nombre,
      m.especie AS mascota_especie,
      s.estado,
      s.created_at AS fecha_creacion
    FROM solicitudes_adopcion s
    INNER JOIN mascotas m
      ON s.mascota_id = m.id
    WHERE s.adoptante_usuario_id = ?
    ORDER BY s.created_at DESC, s.id DESC
    LIMIT 1`,
    [userId]
  );

  const latestRequest = rows[0] || null;

  if (!latestRequest || !['pendiente', 'en_revision'].includes(latestRequest.estado)) {
    return null;
  }

  return latestRequest;
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

async function updateAdoptionRequestStatus(id, estado, motivoEstado = null) {
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
      SET estado = ?, motivo_estado = ?
      WHERE id = ?`,
      [estado, motivoEstado, id]
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
        SET
          estado = ?,
          motivo_estado = COALESCE(motivo_estado, ?)
        WHERE mascota_id = ?
          AND id <> ?
          AND estado IN (?, ?)`,
        [
          'rechazada',
          'Otra postulación fue aprobada para esta mascota.',
          solicitud.mascota_id,
          solicitud.id,
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

  return findAdoptionRequestDetailById(id);
}

async function cancelOwnActiveAdoptionRequest(id, userId, motivoEstado) {
  const [result] = await db.query(
    `UPDATE solicitudes_adopcion
    SET estado = ?, motivo_estado = ?
    WHERE id = ?
      AND adoptante_usuario_id = ?
      AND estado IN ('pendiente', 'en_revision')`,
    ['rechazada', motivoEstado, id, userId]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findAdoptionRequestDetailById(id);
}

module.exports = {
  cancelOwnActiveAdoptionRequest,
  createAdoptionRequest,
  findAdoptionRequestAccessById,
  findAdoptionRequestDetailById,
  findAdoptionRequests,
  findAdoptionRequestsByFoundationUserId,
  findAdoptionRequestsByUserId,
  findActiveAdoptionRequestByUserId,
  findPetById,
  findUserById,
  updateAdoptionRequestStatus
};
