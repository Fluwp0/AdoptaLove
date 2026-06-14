const db = require('../../config/database');

const PUBLIC_USER_FIELDS = `
  id,
  nombre,
  email,
  rut,
  telefono,
  direccion,
  ciudad,
  comuna,
  numeracion,
  red_social_tipo,
  red_social_valor,
  rol,
  estado,
  eliminado_at,
  motivo_eliminacion,
  created_at,
  updated_at
`;

const NORMALIZED_RUT_SQL = `
  UPPER(REPLACE(REPLACE(REPLACE(COALESCE(rut, ''), '.', ''), '-', ''), ' ', ''))
`;

const NORMALIZED_RUT_PARAM_SQL = `
  UPPER(REPLACE(REPLACE(REPLACE(?, '.', ''), '-', ''), ' ', ''))
`;

let hasMotivoRevisionColumnCache = null;
let hasPetModificationsTableCache = null;
let hasPetModificationPreviousStatusColumnCache = null;

async function hasMotivoRevisionColumn() {
  if (hasMotivoRevisionColumnCache === true) {
    return true;
  }

  const [[row]] = await db.query(
    `SELECT COUNT(*) AS total
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?`,
    ['mascotas', 'motivo_revision']
  );

  const exists = Number(row?.total || 0) > 0;
  hasMotivoRevisionColumnCache = exists ? true : null;
  return exists;
}

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

async function hasPetModificationPreviousStatusColumn() {
  if (hasPetModificationPreviousStatusColumnCache === true) {
    return true;
  }

  const [[row]] = await db.query(
    `SELECT COUNT(*) AS total
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?`,
    ['mascota_modificaciones', 'estado_mascota_anterior']
  );

  const exists = Number(row?.total || 0) > 0;
  hasPetModificationPreviousStatusColumnCache = exists ? true : null;
  return exists;
}

async function petReviewReasonSelect(alias = 'm') {
  return (await hasMotivoRevisionColumn()) ? `${alias}.motivo_revision` : 'NULL';
}

async function petModificationPreviousStatusSelect(alias = 'pm') {
  return (await hasPetModificationPreviousStatusColumn())
    ? `${alias}.estado_mascota_anterior`
    : "'disponible'";
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

function createMissingReviewReasonColumnError() {
  const error = new Error(
    'Debes ejecutar la migración 007_pet_review_reason.sql antes de revisar publicaciones.'
  );
  error.statusCode = 500;
  return error;
}

function createMissingModificationsTableError() {
  const error = new Error(
    'Debes ejecutar la migración 008_pet_modification_requests.sql antes de revisar modificaciones.'
  );
  error.statusCode = 500;
  return error;
}

function parseModificationData(value) {
  if (!value) {
    return {};
  }

  if (typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (_error) {
    return {};
  }
}

function mapModificationRow(row) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    datos_propuestos: parseModificationData(row.datos_propuestos)
  };
}

function getRestoredPetStatus(status) {
  const normalizedStatus = String(status || '').trim();

  if (!normalizedStatus || normalizedStatus === 'en_revision') {
    return 'disponible';
  }

  return normalizedStatus;
}

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

