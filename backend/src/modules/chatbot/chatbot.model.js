const db = require('../../config/database');

async function findActiveQuestions() {
  const [rows] = await db.query(
    `SELECT
      p.id,
      p.pregunta,
      p.categoria,
      p.estado,
      r.respuesta
    FROM chatbot_preguntas p
    LEFT JOIN chatbot_respuestas r
      ON r.pregunta_id = p.id
      AND r.estado = ?
    WHERE p.estado = ?
    ORDER BY p.id ASC`,
    ['activa', 'activa']
  );

  return rows;
}

module.exports = {
  findActiveQuestions
};
