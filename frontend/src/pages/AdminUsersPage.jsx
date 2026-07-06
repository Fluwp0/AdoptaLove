import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { getCurrentUser } from '../services/authSession';
import { ModalPortal } from '../components/ModalPortal';
import {
  CHILE_REGIONS,
  getCommunesByRegion,
  inferRegionFromCommune,
  isCommuneInRegion
} from '../data/chileLocations';

const ADMIN_ROLES = new Set(['administrador', 'admin']);
const USERS_PER_PAGE = 5;
const PASSWORD_MESSAGE =
  'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo.';

const EMPTY_USER_FORM = {
  firstName: '',
  lastName: '',
  rut: '',
  email: '',
  phone: '',
  region: '',
  city: '',
  commune: '',
  address: '',
  addressNumber: '',
  addressComplement: '',
  password: '',
  password_confirmation: '',
  rol: 'adoptante',
  red_social_tipo: 'instagram',
  red_social_valor: '',
  estado: 'activo'
};

const ROLE_LABELS = {
  administrador: 'Administrador',
  adoptante: 'Adoptante',
  fundacion: 'Fundación'
};

const STATE_LABELS = {
  activo: 'Activo',
  inactivo: 'Inactivo',
  suspendido: 'Suspendido'
};

function getRoleLabel(role) {
  return ROLE_LABELS[role] || role || 'Sin rol';
}

function getStateLabel(state) {
  return STATE_LABELS[state] || state || 'Sin estado';
}

function formatDate(value) {
  if (!value) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium'
  }).format(new Date(value));
}

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

function splitFullName(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length <= 1) {
    return {
      firstName: parts[0] || '',
      lastName: ''
    };
  }

  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.slice(-1).join('')
  };
}

function extractPhoneBody(phone = '') {
  const digits = String(phone).replace(/\D/g, '');
  const withoutCountryCode = digits.startsWith('56') ? digits.slice(2) : digits;

  return withoutCountryCode.slice(0, 9);
}

function normalizeAdminFieldValue(field, value) {
  if (field === 'rut') {
    return formatRut(value);
  }

  if (field === 'phone') {
    const digits = value.replace(/\D/g, '');
    const withoutCountryCode = digits.startsWith('56') ? digits.slice(2) : digits;

    return withoutCountryCode.slice(0, 9);
  }

  return value;
}

function applyAdminFieldChange(currentForm, field, value) {
  return {
    ...currentForm,
    [field]: normalizeAdminFieldValue(field, value),
    ...(field === 'region' ? { commune: '' } : {})
  };
}

function buildUserPayload(form, { includePassword }) {
  return {
    ciudad: form.city.trim(),
    comuna: form.commune.trim(),
    complemento_direccion: form.addressComplement.trim(),
    direccion: form.address.trim(),
    email: form.email.trim().toLowerCase(),
    estado: form.estado,
    first_name: form.firstName.trim(),
    last_name: form.lastName.trim(),
    numeracion: form.addressNumber.trim(),
    region: form.region.trim(),
    password: includePassword ? form.password : form.password.trim(),
    password_confirmation: includePassword
      ? form.password_confirmation
      : form.password_confirmation.trim(),
    red_social_tipo: form.red_social_tipo,
    red_social_valor: form.red_social_valor.trim(),
    rol: form.rol,
    rut: formatRut(form.rut),
    telefono: form.phone ? `+56${form.phone}` : ''
  };
}

function mapUserToForm(user) {
  const names = splitFullName(user?.nombre);

  return {
    ...EMPTY_USER_FORM,
    address: user?.direccion || '',
    addressNumber: user?.numeracion || '',
    addressComplement: user?.complemento_direccion || '',
    city: user?.ciudad || '',
    commune: user?.comuna || '',
    email: user?.email || '',
    estado: user?.estado || 'activo',
    firstName: names.firstName,
    lastName: names.lastName,
    phone: extractPhoneBody(user?.telefono || ''),
    red_social_tipo: user?.red_social_tipo || 'instagram',
    red_social_valor: user?.red_social_valor || '',
    region: inferRegionFromCommune(user?.comuna, user?.region || ''),
    rol: user?.rol || 'adoptante',
    rut: user?.rut || ''
  };
}