function removeDiacritics(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function buildUserSearch(search = '') {
  const term = String(search || '').trim().toLowerCase();

  if (!term) {
    return {
      clause: '',
      params: []
    };
  }

  const likeTerm = `%${term}%`;
  const normalizedTerm = removeDiacritics(term);
  const normalizedRutTerm = normalizedTerm.replace(/[.\-\s]/g, '');
  const roleLikeTerm = `%${normalizedTerm}%`;
  const rutLikeTerm = normalizedRutTerm ? `%${normalizedRutTerm}%` : likeTerm;

  return {
    clause: `
    WHERE (
      LOWER(COALESCE(nombre, '')) LIKE ?
      OR LOWER(COALESCE(email, '')) LIKE ?
      OR LOWER(${NORMALIZED_RUT_SQL}) LIKE ?
      OR LOWER(COALESCE(rol, '')) LIKE ?
      OR LOWER(COALESCE(ciudad, '')) LIKE ?
      OR LOWER(COALESCE(comuna, '')) LIKE ?
    )`,
    params: [likeTerm, likeTerm, rutLikeTerm, roleLikeTerm, likeTerm, likeTerm]
  };
}

async function countUsers({ search = '' } = {}) {
  const searchFilter = buildUserSearch(search);
  const [[row]] = await db.query(
    `SELECT COUNT(*) AS total
    FROM usuarios
    ${searchFilter.clause}`,
    searchFilter.params
  );

  return Number(row?.total || 0);
}

async function findUsers({ limit, offset, search = '' }) {
  const searchFilter = buildUserSearch(search);
  const [rows] = await db.query(
    `SELECT ${PUBLIC_USER_FIELDS}
    FROM usuarios
    ${searchFilter.clause}
    ORDER BY created_at DESC, id DESC
    LIMIT ? OFFSET ?`,
    [...searchFilter.params, limit, offset]
  );

  return rows;
}

async function findUserById(id) {
  const [rows] = await db.query(
    `SELECT ${PUBLIC_USER_FIELDS}
    FROM usuarios
    WHERE id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function findUserByEmail(email) {
  const [rows] = await db.query(
    `SELECT ${PUBLIC_USER_FIELDS}
    FROM usuarios
    WHERE LOWER(TRIM(email)) = ?
    LIMIT 1`,
    [email]
  );

  return rows[0] || null;
}

async function findUserByEmailExceptId(email, id) {
  const [rows] = await db.query(
    `SELECT ${PUBLIC_USER_FIELDS}
    FROM usuarios
    WHERE LOWER(TRIM(email)) = ?
      AND id <> ?
    LIMIT 1`,
    [email, id]
  );

  return rows[0] || null;
}

async function findUserByRut(rut) {
  const [rows] = await db.query(
    `SELECT ${PUBLIC_USER_FIELDS}
    FROM usuarios
    WHERE ${NORMALIZED_RUT_SQL} = ${NORMALIZED_RUT_PARAM_SQL}
    LIMIT 1`,
    [rut]
  );

  return rows[0] || null;
}

async function findUserByRutExceptId(rut, id) {
  const [rows] = await db.query(
    `SELECT ${PUBLIC_USER_FIELDS}
    FROM usuarios
    WHERE ${NORMALIZED_RUT_SQL} = ${NORMALIZED_RUT_PARAM_SQL}
      AND id <> ?
    LIMIT 1`,
    [rut, id]
  );

  return rows[0] || null;
}

async function createUser(user) {
  const [result] = await db.query(
    `INSERT INTO usuarios
      (
        nombre,
        email,
        rut,
        password_hash,
        telefono,
        direccion,
        ciudad,
        comuna,
        numeracion,
        red_social_tipo,
        red_social_valor,
        rol,
        estado
      )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.nombre,
      user.email,
      user.rut,
      user.passwordHash,
      user.telefono,
      user.direccion,
      user.ciudad,
      user.comuna,
      user.numeracion,
      user.redSocialTipo,
      user.redSocialValor,
      user.rol,
      user.estado
    ]
  );

  return findUserById(result.insertId);
}

async function updateUser(id, user) {
  const fields = [
    'nombre = ?',
    'email = ?',
    'rut = ?',
    'telefono = ?',
    'direccion = ?',
    'ciudad = ?',
    'comuna = ?',
    'numeracion = ?',
    'red_social_tipo = ?',
    'red_social_valor = ?',
    'rol = ?',
    'estado = ?',
    'eliminado_at = CASE WHEN ? = ? THEN NULL ELSE eliminado_at END',
    'motivo_eliminacion = CASE WHEN ? = ? THEN NULL ELSE motivo_eliminacion END'
  ];
  const values = [
    user.nombre,
    user.email,
    user.rut,
    user.telefono,
    user.direccion,
    user.ciudad,
    user.comuna,
    user.numeracion,
    user.redSocialTipo,
    user.redSocialValor,
    user.rol,
    user.estado,
    user.estado,
    'activo',
    user.estado,
    'activo'
  ];

  if (user.passwordHash) {
    fields.push('password_hash = ?');
    values.push(user.passwordHash);
  }

  values.push(id);

  await db.query(
    `UPDATE usuarios
    SET ${fields.join(', ')}
    WHERE id = ?`,
    values
  );

  return findUserById(id);
}

