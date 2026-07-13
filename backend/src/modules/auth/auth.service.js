const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const authModel = require('./auth.model');
const { isCommuneInRegion, isKnownRegion } = require('../../utils/chileLocations');

const PASSWORD_SALT_ROUNDS = 10;

function createServiceError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function normalizeText(value, maxLength) {
  const text = typeof value === 'string' ? value.trim() : '';
  return maxLength ? text.slice(0, maxLength) : text;
}

function cleanRut(rut) {
  return typeof rut === 'string'
    ? rut.replace(/[.\-\s]/g, '').toUpperCase()
    : '';
}

function formatRut(rut) {
  const cleanedRut = cleanRut(rut);

  if (cleanedRut.length < 2) {
    return '';
  }

  const body = cleanedRut.slice(0, -1);
  const verifier = cleanedRut.slice(-1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${formattedBody}-${verifier}`;
}

function isValidRut(rut) {
  const cleanedRut = cleanRut(rut);

  if (!/^\d{1,8}[\dK]$/.test(cleanedRut)) {
    return false;
  }

  const body = cleanedRut.slice(0, -1);
  const verifier = cleanedRut.slice(-1);
  let multiplier = 2;
  let sum = 0;

  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  const expectedValue = 11 - remainder;
  const expectedVerifier =
    expectedValue === 11 ? '0' : expectedValue === 10 ? 'K' : String(expectedValue);

  return verifier === expectedVerifier;
}

function isStrongPassword(password) {
  return (
    password.length >= 8 &&
    /[A-ZÁÉÍÓÚÑ]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9]/.test(password)
  );
}

function toPublicUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rut: user.rut,
    telefono: user.telefono,
    region: user.region,
    direccion: user.direccion,
    ciudad: user.ciudad,
    comuna: user.comuna,
    numeracion: user.numeracion,
    complemento_direccion: user.complemento_direccion,
    rol: user.rol
  };
}

function signToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      rol: user.rol
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
}

function normalizeLocationPayload(payload = {}) {
  const region = normalizeText(payload.region, 120);
  const ciudad = normalizeText(payload.ciudad, 120);
  const comuna = normalizeText(payload.comuna, 120);
  const direccion = normalizeText(payload.direccion, 255);
  const numeracion = normalizeText(payload.numeracion, 40);
  const complementoDireccion = normalizeText(
    payload.complemento_direccion ?? payload.complementoDireccion,
    255
  );

  if (!region) {
    throw createServiceError(400, 'Regi\u00f3n es obligatoria');
  }

  if (!isKnownRegion(region)) {
    throw createServiceError(400, 'Regi\u00f3n no v\u00e1lida');
  }

  if (!comuna) {
    throw createServiceError(400, 'Comuna es obligatoria');
  }

  if (!isCommuneInRegion(region, comuna)) {
    throw createServiceError(400, 'La comuna seleccionada no pertenece a la regi\u00f3n indicada');
  }

  if (!direccion) {
    throw createServiceError(400, 'Direcci\u00f3n es obligatoria');
  }

  if (!numeracion) {
    throw createServiceError(400, 'Numeraci\u00f3n es obligatoria');
  }

  return {
    ciudad,
    comuna,
    complementoDireccion,
    direccion,
    numeracion,
    region
  };
}

async function register(payload = {}) {
  const nombre = typeof payload.nombre === 'string' ? payload.nombre.trim() : '';
  const email = normalizeEmail(payload.email);
  const rut = formatRut(payload.rut);
  const password = typeof payload.password === 'string' ? payload.password : '';
  const telefono = typeof payload.telefono === 'string' ? payload.telefono.trim() : '';
  const region = normalizeText(payload.region, 120);
  const ciudad = normalizeText(payload.ciudad, 120);
  const comuna = normalizeText(payload.comuna, 120);
  const direccion = normalizeText(payload.direccion, 255);
  const numeracion = normalizeText(payload.numeracion, 40);
  const complementoDireccion = normalizeText(
    payload.complemento_direccion ?? payload.complementoDireccion,
    255
  );

  if (!nombre) {
    throw createServiceError(400, 'Nombre es obligatorio');
  }

  if (!email) {
    throw createServiceError(400, 'Email es obligatorio');
  }

  if (!rut) {
    throw createServiceError(400, 'RUT es obligatorio');
  }

  if (!isValidRut(rut)) {
    throw createServiceError(400, 'El RUT ingresado no es válido');
  }

  if (!password) {
    throw createServiceError(400, 'Password es obligatorio');
  }

  if (!isStrongPassword(password)) {
    throw createServiceError(
      400,
      'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo'
    );
  }

  if (!region) {
    throw createServiceError(400, 'Regi\u00f3n es obligatoria');
  }

  if (!isKnownRegion(region)) {
    throw createServiceError(400, 'Regi\u00f3n no v\u00e1lida');
  }

  if (!comuna) {
    throw createServiceError(400, 'Comuna es obligatoria');
  }

  if (!isCommuneInRegion(region, comuna)) {
    throw createServiceError(400, 'La comuna seleccionada no pertenece a la regi\u00f3n indicada');
  }

  if (!direccion) {
    throw createServiceError(400, 'Direcci\u00f3n es obligatoria');
  }

  if (!numeracion) {
    throw createServiceError(400, 'Numeraci\u00f3n es obligatoria');
  }

  const existingUser = await authModel.findActiveUserByEmail(email);

  if (existingUser) {
    throw createServiceError(
      409,
      'Ya existe un usuario activo registrado con este correo electr\u00f3nico.'
    );
  }

  const existingRut = await authModel.findActiveUserByRut(rut);

  if (existingRut) {
    throw createServiceError(409, 'Ya existe un usuario activo registrado con este RUT.');
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  const user = await authModel.createUser({
    nombre,
    email,
    rut,
    passwordHash,
    telefono,
    region,
    direccion,
    ciudad,
    comuna,
    numeracion,
    complementoDireccion
  });
  const publicUser = toPublicUser(user);

  return {
    token: signToken(publicUser),
    user: publicUser
  };
}

async function login(payload = {}) {
  const email = normalizeEmail(payload.email);
  const password = typeof payload.password === 'string' ? payload.password : '';

  if (!email) {
    throw createServiceError(400, 'Email es obligatorio');
  }

  if (!password) {
    throw createServiceError(400, 'Password es obligatorio');
  }

  const user = await authModel.findActiveUserByEmail(email);

  if (!user) {
    throw createServiceError(401, 'Credenciales inválidas');
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    throw createServiceError(401, 'Credenciales inválidas');
  }

  const publicUser = toPublicUser(user);

  return {
    token: signToken(publicUser),
    user: publicUser
  };
}

async function getUserById(id) {
  const userId = Number(id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }

  return toPublicUser(await authModel.findPublicUserById(userId));
}

async function updateMyLocation(id, payload = {}) {
  const userId = Number(id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw createServiceError(401, 'Debes iniciar sesi\u00f3n para actualizar tu ubicaci\u00f3n');
  }

  const currentUser = await authModel.findPublicUserById(userId);

  if (!currentUser) {
    throw createServiceError(404, 'Usuario no encontrado');
  }

  const location = normalizeLocationPayload(payload);
  const updatedUser = await authModel.updateUserLocation(userId, location);

  return toPublicUser(updatedUser);
}

module.exports = {
  formatRut,
  getUserById,
  isStrongPassword,
  isValidRut,
  login,
  register,
  updateMyLocation,
  toPublicUser
};
