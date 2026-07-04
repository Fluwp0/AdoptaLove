const bcrypt = require('bcrypt');
const { formatRut, isStrongPassword, isValidRut } = require('../auth/auth.service');
const adminModel = require('./admin.model');
const { normalizeEstimatedBirthDate } = require('../../utils/petAge');
const { isCommuneInRegion, isKnownRegion } = require('../../utils/chileLocations');

const ADMIN_ROLES = new Set(['administrador', 'admin']);
const USER_ROLES = new Set(['administrador', 'adoptante', 'fundacion']);
const USER_STATES = new Set(['activo', 'inactivo', 'suspendido']);
const SOCIAL_TYPES = new Set(['tiktok', 'facebook', 'instagram']);
const PET_STATUSES = new Set(['disponible', 'en_revision', 'rechazada', 'adoptada', 'inactiva']);
const PET_SIZES = new Set(['pequeno', 'mediano', 'grande']);
const PET_SEXES = new Set(['macho', 'hembra', 'desconocido']);
const PET_NAME_MAX_LENGTH = 40;
const DESCRIPTION_MIN_WORDS = 20;
const PASSWORD_SALT_ROUNDS = 10;
const DEFAULT_USERS_PAGE_SIZE = 5;
const MAX_USERS_PAGE_SIZE = 20;
const PET_REVIEW_STATUSES = new Set(['disponible', 'rechazada']);
const MODIFICATION_REVIEW_STATUSES = new Set(['aprobada', 'rechazada']);
const PASSWORD_MESSAGE =
  'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo.';

function createServiceError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function ensureAdmin(user) {
  if (!ADMIN_ROLES.has(user?.rol)) {
    throw createServiceError(403, 'No tienes permisos para realizar esta acción.');
  }
}

function getUserId(user) {
  const userId = Number(user?.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw createServiceError(401, 'Debes iniciar sesión como administrador.');
  }

  return userId;
}

function parseId(value, message = 'Mascota no encontrada') {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError(404, message);
  }

  return id;
}

function parseUserId(value) {
  return parseId(value, 'Usuario no encontrado');
}

function parsePagination(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const requestedLimit = Number.parseInt(query.limit, 10) || DEFAULT_USERS_PAGE_SIZE;
  const limit = Math.min(Math.max(1, requestedLimit), MAX_USERS_PAGE_SIZE);

  return {
    limit,
    offset: (page - 1) * limit,
    page
  };
}

function cleanText(value, maxLength = null) {
  const text = typeof value === 'string' ? value.trim() : '';

  if (!text) {
    return '';
  }

  return maxLength ? text.slice(0, maxLength) : text;
}

function normalizeNullableText(value, maxLength = null) {
  const text = cleanText(value, maxLength);
  return text || null;
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function normalizeRole(value) {
  const role = cleanText(value);

  if (role === 'admin') {
    return 'administrador';
  }

  return role;
}

function normalizeSocialType(value) {
  const socialType = cleanText(value).toLowerCase();
  return socialType || null;
}

function normalizeChileanPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  const withoutCountryCode = digits.startsWith('56') ? digits.slice(2) : digits;
  const phoneBody = withoutCountryCode.slice(0, 9);

  return phoneBody ? `+56${phoneBody}` : '';
}