async function deactivateUser(id, motivoEliminacion) {
  await db.query(
    `UPDATE usuarios
    SET
      estado = ?,
      eliminado_at = CURRENT_TIMESTAMP,
      motivo_eliminacion = ?
    WHERE id = ?`,
    ['inactivo', motivoEliminacion, id]
  );

  return findUserById(id);
}

function buildPetPublicationSearch(search = '') {
  const term = String(search || '').trim().toLowerCase();

  if (!term) {
    return {
      clause: '',
      params: []
    };
  }

  const likeTerm = `%${term}%`;

  return {
    clause: `
      AND (
        LOWER(m.nombre) LIKE ?
        OR LOWER(m.especie) LIKE ?
        OR LOWER(COALESCE(NULLIF(m.publicado_por_nombre, ''), u.nombre)) LIKE ?
        OR LOWER(m.estado) LIKE ?
      )`,
    params: [likeTerm, likeTerm, likeTerm, likeTerm]
  };
}

async function countPetPublications({ search = '' } = {}) {
  const searchFilter = buildPetPublicationSearch(search);
  const modificationExclusion = await pendingModificationExclusion('m');
  const [[row]] = await db.query(
    `SELECT COUNT(*) AS total
    FROM mascotas m
    INNER JOIN usuarios u
      ON m.publicado_por_usuario_id = u.id
    WHERE m.eliminada_at IS NULL
      ${modificationExclusion}
      ${searchFilter.clause}`,
    searchFilter.params
  );

  return Number(row?.total || 0);
}

async function findPetsPendingReview() {
  return findPetPublications({ limit: 100, offset: 0, search: 'en_revision' });
}