export function AdminUsersPage() {
  const currentUser = getCurrentUser();
  const isAdmin = ADMIN_ROLES.has(currentUser?.rol);
  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [pagination, setPagination] = useState({
    limit: USERS_PER_PAGE,
    page: 1,
    total: 0,
    totalPages: 1
  });
  const [userSearchDraft, setUserSearchDraft] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [form, setForm] = useState(EMPTY_USER_FORM);
  const [editForm, setEditForm] = useState(EMPTY_USER_FORM);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteState, setDeleteState] = useState({
    motivo: '',
    step: null,
    user: null
  });
  const [expandedActionsId, setExpandedActionsId] = useState(null);
  const [status, setStatus] = useState('idle');
  const [feedback, setFeedback] = useState('');

  const isLoading = status === 'loading';
  const isSaving = status === 'saving';
  const isDeleting = status === 'deleting';
  const currentPage = pagination.page || usersPage;
  const totalPages = Math.max(1, pagination.totalPages || 1);
  const hasUserSearch = userSearch.trim().length > 0;

  useBodyScrollLock(Boolean(editingUser || deleteState.step));

  const roleDescription = useMemo(() => {
    if (form.rol === 'fundacion') {
      return 'Completa los datos de ubicación y red social para registrar una fundación.';
    }

    return 'Completa los datos base para crear una cuenta desde administración.';
  }, [form.rol]);

  async function loadUsers(page = usersPage, search = userSearch) {
    if (!isAdmin) {
      return;
    }

    setStatus('loading');

    try {
      const params = new URLSearchParams({
        limit: String(USERS_PER_PAGE),
        page: String(page)
      });

      if (search.trim()) {
        params.set('search', search.trim());
      }

      const response = await apiClient(`/admin/users?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'No se pudieron cargar los usuarios.');
      }

      setUsers(payload.data || []);
      setPagination(payload.pagination || {
        limit: USERS_PER_PAGE,
        page,
        total: 0,
        totalPages: 1
      });
      setStatus('idle');
    } catch (error) {
      setStatus('error');
      setFeedback(error.message);
    }
  }

  useEffect(() => {
    loadUsers(usersPage, userSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.rol, usersPage, userSearch]);

  useEffect(() => {
    if (!isAdmin) {
      return undefined;
    }

    const debounceId = setTimeout(() => {
      setUsersPage(1);
      setUserSearch(userSearchDraft);
    }, 300);

    return () => {
      clearTimeout(debounceId);
    };
  }, [isAdmin, userSearchDraft]);

  function updateFormField(field, value) {
    setForm((currentForm) => applyAdminFieldChange(currentForm, field, value));
  }

  function updateEditField(field, value) {
    setEditForm((currentForm) => applyAdminFieldChange(currentForm, field, value));
  }

  function validatePasswordFields(currentForm, { required }) {
    if (!required && !currentForm.password && !currentForm.password_confirmation) {
      return '';
    }

    if (!currentForm.password) {
      return 'Contraseña es obligatoria.';
    }

    if (!currentForm.password_confirmation) {
      return 'Repetir contraseña es obligatorio.';
    }

    if (currentForm.password !== currentForm.password_confirmation) {
      return 'Las contraseñas deben coincidir.';
    }

    if (!isStrongPassword(currentForm.password)) {
      return PASSWORD_MESSAGE;
    }

    return '';
  }

function validateFoundationFields(currentForm) {
  if (currentForm.rol !== 'fundacion') {
    return '';
  }

    if (!currentForm.red_social_tipo) {
      return 'Debes seleccionar una red social.';
    }

    if (!currentForm.red_social_valor.trim()) {
      return 'Debes indicar el usuario o enlace de la red social.';
    }

    return '';
  }

  function validateUserForm(currentForm, { requirePassword }) {
    if (!currentForm.firstName.trim()) {
      return 'Nombre es obligatorio.';
    }

    if (!currentForm.lastName.trim()) {
      return 'Apellido es obligatorio.';
    }

    if (!currentForm.rut.trim()) {
      return 'El RUT es obligatorio.';
    }

    if (!isValidRut(currentForm.rut)) {
      return 'El RUT ingresado no es válido.';
    }

    if (!currentForm.email.trim()) {
      return 'Correo electrónico es obligatorio.';
    }

    if (!currentForm.phone.trim()) {
      return 'El teléfono es obligatorio.';
    }

    if (!currentForm.region.trim()) {
      return 'La región es obligatoria.';
    }

    if (!currentForm.commune.trim()) {
      return 'La comuna es obligatoria.';
    }

    if (!isCommuneInRegion(currentForm.region, currentForm.commune)) {
      return 'La comuna seleccionada no pertenece a la región.';
    }

    if (!currentForm.address.trim()) {
      return 'La dirección es obligatoria.';
    }

    if (!currentForm.addressNumber.trim()) {
      return 'La numeración es obligatoria.';
    }

    const passwordError = validatePasswordFields(currentForm, { required: requirePassword });

    if (passwordError) {
      return passwordError;
    }

    return validateFoundationFields(currentForm);
  }

  async function handleCreateUser(event) {
    event.preventDefault();
    setFeedback('');

    const validationError = validateUserForm(form, { requirePassword: true });

    if (validationError) {
      setStatus('error');
      setFeedback(validationError);
      return;
    }

    setStatus('saving');

    try {
      const response = await apiClient('/admin/users', {
        body: JSON.stringify(buildUserPayload(form, { includePassword: true })),
        method: 'POST'
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'No se pudo crear el usuario.');
      }

      setForm(EMPTY_USER_FORM);
      setFeedback(payload.message || 'Usuario creado correctamente.');
      setStatus('idle');
      setUsersPage(1);
      await loadUsers(1, userSearch);
    } catch (error) {
      setStatus('error');
      setFeedback(error.message);
    }
  }

  function openEditModal(user) {
    setEditingUser(user);
    setEditForm(mapUserToForm(user));
    setExpandedActionsId(null);
    setFeedback('');
  }

  async function handleUpdateUser(event) {
    event.preventDefault();
    setFeedback('');

    const validationError = validateUserForm(editForm, { requirePassword: false });

    if (validationError) {
      setStatus('error');
      setFeedback(validationError);
      return;
    }

    setStatus('saving');

    try {
      const response = await apiClient(`/admin/users/${editingUser.id}`, {
        body: JSON.stringify(buildUserPayload(editForm, { includePassword: false })),
        method: 'PUT'
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'No se pudo actualizar el usuario.');
      }

      setEditingUser(null);
      setFeedback(payload.message || 'Usuario actualizado correctamente.');
      setStatus('idle');
      await loadUsers(currentPage, userSearch);
    } catch (error) {
      setStatus('error');
      setFeedback(error.message);
    }
  }

  function startDelete(user) {
    setDeleteState({
      motivo: '',
      step: 'confirm',
      user
    });
    setExpandedActionsId(null);
    setFeedback('');
  }

  async function confirmDeleteUser() {
    if (!deleteState.motivo.trim()) {
      setStatus('error');
      setFeedback('El motivo de eliminación es obligatorio.');
      return;
    }

    setStatus('deleting');

    try {
      const response = await apiClient(`/admin/users/${deleteState.user.id}`, {
        body: JSON.stringify({ motivo_eliminacion: deleteState.motivo.trim() }),
        method: 'DELETE'
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'No se pudo eliminar el usuario.');
      }

      setDeleteState({ motivo: '', step: null, user: null });
      setFeedback(payload.message || 'Usuario desactivado correctamente.');
      setStatus('idle');
      await loadUsers(currentPage, userSearch);
    } catch (error) {
      setStatus('error');
      setFeedback(error.message);
    }
  }

  function handleUserSearch(event) {
    event.preventDefault();
    setExpandedActionsId(null);
    setUsersPage(1);
    setUserSearch(userSearchDraft);
  }

  function clearUserSearch() {
    setUserSearchDraft('');
    setUserSearch('');
    setUsersPage(1);
    setExpandedActionsId(null);
  }

  function renderFoundationFields(currentForm, onChange) {
    if (currentForm.rol !== 'fundacion') {
      return null;
    }

    return (
      <>
        <label>
          Red social
          <select
            onChange={(event) => onChange('red_social_tipo', event.target.value)}
            value={currentForm.red_social_tipo}
          >
            <option value="tiktok">TikTok</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
          </select>
        </label>
        <label>
          Usuario o enlace
          <input
            onChange={(event) => onChange('red_social_valor', event.target.value)}
            placeholder="@fundacion o enlace"
            value={currentForm.red_social_valor}
          />
        </label>
      </>
    );
  }

  function renderUserForm(currentForm, onChange, { isEdit = false } = {}) {
    return (
      <>
        <label>
          Nombre
          <input
            onChange={(event) => onChange('firstName', event.target.value)}
            placeholder="Yazmin"
            value={currentForm.firstName}
          />
        </label>
        <label>
          Apellido
          <input
            onChange={(event) => onChange('lastName', event.target.value)}
            placeholder="Osses"
            value={currentForm.lastName}
          />
        </label>
        <label>
          RUT
          <input
            onChange={(event) => onChange('rut', event.target.value)}
            placeholder="12.345.678-5"
            value={currentForm.rut}
          />
        </label>
        <label>
          Correo electrónico
          <input
            onChange={(event) => onChange('email', event.target.value)}
            placeholder="correo@ejemplo.cl"
            type="email"
            value={currentForm.email}
          />
        </label>
        <label>
          Rol
          <select
            onChange={(event) => onChange('rol', event.target.value)}
            value={currentForm.rol}
          >
            <option value="adoptante">Adoptante</option>
            <option value="fundacion">Fundación</option>
            <option value="administrador">Administrador</option>
          </select>
        </label>
        {isEdit && (
          <label>
            Estado
            <select
              onChange={(event) => onChange('estado', event.target.value)}
              value={currentForm.estado}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="suspendido">Suspendido</option>
            </select>
          </label>
        )}
        <label>
          Teléfono
          <div className="phone-input-wrap admin-phone-input-wrap">
            <span>+56</span>
            <input
              onChange={(event) => onChange('phone', event.target.value)}
              placeholder="9 0000 0000"
              type="tel"
              value={currentForm.phone}
            />
          </div>
        </label>
        <label>
          Región
          <select
            onChange={(event) => onChange('region', event.target.value)}
            value={currentForm.region}
          >
            <option value="">Selecciona una región</option>
            {CHILE_REGIONS.map((region) => (
              <option key={region.name} value={region.name}>
                {region.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Comuna
          <select
            disabled={!currentForm.region}
            onChange={(event) => onChange('commune', event.target.value)}
            value={currentForm.commune}
          >
            <option value="">
              {currentForm.region ? 'Selecciona una comuna' : 'Selecciona primero una región'}
            </option>
            {getCommunesByRegion(currentForm.region).map((commune) => (
              <option key={commune} value={commune}>
                {commune}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ciudad, localidad o sector
          <input
            onChange={(event) => onChange('city', event.target.value)}
            placeholder="Opcional"
            value={currentForm.city}
          />
        </label>
        <label>
          Dirección
          <input
            onChange={(event) => onChange('address', event.target.value)}
            placeholder="Av. Concha y Toro"
            value={currentForm.address}
          />
        </label>
        <label>
          Numeración
          <input
            onChange={(event) => onChange('addressNumber', event.target.value)}
            placeholder="1234"
            value={currentForm.addressNumber}
          />
        </label>
        <label>
          Complemento o referencia
          <input
            onChange={(event) => onChange('addressComplement', event.target.value)}
            placeholder="Depto 22, casa interior..."
            value={currentForm.addressComplement}
          />
        </label>
        <label>
          Contraseña
          <input
            onChange={(event) => onChange('password', event.target.value)}
            placeholder={isEdit ? 'Dejar vacío para mantener' : 'Mínimo 8 caracteres'}
            type="password"
            value={currentForm.password}
          />
        </label>
        <label>
          Repetir contraseña
          <input
            onChange={(event) => onChange('password_confirmation', event.target.value)}
            placeholder={isEdit ? 'Dejar vacío para mantener' : 'Repetir contraseña'}
            type="password"
            value={currentForm.password_confirmation}
          />
        </label>
        {renderFoundationFields(currentForm, onChange)}
      </>
    );
  }

  if (!currentUser?.id) {
    return (
      <section className="admin-page">
        <div className="admin-access-card">
          <span>AD</span>
          <h2>Inicia sesión para acceder al panel administrador</h2>
          <p>Esta sección está disponible solo para administradores de AdoptaLove.</p>
          <a className="admin-primary-link" href="/login">Iniciar sesión</a>
        </div>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="admin-page">
        <div className="admin-access-card">
          <span>AD</span>
          <h2>Panel no disponible</h2>
          <p>Solo usuarios con rol administrador pueden acceder a esta sección.</p>
          <a className="admin-primary-link" href="/">Volver al inicio</a>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="admin-hero">
        <div>
          <p className="section-kicker">Panel administrador</p>
          <h2>Administración de usuarios</h2>
          <p>Crea cuentas, revisa usuarios activos y desactiva accesos con registro de motivo.</p>
        </div>
      </div>

      {feedback && (
        <p className={status === 'error' ? 'admin-feedback admin-feedback-error' : 'admin-feedback'}>
          {feedback}
        </p>
      )}

      <div className="admin-users-layout">
        <form className="admin-form-card" onSubmit={handleCreateUser}>
          <div className="admin-section-heading">
            <span>NU</span>
            <div>
              <h3>Crear nuevo usuario</h3>
              <p>{roleDescription}</p>
            </div>
          </div>

          <div className="admin-user-form-grid">
            {renderUserForm(form, updateFormField)}
          </div>

          <div className="admin-form-actions">
            <button
              className="admin-secondary-button"
              onClick={() => {
                setForm(EMPTY_USER_FORM);
                setFeedback('');
              }}
              type="button"
            >
              Limpiar
            </button>
            <button className="admin-primary-button" disabled={isSaving} type="submit">
              {isSaving ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </form>

        <article className="admin-form-card">
          <div className="admin-section-heading">
            <span>LU</span>
            <div>
              <h3>Lista de usuarios actuales</h3>
              <p>Máximo 5 usuarios por página. Las contraseñas no se muestran.</p>
            </div>
          </div>

          <form className="admin-publication-toolbar admin-users-search" onSubmit={handleUserSearch}>
            <label>
              Buscar usuarios actuales
              <input
                onChange={(event) => setUserSearchDraft(event.target.value)}
                placeholder="Buscar por nombre, correo, RUT, rol, región, ciudad o comuna"
                value={userSearchDraft}
              />
            </label>
            <div>
              <button className="admin-secondary-button" disabled={isLoading} type="submit">
                Buscar
              </button>
              <button
                className="admin-secondary-button"
                disabled={isLoading && !hasUserSearch && !userSearchDraft}
                onClick={clearUserSearch}
                type="button"
              >
                Limpiar
              </button>
            </div>
          </form>

          {isLoading ? (
            <p className="admin-empty-state">Cargando usuarios...</p>
          ) : users.length === 0 ? (
            <p className="admin-empty-state">
              {hasUserSearch
                ? 'No se encontraron usuarios con ese criterio.'
                : 'No hay usuarios registrados para mostrar.'}
            </p>
          ) : (
            <div className="admin-user-list">
              {users.map((user) => (
                <article
                  className={
                    expandedActionsId === user.id
                      ? 'admin-user-card admin-user-card-actions-open'
                      : 'admin-user-card'
                  }
                  key={user.id}
                >
                  <div>
                    <strong>{user.nombre}</strong>
                    <span>{user.email}</span>
                    <small>Creado: {formatDate(user.created_at)}</small>
                  </div>
                  <div className="admin-user-meta">
                    <span className={`admin-user-pill admin-user-pill-${user.rol}`}>
                      {getRoleLabel(user.rol)}
                    </span>
                    <span className={`admin-user-pill admin-user-state-${user.estado}`}>
                      {getStateLabel(user.estado)}
                    </span>
                    {user.region && <span>{user.region}</span>}
                    {user.comuna && <span>{user.comuna}</span>}
                  </div>
                  <div className="admin-user-actions">
                    <button
                      aria-expanded={expandedActionsId === user.id}
                      aria-haspopup="menu"
                      className="admin-secondary-button admin-user-actions-toggle"
                      onClick={() => setExpandedActionsId(
                        expandedActionsId === user.id ? null : user.id
                      )}
                      type="button"
                    >
                      Acciones
                    </button>
                    {expandedActionsId === user.id && (
                      <div className="admin-user-action-menu" role="menu">
                        <button onClick={() => openEditModal(user)} role="menuitem" type="button">
                          Modificar usuario
                        </button>
                        <button onClick={() => startDelete(user)} role="menuitem" type="button">
                          Eliminar usuario
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="admin-pagination">
            <button
              className="admin-secondary-button"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => setUsersPage(currentPage - 1)}
              type="button"
            >
              Anterior
            </button>
            <span>Página {currentPage} de {totalPages}</span>
            <button
              className="admin-secondary-button"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => setUsersPage(currentPage + 1)}
              type="button"
            >
              Siguiente
            </button>
          </div>
        </article>
      </div>

      {editingUser && (
        <ModalPortal>
          <div className="admin-modal-backdrop">
            <form className="admin-modal" onSubmit={handleUpdateUser}>
              <h3>Modificar usuario</h3>
              <p>Actualiza los datos principales. La contraseña solo cambia si la completas.</p>
              <div className="admin-user-form-grid">
                {renderUserForm(editForm, updateEditField, { isEdit: true })}
              </div>
              <div className="admin-modal-actions">
                <button
                  className="admin-secondary-button"
                  onClick={() => setEditingUser(null)}
                  type="button"
                >
                  Cancelar
                </button>
                <button className="admin-primary-button" disabled={isSaving} type="submit">
                  {isSaving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {deleteState.step && (
        <ModalPortal>
          <div className="admin-modal-backdrop">
            <div className="admin-modal">
              {deleteState.step === 'confirm' ? (
                <>
                  <h3>Confirmar eliminación de usuario</h3>
                  <p>¿Estás seguro de que deseas eliminar este usuario?</p>
                  <div className="admin-modal-actions">
                    <button
                      className="admin-secondary-button"
                      onClick={() => setDeleteState({ motivo: '', step: null, user: null })}
                      type="button"
                    >
                      Cancelar
                    </button>
                    <button
                      className="admin-primary-button"
                      onClick={() => setDeleteState((currentState) => ({
                        ...currentState,
                        step: 'reason'
                      }))}
                      type="button"
                    >
                      Continuar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3>Motivo de eliminación</h3>
                  <p>Este usuario quedará desactivado y el motivo quedará registrado.</p>
                  <label className="admin-modal-field">
                    Motivo de eliminación
                    <textarea
                      onChange={(event) => setDeleteState((currentState) => ({
                        ...currentState,
                        motivo: event.target.value
                      }))}
                      placeholder="Explica por qué se desactiva este usuario."
                      value={deleteState.motivo}
                    />
                  </label>
                  <div className="admin-modal-actions">
                    <button
                      className="admin-secondary-button"
                      onClick={() => setDeleteState({ motivo: '', step: null, user: null })}
                      type="button"
                    >
                      Cancelar
                    </button>
                    <button
                      className="admin-primary-button"
                      disabled={isDeleting}
                      onClick={confirmDeleteUser}
                      type="button"
                    >
                      {isDeleting ? 'Eliminando...' : 'Eliminar usuario'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </ModalPortal>
      )}
    </section>
  );
}
