const db = require('../../config/database');

async function findMatchablePets() {
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
      m.created_at,
      m.updated_at
    FROM mascotas m
    INNER JOIN usuarios u
      ON m.publicado_por_usuario_id = u.id
    WHERE m.estado = ?
    ORDER BY m.created_at DESC, m.id DESC`,
    ['disponible']
  );

  return rows;
}

module.exports = {
  findMatchablePets
};