async function findPetPublications({ limit, offset, search = '' }) {
  const searchFilter = buildPetPublicationSearch(search);
  const motivoRevisionSelect = await petReviewReasonSelect('m');
  const modificationExclusion = await pendingModificationExclusion('m');
  const [rows] = await db.query(
    `SELECT
      m.id,
      m.publicado_por_usuario_id,
      m.publicado_por_nombre,
      COALESCE(NULLIF(m.publicado_por_nombre, ''), u.nombre) AS publicada_por,
      u.email AS fundacion_email,
      u.rol AS publicador_rol,
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
      ${motivoRevisionSelect} AS motivo_revision,
      m.created_at,
      m.updated_at
    FROM mascotas m
    INNER JOIN usuarios u
      ON m.publicado_por_usuario_id = u.id
    WHERE m.eliminada_at IS NULL
      ${modificationExclusion}
      ${searchFilter.clause}
    ORDER BY
      CASE WHEN m.estado = 'en_revision' AND u.rol = 'fundacion' THEN 0 ELSE 1 END,
      m.updated_at DESC,
      m.id DESC
    LIMIT ? OFFSET ?`,
    [...searchFilter.params, limit, offset]
  );

  return rows;
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
  const motivoRevisionSelect = await petReviewReasonSelect('m');
  const [rows] = await db.query(
    `SELECT
      m.id,
      m.publicado_por_usuario_id,
      m.publicado_por_nombre,
      COALESCE(NULLIF(m.publicado_por_nombre, ''), u.nombre) AS publicada_por,
      u.email AS fundacion_email,
      u.rol AS publicador_rol,
      m.nombre,
      m.especie,
      m.raza,
      m.sexo,
      m.edad_anios,
      m.edad_meses,
      m.tamano,
      m.descripcion,
      m.estado,
      m.foto_url,
      ${motivoRevisionSelect} AS motivo_revision,
      m.eliminada_at,
      m.created_at,
      m.updated_at
    FROM mascotas m
    INNER JOIN usuarios u
      ON m.publicado_por_usuario_id = u.id
    WHERE m.id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function updatePet(id, pet) {
  const fields = [
    'publicado_por_nombre = ?',
    'nombre = ?',
    'especie = ?',
    'raza = ?',
    'sexo = ?',
    'edad_anios = ?',
    'edad_meses = ?',
    'tamano = ?',
    'descripcion = ?',
    'foto_url = ?',
    'estado = ?'
  ];
  const values = [
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
  ];

  if (await hasMotivoRevisionColumn()) {
    fields.push('motivo_revision = ?');
    values.push(pet.motivoRevision);
  }

  values.push(id);

  await db.query(
    `UPDATE mascotas
    SET ${fields.join(', ')}
    WHERE id = ?
      AND eliminada_at IS NULL`,
    values
  );

  return findPetById(id);
}

async function updatePetStatus(id, estado, motivoRevision = null) {
  if (!(await hasMotivoRevisionColumn())) {
    throw createMissingReviewReasonColumnError();
  }

  await db.query(
    `UPDATE mascotas
    SET
      estado = ?,
      motivo_revision = ?
    WHERE id = ?
      AND eliminada_at IS NULL`,
    [estado, motivoRevision, id]
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

  return findPetById(id);
}

function buildModificationSearch(search = '') {
  const term = String(search || '').trim().toLowerCase();

  if (!term) {
    return {
      clause: '',
      params: []
    };
  }

  const likeTerm = `%${term}%`;

  return {
    clause: `
      AND (
        LOWER(m.nombre) LIKE ?
        OR LOWER(m.especie) LIKE ?
        OR LOWER(u.nombre) LIKE ?
        OR LOWER(pm.estado) LIKE ?
        OR LOWER(pm.datos_propuestos) LIKE ?
      )`,
    params: [likeTerm, likeTerm, likeTerm, likeTerm, likeTerm]
  };
}

async function countPetModificationRequests({ search = '' } = {}) {
  if (!(await hasPetModificationsTable())) {
    return 0;
  }

  const searchFilter = buildModificationSearch(search);
  const [[row]] = await db.query(
    `SELECT COUNT(*) AS total
    FROM mascota_modificaciones pm
    INNER JOIN mascotas m
      ON pm.mascota_id = m.id
    INNER JOIN usuarios u
      ON pm.fundacion_usuario_id = u.id
    WHERE m.eliminada_at IS NULL
      ${searchFilter.clause}`,
    searchFilter.params
  );

  return Number(row?.total || 0);
}

async function findPetModificationRequests({ limit, offset, search = '' }) {
  if (!(await hasPetModificationsTable())) {
    return [];
  }

  const searchFilter = buildModificationSearch(search);
  const previousStatusSelect = await petModificationPreviousStatusSelect('pm');
  const [rows] = await db.query(
    `SELECT
      pm.id,
      pm.mascota_id,
      pm.fundacion_usuario_id,
      pm.datos_propuestos,
      pm.estado,
      ${previousStatusSelect} AS estado_mascota_anterior,
      pm.motivo_revision,
      pm.revisado_por_usuario_id,
      pm.created_at,
      pm.updated_at,
      m.nombre AS mascota_nombre_actual,
      m.especie AS mascota_especie_actual,
      m.raza AS mascota_raza_actual,
      m.sexo AS mascota_sexo_actual,
      m.edad_anios AS mascota_edad_anios_actual,
      m.edad_meses AS mascota_edad_meses_actual,
      m.tamano AS mascota_tamano_actual,
      m.descripcion AS mascota_descripcion_actual,
      m.foto_url AS mascota_foto_url_actual,
      m.estado AS mascota_estado_actual,
      u.nombre AS fundacion_nombre,
      u.email AS fundacion_email
    FROM mascota_modificaciones pm
    INNER JOIN mascotas m
      ON pm.mascota_id = m.id
    INNER JOIN usuarios u
      ON pm.fundacion_usuario_id = u.id
    WHERE m.eliminada_at IS NULL
      ${searchFilter.clause}
    ORDER BY
      CASE WHEN pm.estado = 'en_revision' THEN 0 ELSE 1 END,
      pm.updated_at DESC,
      pm.id DESC
    LIMIT ? OFFSET ?`,
    [...searchFilter.params, limit, offset]
  );

  return rows.map(mapModificationRow);
}

async function findPetModificationRequestById(id) {
  if (!(await hasPetModificationsTable())) {
    return null;
  }

  const previousStatusSelect = await petModificationPreviousStatusSelect('pm');
  const [rows] = await db.query(
    `SELECT
      pm.id,
      pm.mascota_id,
      pm.fundacion_usuario_id,
      pm.datos_propuestos,
      pm.estado,
      ${previousStatusSelect} AS estado_mascota_anterior,
      pm.motivo_revision,
      pm.revisado_por_usuario_id,
      pm.created_at,
      pm.updated_at,
      m.nombre AS mascota_nombre_actual,
      m.especie AS mascota_especie_actual,
      m.raza AS mascota_raza_actual,
      m.sexo AS mascota_sexo_actual,
      m.edad_anios AS mascota_edad_anios_actual,
      m.edad_meses AS mascota_edad_meses_actual,
      m.tamano AS mascota_tamano_actual,
      m.descripcion AS mascota_descripcion_actual,
      m.foto_url AS mascota_foto_url_actual,
      m.estado AS mascota_estado_actual,
      m.publicado_por_nombre AS mascota_publicado_por_nombre_actual,
      u.nombre AS fundacion_nombre,
      u.email AS fundacion_email
    FROM mascota_modificaciones pm
    INNER JOIN mascotas m
      ON pm.mascota_id = m.id
    INNER JOIN usuarios u
      ON pm.fundacion_usuario_id = u.id
    WHERE pm.id = ?
    LIMIT 1`,
    [id]
  );

  return mapModificationRow(rows[0]);
}

async function approvePetModificationRequest(id, motivoRevision, reviewerId) {
  if (!(await hasPetModificationsTable())) {
    throw createMissingModificationsTableError();
  }

  const previousStatusSelect = await petModificationPreviousStatusSelect('pm');
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT
        pm.id,
        pm.mascota_id,
        pm.datos_propuestos,
        pm.estado,
        ${previousStatusSelect} AS estado_mascota_anterior,
        m.nombre AS mascota_nombre_actual,
        m.especie AS mascota_especie_actual,
        m.raza AS mascota_raza_actual,
        m.sexo AS mascota_sexo_actual,
        m.edad_anios AS mascota_edad_anios_actual,
        m.edad_meses AS mascota_edad_meses_actual,
        m.tamano AS mascota_tamano_actual,
        m.descripcion AS mascota_descripcion_actual,
        m.foto_url AS mascota_foto_url_actual,
        m.publicado_por_nombre AS mascota_publicado_por_nombre_actual
      FROM mascota_modificaciones pm
      INNER JOIN mascotas m
        ON pm.mascota_id = m.id
      WHERE pm.id = ?
        AND m.eliminada_at IS NULL
      LIMIT 1
      FOR UPDATE`,
      [id]
    );
    const request = rows[0];

    if (!request || request.estado !== 'en_revision') {
      await connection.rollback();
      return null;
    }

    const proposed = parseModificationData(request.datos_propuestos);
    const restoredPetStatus = getRestoredPetStatus(request.estado_mascota_anterior);

    await connection.query(
      `UPDATE mascotas
      SET
        publicado_por_nombre = ?,
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
      WHERE id = ?
        AND eliminada_at IS NULL`,
      [
        proposed.publicado_por_nombre ?? request.mascota_publicado_por_nombre_actual,
        proposed.nombre ?? request.mascota_nombre_actual,
        proposed.especie ?? request.mascota_especie_actual,
        proposed.raza ?? request.mascota_raza_actual,
        proposed.sexo ?? request.mascota_sexo_actual,
        proposed.edad_anios ?? request.mascota_edad_anios_actual,
        proposed.edad_meses ?? request.mascota_edad_meses_actual,
        proposed.tamano ?? request.mascota_tamano_actual,
        proposed.descripcion ?? request.mascota_descripcion_actual,
        proposed.foto_url ?? request.mascota_foto_url_actual,
        restoredPetStatus,
        request.mascota_id
      ]
    );

    await connection.query(
      `UPDATE mascota_modificaciones
      SET
        estado = ?,
        motivo_revision = ?,
        revisado_por_usuario_id = ?
      WHERE id = ?`,
      ['aprobada', motivoRevision, reviewerId, id]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return findPetModificationRequestById(id);
}

async function rejectPetModificationRequest(id, motivoRevision, reviewerId) {
  if (!(await hasPetModificationsTable())) {
    throw createMissingModificationsTableError();
  }

  const previousStatusSelect = await petModificationPreviousStatusSelect('pm');
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT
        pm.id,
        pm.mascota_id,
        pm.estado,
        ${previousStatusSelect} AS estado_mascota_anterior
      FROM mascota_modificaciones pm
      INNER JOIN mascotas m
        ON pm.mascota_id = m.id
      WHERE pm.id = ?
        AND m.eliminada_at IS NULL
      LIMIT 1
      FOR UPDATE`,
      [id]
    );
    const request = rows[0];

    if (!request || request.estado !== 'en_revision') {
      await connection.rollback();
      return null;
    }

    await connection.query(
      `UPDATE mascota_modificaciones
      SET
        estado = ?,
        motivo_revision = ?,
        revisado_por_usuario_id = ?
      WHERE id = ?`,
      ['rechazada', motivoRevision, reviewerId, id]
    );

    await connection.query(
      `UPDATE mascotas
      SET estado = ?
      WHERE id = ?
        AND eliminada_at IS NULL`,
      [getRestoredPetStatus(request.estado_mascota_anterior), request.mascota_id]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return findPetModificationRequestById(id);
}

async function discardPetModificationRequest(id, reviewerId) {
  if (!(await hasPetModificationsTable())) {
    throw createMissingModificationsTableError();
  }

  const previousStatusSelect = await petModificationPreviousStatusSelect('pm');
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT
        pm.id,
        pm.mascota_id,
        pm.estado,
        ${previousStatusSelect} AS estado_mascota_anterior
      FROM mascota_modificaciones pm
      INNER JOIN mascotas m
        ON pm.mascota_id = m.id
      WHERE pm.id = ?
        AND m.eliminada_at IS NULL
      LIMIT 1
      FOR UPDATE`,
      [id]
    );
    const request = rows[0];

    if (!request) {
      await connection.rollback();
      return null;
    }

    await connection.query(
      `UPDATE mascota_modificaciones
      SET
        estado = ?,
        motivo_revision = COALESCE(motivo_revision, ?),
        revisado_por_usuario_id = ?
      WHERE id = ?`,
      ['descartada', 'Solicitud descartada por administrador.', reviewerId, id]
    );

    if (request.estado === 'en_revision') {
      await connection.query(
        `UPDATE mascotas
        SET estado = ?
        WHERE id = ?
          AND eliminada_at IS NULL`,
        [getRestoredPetStatus(request.estado_mascota_anterior), request.mascota_id]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return findPetModificationRequestById(id);
}

module.exports = {
  approvePetModificationRequest,
  countPetModificationRequests,
  countPetPublications,
  countUsers,
  createPet,
  createUser,
  deactivateUser,
  discardPetModificationRequest,
  findPetById,
  findPetModificationRequestById,
  findPetModificationRequests,
  findPetPublications,
  findPetsPendingReview,
  findUserByEmail,
  findUserByEmailExceptId,
  findUserById,
  findUserByRut,
  findUserByRutExceptId,
  findUsers,
  getMetrics,
  rejectPetModificationRequest,
  softDeletePet,
  updatePet,
  updatePetStatus,
  updateUser
};
