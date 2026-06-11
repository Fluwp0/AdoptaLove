import { useState } from 'react';
import { apiClient } from '../services/apiClient';
import { saveSession } from '../services/authSession';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  rut: '',
  email: '',
  phone: '',
  city: '',
  commune: '',
  address: '',
  addressNumber: '',
  password: '',
  repeatPassword: ''
};

const PASSWORD_MESSAGE =
  'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo.';

function cleanRut(rut) {
  return rut.replace(/[.\-\s]/g, '').toUpperCase();
}

function formatRut(rut) {
  const cleanedRut = cleanRut(rut).replace(/[^0-9K]/g, '').slice(0, 9);

  if (cleanedRut.length <= 1) {
    return cleanedRut;
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

function buildDireccion(form) {
  return [form.city, form.commune, form.address, form.addressNumber]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(', ');
}

function validateForm(form) {
  const nextErrors = {};

  if (!form.firstName.trim()) nextErrors.firstName = 'El nombre es obligatorio.';
  if (!form.lastName.trim()) nextErrors.lastName = 'El apellido es obligatorio.';
  if (!form.rut.trim()) {
    nextErrors.rut = 'El RUT es obligatorio.';
  } else if (!isValidRut(form.rut)) {
    nextErrors.rut = 'El RUT ingresado no es válido.';
  }
  if (!form.email.trim()) nextErrors.email = 'El correo electrónico es obligatorio.';
  if (!form.phone.trim()) nextErrors.phone = 'El teléfono es obligatorio.';
  if (!form.city.trim()) nextErrors.city = 'La ciudad es obligatoria.';
  if (!form.commune.trim()) nextErrors.commune = 'La comuna es obligatoria.';
  if (!form.address.trim()) nextErrors.address = 'La dirección es obligatoria.';
  if (!form.addressNumber.trim()) nextErrors.addressNumber = 'La numeración es obligatoria.';
  if (!form.password) {
    nextErrors.password = 'La contraseña es obligatoria.';
  } else if (!isStrongPassword(form.password)) {
    nextErrors.password = PASSWORD_MESSAGE;
  }
  if (!form.repeatPassword) {
    nextErrors.repeatPassword = 'Debes repetir la contraseña.';
  } else if (form.repeatPassword !== form.password) {
    nextErrors.repeatPassword = 'Las contraseñas no coinciden.';
  }

  return nextErrors;
}

export function RegisterPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [feedback, setFeedback] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  function updateField(field, value) {
    const nextValue =
      field === 'rut'
        ? formatRut(value)
        : field === 'phone'
          ? value.replace(/\D/g, '').slice(0, 9)
          : value;

    setForm((currentForm) => ({
      ...currentForm,
      [field]: nextValue
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: ''
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateForm(form);

    if (Object.values(validationErrors).some(Boolean)) {
      setErrors(validationErrors);
      setStatus('error');
      setFeedback('Revisa los campos marcados antes de crear tu cuenta.');
      return;
    }

    setStatus('submitting');
    setFeedback('Creando tu cuenta...');

    const payload = {
      nombre: `${form.firstName.trim()} ${form.lastName.trim()}`.replace(/\s+/g, ' '),
      rut: formatRut(form.rut),
      email: form.email.trim(),
      password: form.password,
      telefono: `+56${form.phone}`,
      direccion: buildDireccion(form)
    };

    try {
      const response = await apiClient('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const responsePayload = await response.json();

      if (!response.ok) {
        throw new Error(responsePayload.message || 'No se pudo crear la cuenta.');
      }

      saveSession(responsePayload.data.token, responsePayload.data.user);
      setForm(INITIAL_FORM);
      setErrors({});
      setStatus('success');
      setFeedback('Cuenta creada correctamente.');
      window.location.href = '/perfil';
    } catch (error) {
      setStatus('error');
      setFeedback(error.message);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-layout">
        <div className="auth-card">
          <p className="section-kicker">Crear cuenta</p>
          <h2>Encuentra a tu nuevo compañero</h2>
          <p className="auth-subtitle">
            Crea tu cuenta para postular con tus datos reales y acompañar el
            proceso de adopción con amor y responsabilidad.
          </p>

          <form className="auth-form auth-form-grid" onSubmit={handleSubmit}>
            <label htmlFor="register-first-name">
              Nombre
              <input
                id="register-first-name"
                onChange={(event) => updateField('firstName', event.target.value)}
                placeholder="Yazmin"
                type="text"
                value={form.firstName}
              />
              {errors.firstName && <span className="field-error">{errors.firstName}</span>}
            </label>

            <label htmlFor="register-last-name">
              Apellido
              <input
                id="register-last-name"
                onChange={(event) => updateField('lastName', event.target.value)}
                placeholder="Osses"
                type="text"
                value={form.lastName}
              />
              {errors.lastName && <span className="field-error">{errors.lastName}</span>}
            </label>

            <label htmlFor="register-rut">
              RUT
              <input
                id="register-rut"
                onChange={(event) => updateField('rut', event.target.value)}
                placeholder="12.345.678-5"
                type="text"
                value={form.rut}
              />
              {errors.rut && <span className="field-error">{errors.rut}</span>}
            </label>

            <label htmlFor="register-email">
              Correo electrónico
              <input
                id="register-email"
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="correo@email.com"
                type="email"
                value={form.email}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </label>

            <label htmlFor="register-phone">
              Teléfono
              <div className="phone-input-wrap">
                <span>+56</span>
                <input
                  id="register-phone"
                  onChange={(event) => updateField('phone', event.target.value)}
                  placeholder="982043779"
                  type="tel"
                  value={form.phone}
                />
              </div>
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </label>

            <label htmlFor="register-city">
              Ciudad
              <input
                id="register-city"
                onChange={(event) => updateField('city', event.target.value)}
                placeholder="Santiago"
                type="text"
                value={form.city}
              />
              {errors.city && <span className="field-error">{errors.city}</span>}
            </label>

            <label htmlFor="register-commune">
              Comuna
              <input
                id="register-commune"
                onChange={(event) => updateField('commune', event.target.value)}
                placeholder="Puente Alto"
                type="text"
                value={form.commune}
              />
              {errors.commune && <span className="field-error">{errors.commune}</span>}
            </label>

            <label htmlFor="register-address">
              Dirección
              <input
                id="register-address"
                onChange={(event) => updateField('address', event.target.value)}
                placeholder="Av. Concha y Toro"
                type="text"
                value={form.address}
              />
              {errors.address && <span className="field-error">{errors.address}</span>}
            </label>

            <label htmlFor="register-address-number">
              Numeración
              <input
                id="register-address-number"
                onChange={(event) => updateField('addressNumber', event.target.value)}
                placeholder="1234"
                type="text"
                value={form.addressNumber}
              />
              {errors.addressNumber && (
                <span className="field-error">{errors.addressNumber}</span>
              )}
            </label>

            <label htmlFor="register-password">
              Contraseña
              <div className="password-input-wrap">
                <input
                  id="register-password"
                  onChange={(event) => updateField('password', event.target.value)}
                  placeholder="Crea una contraseña"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                />
                <button
                  onClick={() => setShowPassword((currentValue) => !currentValue)}
                  type="button"
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
            </label>

            <label htmlFor="register-repeat-password">
              Repetir contraseña
              <div className="password-input-wrap">
                <input
                  id="register-repeat-password"
                  onChange={(event) => updateField('repeatPassword', event.target.value)}
                  placeholder="Repite tu contraseña"
                  type={showRepeatPassword ? 'text' : 'password'}
                  value={form.repeatPassword}
                />
                <button
                  onClick={() => setShowRepeatPassword((currentValue) => !currentValue)}
                  type="button"
                >
                  {showRepeatPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              {errors.repeatPassword && (
                <span className="field-error">{errors.repeatPassword}</span>
              )}
            </label>

            {feedback && (
              <p className={`auth-feedback auth-feedback-${status}`}>{feedback}</p>
            )}

            <button
              className="auth-submit-button auth-field-full"
              disabled={status === 'submitting'}
              type="submit"
            >
              {status === 'submitting' ? 'Creando cuenta...' : 'Registrarme'}
            </button>
          </form>

          <p className="auth-switch">
            ¿Ya tienes cuenta? <a href="/login">Iniciar sesión</a>
          </p>
        </div>

        <aside className="auth-side-card">
          <span>Un hogar empieza aquí</span>
          <h3>Tu perfil hace más humana cada solicitud</h3>
          <p>
            Las fundaciones podrán conocer tus datos básicos antes de revisar
            una postulación.
          </p>
        </aside>
      </div>
    </section>
  );
}
