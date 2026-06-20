const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const authModel = require('./auth.model');

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
    direccion: user.direccion,
    ciudad: user.ciudad,
    comuna: user.comuna,
    numeracion: user.numeracion,
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

async function register(payload = {}) {
  const nombre = typeof payload.nombre === 'string' ? payload.nombre.trim() : '';
  const email = normalizeEmail(payload.email);
  const rut = formatRut(payload.rut);
  const password = typeof payload.password === 'string' ? payload.password : '';
  const telefono = typeof payload.telefono === 'string' ? payload.telefono.trim() : '';
  const ciudad = normalizeText(payload.ciudad, 120);
  const comuna = normalizeText(payload.comuna, 120);
  const direccion = normalizeText(payload.direccion, 255);
  const numeracion = normalizeText(payload.numeracion, 40);

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

  if (!ciudad) {
    throw createServiceError(400, 'Ciudad es obligatoria');
  }

  if (!comuna) {
    throw createServiceError(400, 'Comuna es obligatoria');
  }

  if (!direccion) {
    throw createServiceError(400, 'Direcci\u00f3n es obligatoria');
  }

  if (!numeracion) {
    throw createServiceError(400, 'Numeraci\u00f3n es obligatoria');
  }

  const existingUser = await authModel.findUserByEmail(email);

  if (existingUser) {
    throw createServiceError(409, 'Ya existe un usuario registrado con este correo electrónico.');
  }

  const existingRut = await authModel.findUserByRut(rut);

  if (existingRut) {
    throw createServiceError(409, 'Ya existe un usuario registrado con este RUT.');
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  const user = await authModel.createUser({
    nombre,
    email,
    rut,
    passwordHash,
    telefono,
    direccion,
    ciudad,
    comuna,
    numeracion
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

  const user = await authModel.findUserByEmail(email);

  if (!user) {
    throw createServiceError(401, 'Credenciales inválidas');
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    throw createServiceError(401, 'Credenciales inválidas');
  }

  if (user.estado !== 'activo') {
    throw createServiceError(403, 'Usuario no activo');
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

module.exports = {
  formatRut,
  getUserById,
  isStrongPassword,
  isValidRut,
  login,
  register,
  toPublicUser
};
