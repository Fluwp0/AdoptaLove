const donationModel = require('./donation.model');

const ALLOWED_PAYMENT_METHODS = new Set([
  'webpay',
  'transferencia',
  'tarjeta',
  'otro'
]);

function createServiceError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizePaymentMethod(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function parseOptionalUserId(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const userId = Number(value);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw createServiceError(400, 'usuario_id debe ser un número válido');
  }

  return userId;
}

function parseAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw createServiceError(400, 'El monto debe ser mayor a 0');
  }

  return Math.round(amount);
}

function parseMessage(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const message = value.trim();

  return message ? message.slice(0, 1000) : null;
}

function generatePaymentReference() {
  return `DON-${Date.now()}`;
}

async function createDonation(payload = {}) {
  const usuarioId = parseOptionalUserId(payload.usuario_id);
  const monto = parseAmount(payload.monto);
  const metodoPago = normalizePaymentMethod(payload.metodo_pago || 'otro');
  const mensaje = parseMessage(payload.mensaje);

  if (!ALLOWED_PAYMENT_METHODS.has(metodoPago)) {
    throw createServiceError(400, 'Método de pago inválido');
  }

  if (usuarioId) {
    const user = await donationModel.findUserById(usuarioId);

    if (!user) {
      throw createServiceError(404, 'Usuario no encontrado');
    }
  }

  return donationModel.createDonation({
    usuarioId,
    monto,
    metodoPago,
    mensaje,
    referenciaPago: generatePaymentReference()
  });
}

async function getDonations() {
  return donationModel.findDonations();
}

async function getDonationSummary() {
  return donationModel.getDonationSummary();
}

module.exports = {
  createDonation,
  getDonationSummary,
  getDonations
};
