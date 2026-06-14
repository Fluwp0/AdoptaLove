const db = require('../../config/database');

async function getMetrics() {
  const [[userMetrics]] = await db.query(
    `SELECT COUNT(*) AS usuarios_registrados
    FROM usuarios`
  );

  const [[petMetrics]] = await db.query(
    `SELECT
      COUNT(*) AS mascotas_publicadas,
      SUM(CASE WHEN estado = 'disponible' THEN 1 ELSE 0 END) AS mascotas_disponibles
    FROM mascotas
    WHERE eliminada_at IS NULL`
  );

  const [[requestMetrics]] = await db.query(
    `SELECT
      COUNT(*) AS postulaciones_total,
      SUM(CASE WHEN estado IN ('pendiente', 'en_revision') THEN 1 ELSE 0 END) AS postulaciones_pendientes
    FROM solicitudes_adopcion`
  );

  const [[donationMetrics]] = await db.query(
    `SELECT COALESCE(SUM(CASE WHEN estado = 'completada' THEN monto ELSE 0 END), 0) AS total_donado
    FROM donaciones`
  );

  return {
    usuariosRegistrados: Number(userMetrics?.usuarios_registrados || 0),
    mascotasPublicadas: Number(petMetrics?.mascotas_publicadas || 0),
    mascotasDisponibles: Number(petMetrics?.mascotas_disponibles || 0),
    postulacionesTotal: Number(requestMetrics?.postulaciones_total || 0),
    postulacionesPendientes: Number(requestMetrics?.postulaciones_pendientes || 0),
    totalDonado: Number(donationMetrics?.total_donado || 0)
  };
}

async function createPet(pet) {
  const [result] = await db.query(
    `INSERT INTO mascotas
      (
        publicado_por_usuario_id,
        publicado_por_nombre,
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
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      pet.publicadoPorUsuarioId,
      pet.publicadoPorNombre,
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

async function findPetById(id) {
  const [rows] = await db.query(
    `SELECT
      id,
      publicado_por_usuario_id,
      publicado_por_nombre,
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
      created_at,
      updated_at
    FROM mascotas
    WHERE id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

module.exports = {
  createPet,
  getMetrics
};