function countWords(value = '') {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function getUploadedImagePath(file) {
  return file?.filename ? `/uploads/mascotas/${file.filename}` : null;
}

function normalizeReviewReason(payload = {}) {
  return cleanText(payload.motivo_revision ?? payload.motivoRevision ?? payload.motivo);
}

function validateEmail(email) {
  if (!email) {
    throw createServiceError(400, 'Correo electrónico es obligatorio.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createServiceError(400, 'Correo electrónico no válido.');
  }
}

function validatePasswordPair(password, passwordConfirmation, { required }) {
  if (!password && !passwordConfirmation && !required) {
    return null;
  }

  if (!password) {
    throw createServiceError(400, 'Contraseña es obligatoria.');
  }

  if (!passwordConfirmation) {
    throw createServiceError(400, 'Repetir contraseña es obligatorio.');
  }

  if (password !== passwordConfirmation) {
    throw createServiceError(400, 'Las contraseñas deben coincidir.');
  }

  if (!isStrongPassword(password)) {
    throw createServiceError(400, PASSWORD_MESSAGE);
  }

  return password;
}

function normalizeUserPayload(payload = {}, { isUpdate = false } = {}) {
  const firstName = cleanText(payload.first_name ?? payload.firstName ?? payload.nombre, 80);
  const lastName = cleanText(payload.last_name ?? payload.lastName ?? payload.apellido, 80);
  const nombre = `${firstName} ${lastName}`.replace(/\s+/g, ' ').trim().slice(0, 120);
  const email = normalizeEmail(payload.email);
  const rut = formatRut(payload.rut);
  const rol = normalizeRole(payload.rol);
  const estado = cleanText(payload.estado || 'activo');
  const telefono = normalizeChileanPhone(payload.telefono);
  const region = normalizeNullableText(payload.region, 120);
  const direccion = normalizeNullableText(payload.direccion, 255);
  const ciudad = normalizeNullableText(payload.ciudad, 120);
  const comuna = normalizeNullableText(payload.comuna, 120);
  const numeracion = normalizeNullableText(payload.numeracion, 40);
  const complementoDireccion = normalizeNullableText(
    payload.complemento_direccion ?? payload.complementoDireccion,
    255
  );
  const redSocialTipo = normalizeSocialType(payload.red_social_tipo ?? payload.redSocialTipo);
  const redSocialValor = normalizeNullableText(
    payload.red_social_valor ?? payload.redSocialValor,
    255
  );
  const password = typeof payload.password === 'string' ? payload.password : '';
  const passwordConfirmation =
    typeof payload.password_confirmation === 'string'
      ? payload.password_confirmation
      : typeof payload.passwordConfirmation === 'string'
        ? payload.passwordConfirmation
        : '';

  if (!firstName) {
    throw createServiceError(400, 'Nombre es obligatorio.');
  }

  if (!lastName) {
    throw createServiceError(400, 'Apellido es obligatorio.');
  }

  validateEmail(email);

  if (!rut) {
    throw createServiceError(400, 'RUT es obligatorio.');
  }

  if (!isValidRut(rut)) {
    throw createServiceError(400, 'El RUT ingresado no es válido.');
  }

  if (!telefono) {
    throw createServiceError(400, 'Teléfono es obligatorio.');
  }

  if (!region) {
    throw createServiceError(400, 'Regi\u00f3n es obligatoria.');
  }

  if (!isKnownRegion(region)) {
    throw createServiceError(400, 'Regi\u00f3n no v\u00e1lida.');
  }

  if (!comuna) {
    throw createServiceError(400, 'Comuna es obligatoria.');
  }

  if (!isCommuneInRegion(region, comuna)) {
    throw createServiceError(400, 'La comuna seleccionada no pertenece a la regi\u00f3n indicada.');
  }

  if (!direccion) {
    throw createServiceError(400, 'Dirección es obligatoria.');
  }

  if (!numeracion) {
    throw createServiceError(400, 'Numeración es obligatoria.');
  }

  if (!USER_ROLES.has(rol)) {
    throw createServiceError(400, 'Rol inválido.');
  }

  if (!USER_STATES.has(estado)) {
    throw createServiceError(400, 'Estado inválido.');
  }

  if (rol === 'fundacion') {
    if (!redSocialTipo || !SOCIAL_TYPES.has(redSocialTipo)) {
      throw createServiceError(400, 'Debes seleccionar una red social válida.');
    }

    if (!redSocialValor) {
      throw createServiceError(400, 'Debes indicar el usuario o enlace de la red social.');
    }
  }

  return {
    ciudad,
    comuna,
    complementoDireccion,
    direccion,
    estado,
    nombre,
    numeracion,
    region,
    redSocialTipo: rol === 'fundacion' ? redSocialTipo : null,
    redSocialValor: rol === 'fundacion' ? redSocialValor : null,
    rol,
    telefono,
    email,
    password: validatePasswordPair(password, passwordConfirmation, { required: !isUpdate }),
    rut
  };
}

function normalizeAdminPetPayload(payload = {}, file = null, fallback = {}) {
  const publicadoPorNombre =
    cleanText(
      payload.publicado_por_nombre ?? payload.publicadoPorNombre ?? fallback.publicado_por_nombre,
      160
    ) || 'AdoptaLove';
  const nombre = cleanText(payload.nombre ?? fallback.nombre);
  const especie = cleanText(payload.especie ?? fallback.especie, 80);
  const raza = normalizeNullableText(payload.raza ?? fallback.raza, 120);
  const sexo = cleanText(payload.sexo ?? fallback.sexo ?? 'desconocido');
  const tamano = cleanText(payload.tamano ?? fallback.tamano ?? 'mediano');
  const descripcion = cleanText(payload.descripcion ?? fallback.descripcion);
  const fotoUrl =
    getUploadedImagePath(file) ||
    normalizeNullableText(payload.foto_url ?? fallback.foto_url, 500);
  const estado = cleanText(payload.estado ?? fallback.estado ?? 'disponible');
  const motivoRevision = normalizeNullableText(
    payload.motivo_revision ?? payload.motivoRevision ?? fallback.motivo_revision,
    1000
  );
  const estimatedBirthDate = normalizeEstimatedBirthDate(payload, fallback, {
    required: Boolean(!fallback.id)
  });

  if (!nombre) {
    throw createServiceError(400, 'Nombre es obligatorio.');
  }

  if (nombre.length > PET_NAME_MAX_LENGTH) {
    throw createServiceError(400, 'El nombre de la mascota no puede superar los 40 caracteres.');
  }

  if (!especie) {
    throw createServiceError(400, 'Especie es obligatoria.');
  }

  if (!descripcion) {
    throw createServiceError(400, 'La descripción es obligatoria.');
  }

  if (countWords(descripcion) < DESCRIPTION_MIN_WORDS) {
    throw createServiceError(400, 'La descripción debe tener al menos 20 palabras.');
  }

  if (!PET_SEXES.has(sexo)) {
    throw createServiceError(400, 'Sexo inválido.');
  }

  if (!PET_SIZES.has(tamano)) {
    throw createServiceError(400, 'Tamaño inválido.');
  }

  if (!PET_STATUSES.has(estado)) {
    throw createServiceError(400, 'Estado de publicación inválido.');
  }

  return {
    descripcion,
    edadAnios: estimatedBirthDate.edadAnios,
    edadMeses: estimatedBirthDate.edadMeses,
    especie,
    estado,
    fechaNacimientoEstimada: estimatedBirthDate.fechaNacimientoEstimada,
    fotoUrl,
    motivoRevision,
    nombre,
    publicadoPorNombre,
    raza,
    sexo,
    tamano
  };
}

async function getMetrics(user) {
  ensureAdmin(user);
  return adminModel.getMetrics();
}

async function listUsers(user, query = {}) {
  ensureAdmin(user);
  const pagination = parsePagination(query);
  const search = cleanText(query.search ?? query.q ?? '', 120).toLowerCase();
  const [items, total] = await Promise.all([
    adminModel.findUsers({ ...pagination, search }),
    adminModel.countUsers({ search })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pagination.limit));

  return {
    items,
    pagination: {
      limit: pagination.limit,
      page: pagination.page,
      total,
      totalPages
    }
  };
}

async function createUser(user, payload = {}) {
  ensureAdmin(user);
  const normalizedUser = normalizeUserPayload(payload);
  const existingUser = await adminModel.findActiveUserByEmail(normalizedUser.email);

  if (existingUser) {
    throw createServiceError(
      409,
      'Ya existe un usuario activo registrado con este correo electr\u00f3nico.'
    );
  }

  const existingRut = await adminModel.findActiveUserByRut(normalizedUser.rut);

  if (existingRut) {
    throw createServiceError(409, 'Ya existe un usuario activo registrado con este RUT.');
  }

  const passwordHash = await bcrypt.hash(normalizedUser.password, PASSWORD_SALT_ROUNDS);

  return adminModel.createUser({
    ...normalizedUser,
    password: undefined,
    passwordHash
  });
}

async function updateUser(user, userId, payload = {}) {
  ensureAdmin(user);
  const id = parseUserId(userId);
  const currentUser = await adminModel.findUserById(id);

  if (!currentUser) {
    throw createServiceError(404, 'Usuario no encontrado');
  }

  const normalizedUser = normalizeUserPayload(payload, { isUpdate: true });
  const emailChanged = normalizeEmail(currentUser.email) !== normalizedUser.email;
  const rutChanged = formatRut(currentUser.rut) !== normalizedUser.rut;
  const shouldValidateEmail = emailChanged || normalizedUser.estado === 'activo';
  const shouldValidateRut = rutChanged || normalizedUser.estado === 'activo';
  const existingEmail = shouldValidateEmail
    ? await adminModel.findActiveUserByEmailExceptId(normalizedUser.email, id)
    : null;

  if (existingEmail) {
    throw createServiceError(
      409,
      'Ya existe un usuario activo registrado con este correo electr\u00f3nico.'
    );
  }

  const existingRut = shouldValidateRut
    ? await adminModel.findActiveUserByRutExceptId(normalizedUser.rut, id)
    : null;

  if (existingRut) {
    throw createServiceError(409, 'Ya existe un usuario activo registrado con este RUT.');
  }

  const passwordHash = normalizedUser.password
    ? await bcrypt.hash(normalizedUser.password, PASSWORD_SALT_ROUNDS)
    : null;

  return adminModel.updateUser(id, {
    ...normalizedUser,
    password: undefined,
    passwordHash
  });
}

async function deactivateUser(user, userId, payload = {}) {
  ensureAdmin(user);
  const currentAdminId = getUserId(user);
  const id = parseUserId(userId);
  const motivoEliminacion = cleanText(payload.motivo_eliminacion ?? payload.motivoEliminacion);

  if (id === currentAdminId) {
    throw createServiceError(400, 'No puedes eliminar tu propio usuario administrador.');
  }

  if (!motivoEliminacion) {
    throw createServiceError(400, 'El motivo de eliminación es obligatorio.');
  }

  const currentUser = await adminModel.findUserById(id);

  if (!currentUser) {
    throw createServiceError(404, 'Usuario no encontrado');
  }

  return adminModel.deactivateUser(id, motivoEliminacion);
}

async function createPet(user, payload, file = null) {
  ensureAdmin(user);
  const pet = normalizeAdminPetPayload(payload, file);

  return adminModel.createPet({
    ...pet,
    publicadoPorUsuarioId: getUserId(user)
  });
}

async function getPet(user, petId) {
  ensureAdmin(user);
  const id = parseId(petId, 'Publicación no encontrada.');
  const pet = await adminModel.findPetById(id);

  if (!pet || pet.eliminada_at) {
    throw createServiceError(404, 'Publicación no encontrada.');
  }

  return pet;
}

async function updatePet(user, petId, payload, file = null) {
  ensureAdmin(user);
  const currentPet = await getPet(user, petId);
  const pet = normalizeAdminPetPayload(payload, file, currentPet);

  return adminModel.updatePet(currentPet.id, pet);
}

async function deletePet(user, petId) {
  ensureAdmin(user);
  const currentPet = await getPet(user, petId);
  return adminModel.softDeletePet(currentPet.id);
}

async function getPetsPendingReview(user) {
  ensureAdmin(user);
  return adminModel.findPetsPendingReview();
}

async function listPetPublications(user, query = {}) {
  ensureAdmin(user);
  const pagination = parsePagination(query);
  const search = cleanText(query.search ?? query.q ?? '', 120);
  const [items, total] = await Promise.all([
    adminModel.findPetPublications({ ...pagination, search }),
    adminModel.countPetPublications({ search })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pagination.limit));

  return {
    items,
    pagination: {
      limit: pagination.limit,
      page: pagination.page,
      total,
      totalPages
    }
  };
}

async function updatePetReviewStatus(user, petId, estado, payload = {}) {
  ensureAdmin(user);
  const id = parseId(petId, 'Publicación no encontrada.');
  const motivoRevision = normalizeReviewReason(payload);
  const pet = await adminModel.findPetById(id);

  if (!pet || pet.eliminada_at || pet.publicador_rol !== 'fundacion') {
    throw createServiceError(404, 'Publicación no encontrada.');
  }

  if (!PET_REVIEW_STATUSES.has(estado)) {
    throw createServiceError(400, 'Estado de publicación inválido.');
  }

  if (!motivoRevision) {
    throw createServiceError(400, 'Debes ingresar un motivo para cambiar el estado de la publicación.');
  }

  if (pet.estado !== 'en_revision') {
    throw createServiceError(400, 'Solo se pueden revisar publicaciones en revisión.');
  }

  return adminModel.updatePetStatus(id, estado, motivoRevision);
}

async function listPetModifications(user, query = {}) {
  ensureAdmin(user);
  const pagination = parsePagination(query);
  const search = cleanText(query.search ?? query.q ?? '', 120);
  const [items, total] = await Promise.all([
    adminModel.findPetModificationRequests({ ...pagination, search }),
    adminModel.countPetModificationRequests({ search })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pagination.limit));

  return {
    items,
    pagination: {
      limit: pagination.limit,
      page: pagination.page,
      total,
      totalPages
    }
  };
}

async function updatePetModificationStatus(user, modificationId, estado, payload = {}) {
  ensureAdmin(user);
  const id = parseId(modificationId, 'Solicitud de modificación no encontrada.');
  const motivoRevision = normalizeReviewReason(payload);
  const modification = await adminModel.findPetModificationRequestById(id);

  if (!modification) {
    throw createServiceError(404, 'Solicitud de modificación no encontrada.');
  }

  if (!MODIFICATION_REVIEW_STATUSES.has(estado)) {
    throw createServiceError(400, 'Estado de modificación inválido.');
  }

  if (!motivoRevision) {
    throw createServiceError(400, 'Debes ingresar un motivo para cambiar el estado de la modificación.');
  }

  if (modification.estado !== 'en_revision') {
    throw createServiceError(400, 'Solo se pueden revisar modificaciones en revisión.');
  }

  if (estado === 'aprobada') {
    return adminModel.approvePetModificationRequest(id, motivoRevision, getUserId(user));
  }

  return adminModel.rejectPetModificationRequest(id, motivoRevision, getUserId(user));
}

async function discardPetModification(user, modificationId) {
  ensureAdmin(user);
  const id = parseId(modificationId, 'Solicitud de modificación no encontrada.');
  const modification = await adminModel.findPetModificationRequestById(id);

  if (!modification) {
    throw createServiceError(404, 'Solicitud de modificación no encontrada.');
  }

  return adminModel.discardPetModificationRequest(id, getUserId(user));
}

module.exports = {
  createPet,
  createUser,
  deactivateUser,
  deletePet,
  discardPetModification,
  getMetrics,
  getPet,
  getPetsPendingReview,
  listPetModifications,
  listPetPublications,
  listUsers,
  updatePet,
  updatePetModificationStatus,
  updatePetReviewStatus,
  updateUser
};
