const db = require('../../config/database');

function mapDonation(row) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    monto: Number(row.monto),
    total_donado: row.total_donado !== undefined ? Number(row.total_donado) : undefined
  };
}

async function findUserById(id) {
  const [rows] = await db.query(
    `SELECT id, nombre, email, estado
    FROM usuarios
    WHERE id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function findDonationById(id) {
  const [rows] = await db.query(
    `SELECT
      d.id,
      d.usuario_id,
      u.nombre AS usuario_nombre,
      d.monto,
      d.moneda,
      d.metodo_pago,
      d.estado,
      d.referencia_pago,
      d.mensaje,
      d.created_at,
      d.updated_at
    FROM donaciones d
    LEFT JOIN usuarios u
      ON d.usuario_id = u.id
    WHERE d.id = ?
    LIMIT 1`,
    [id]
  );

  return mapDonation(rows[0]);
}

async function createDonation({
  usuarioId,
  monto,
  metodoPago,
  mensaje,
  referenciaPago
}) {
  const [result] = await db.query(
    `INSERT INTO donaciones
      (usuario_id, monto, moneda, metodo_pago, estado, referencia_pago, mensaje)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      usuarioId,
      monto,
      'CLP',
      metodoPago,
      'completada',
      referenciaPago,
      mensaje
    ]
  );

  return findDonationById(result.insertId);
}

async function findDonations() {
  const [rows] = await db.query(
    `SELECT
      d.id,
      d.usuario_id,
      u.nombre AS usuario_nombre,
      d.monto,
      d.moneda,
      d.metodo_pago,
      d.estado,
      d.referencia_pago,
      d.mensaje,
      d.created_at
    FROM donaciones d
    LEFT JOIN usuarios u
      ON d.usuario_id = u.id
    ORDER BY d.created_at DESC, d.id DESC`
  );

  return rows.map(mapDonation);
}

async function getDonationSummary() {
  const [summaryRows] = await db.query(
    `SELECT
      COALESCE(SUM(CASE WHEN estado = 'completada' THEN monto ELSE 0 END), 0) AS total_donado,
      COUNT(*) AS cantidad_donaciones
    FROM donaciones`
  );

  const [latestRows] = await db.query(
    `SELECT
      d.id,
      d.usuario_id,
      u.nombre AS usuario_nombre,
      d.monto,
      d.moneda,
      d.metodo_pago,
      d.estado,
      d.referencia_pago,
      d.created_at
    FROM donaciones d
    LEFT JOIN usuarios u
      ON d.usuario_id = u.id
    ORDER BY d.created_at DESC, d.id DESC
    LIMIT 5`
  );

  return {
    total_donado: Number(summaryRows[0]?.total_donado ?? 0),
    cantidad_donaciones: Number(summaryRows[0]?.cantidad_donaciones ?? 0),
    ultimas_donaciones: latestRows.map(mapDonation)
  };
}

module.exports = {
  createDonation,
  findDonationById,
  findDonations,
  findUserById,
  getDonationSummary
};
