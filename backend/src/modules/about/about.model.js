const db = require('../../config/database');

let hasAdoptionsTableCache = null;

async function hasAdoptionsTable() {
  if (hasAdoptionsTableCache === true) {
    return true;
  }

  const [[row]] = await db.query(
    `SELECT COUNT(*) AS total
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?`,
    ['adopciones']
  );

  const exists = Number(row?.total || 0) > 0;
  hasAdoptionsTableCache = exists ? true : null;
  return exists;
}

async function getAdoptedPetFallbackStats() {
  const [[row]] = await db.query(
    `SELECT COUNT(*) AS total
    FROM mascotas
    WHERE estado = ?
      AND eliminada_at IS NULL`,
    ['adoptada']
  );
  const total = Number(row?.total || 0);

  return {
    familiasFelices: total,
    mascotasAdoptadas: total
  };
}

async function getAboutStats() {
  if (!(await hasAdoptionsTable())) {
    return getAdoptedPetFallbackStats();
  }

  const [[row]] = await db.query(
    `SELECT
      COUNT(DISTINCT mascota_id) AS mascotas_adoptadas,
      COUNT(DISTINCT adoptante_usuario_id) AS familias_felices
    FROM adopciones
    WHERE estado IN (?, ?)`,
    ['activa', 'finalizada']
  );

  return {
    familiasFelices: Number(row?.familias_felices || 0),
    mascotasAdoptadas: Number(row?.mascotas_adoptadas || 0)
  };
}

module.exports = {
  getAboutStats
};
