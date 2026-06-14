const db = require('../../config/database');

let hasPetModificationsTableCache = null;

async function hasPetModificationsTable() {
  if (hasPetModificationsTableCache === true) {
    return true;
  }

  const [[row]] = await db.query(
    `SELECT COUNT(*) AS total
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?`,
    ['mascota_modificaciones']
  );

  const exists = Number(row?.total || 0) > 0;
  hasPetModificationsTableCache = exists ? true : null;
  return exists;
}

async function pendingModificationExclusion(alias = 'm') {
  if (!(await hasPetModificationsTable())) {
    return '';
  }

  return `
      AND NOT EXISTS (
        SELECT 1
        FROM mascota_modificaciones pm_filter
        WHERE pm_filter.mascota_id = ${alias}.id
          AND pm_filter.estado = 'en_revision'
      )`;
}

async function findAvailablePets() {
  const modificationExclusion = await pendingModificationExclusion('m');
  const [rows] = await db.query(
    `SELECT
      m.id,
      m.publicado_por_usuario_id,
      m.publicado_por_nombre,
      COALESCE(NULLIF(m.publicado_por_nombre, ''), u.nombre) AS publicada_por,
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
      m.created_at,
      m.updated_at
    FROM mascotas m
    INNER JOIN usuarios u
      ON m.publicado_por_usuario_id = u.id
    WHERE m.estado = ?
      AND m.eliminada_at IS NULL
      ${modificationExclusion}
    ORDER BY m.created_at DESC, m.id DESC`,
    ['disponible']
  );

  return rows;
}

async function findPetById(id) {
  const modificationExclusion = await pendingModificationExclusion('m');
  const [rows] = await db.query(
    `SELECT
      m.id,
      m.publicado_por_usuario_id,
      m.publicado_por_nombre,
      COALESCE(NULLIF(m.publicado_por_nombre, ''), u.nombre) AS publicada_por,
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
      m.created_at,
      m.updated_at
    FROM mascotas m
    INNER JOIN usuarios u
      ON m.publicado_por_usuario_id = u.id
    WHERE m.id = ?
      AND m.estado = ?
      AND m.eliminada_at IS NULL
      ${modificationExclusion}
    LIMIT 1`,
    [id, 'disponible']
  );

  return rows[0] || null;
}

module.exports = { findAvailablePets, findPetById };
