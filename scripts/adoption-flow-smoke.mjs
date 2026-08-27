import { chromium, webkit } from 'playwright';

const BASE_URL = process.env.ADOPTALOVE_TEST_URL || 'http://127.0.0.1:3000';

const pet = {
  id: 'test-pet',
  nombre: 'Luna',
  especie: 'perro',
  raza: 'mestiza',
  sexo: 'hembra',
  estado: 'disponible',
  tamano: 'mediano',
  descripcion: 'Mascota de prueba',
  publicada_por: 'Fundación de prueba',
  foto_url: null,
  edad_anios: 2,
  edad_meses: 0,
};

const user = {
  id: 99,
  nombre: 'Usuario Prueba',
  email: 'usuario@example.com',
  rut: '12.345.678-5',
  telefono: '+56911111111',
  region: 'Metropolitana de Santiago',
  comuna: 'Santiago',
  ciudad: 'Santiago',
  direccion: 'Calle Prueba',
  numeracion: '123',
  rol: 'adoptante',
};

async function mockApi(page, submittedApplications) {
  await page.route('**/api/mascotas/test-pet', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: pet }),
    }),
  );

  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { user } }),
    }),
  );

  await page.route('**/api/solicitudes-adopcion/me/activa', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: null }),
    }),
  );

  await page.route('**/api/solicitudes-adopcion', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();

    submittedApplications.push(route.request().postDataJSON());
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: 501,
          estado: 'pendiente',
          adoptante_usuario_id: user.id,
          mascota_id: pet.id,
        },
      }),
    });
  });
}

async function openAdoptionForm(page) {
  await page.goto(`${BASE_URL}/mascotas/test-pet`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: 'Postular adopción' }).click();
  await page.getByRole('heading', { name: 'Información de tu perfil' }).waitFor({ timeout: 20_000 });
  await page.getByRole('heading', { name: 'Información sobre tu hogar' }).waitFor({ timeout: 20_000 });
}

async function verifyAnonymous(browserType, label) {
  const browser = await browserType.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    const submittedApplications = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await mockApi(page, submittedApplications);

    await openAdoptionForm(page);
    const body = await page.locator('body').innerText();

    if (body.includes('No pudimos iniciar AdoptaLove')) {
      throw new Error(`${label} anonymous: runtime boundary shown`);
    }
    if (!body.includes('Debes iniciar sesión para postular a una adopción.')) {
      throw new Error(`${label} anonymous: login requirement missing`);
    }
    if (await page.getByRole('button', { name: 'Enviar solicitud de adopción' }).isEnabled()) {
      throw new Error(`${label} anonymous: submit button must remain disabled`);
    }
    if (submittedApplications.length !== 0) {
      throw new Error(`${label} anonymous: application submitted without authentication`);
    }
    if (errors.length) {
      throw new Error(`${label} anonymous page errors: ${errors.join(' | ')}`);
    }

    console.log(`${label} anonymous adoption flow OK`);
  } finally {
    await browser.close();
  }
}

async function verifySignedIn(browserType, label) {
  const browser = await browserType.launch({ headless: true });
  try {
    const context = await browser.newContext();
    await context.addInitScript((storedUser) => {
      window.localStorage.setItem('adoptalove_token', 'test-token');
      window.localStorage.setItem('adoptalove_user', JSON.stringify(storedUser));
    }, user);

    const page = await context.newPage();
    const errors = [];
    const submittedApplications = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await mockApi(page, submittedApplications);

    await openAdoptionForm(page);
    await page.locator('.adoption-profile-summary').waitFor({ timeout: 20_000 });

    const beforeSubmit = await page.locator('body').innerText();
    if (beforeSubmit.includes('No pudimos iniciar AdoptaLove')) {
      throw new Error(`${label} signed-in: runtime boundary shown`);
    }
    if (beforeSubmit.includes('Debes iniciar sesión para postular a una adopción.')) {
      throw new Error(`${label} signed-in: authenticated user treated as anonymous`);
    }

    await page.locator('#home-type').selectOption('Casa');
    await page.locator('#outdoor-space').selectOption('Sí, tengo patio o espacio al aire libre');
    await page.locator('#household-people').selectOption('2 personas');
    await page.locator('#other-pets').selectOption('No tengo otras mascotas');
    await page.locator('#adoption-reason').fill('Quiero darle un hogar responsable y acompañarla toda su vida.');
    await page.locator('#time-at-home').selectOption('Entre 4 y 8 horas al día');
    await page.locator('#responsible-person').selectOption('Yo seré el principal responsable');
    await page.locator('input[name="can-cover-costs"][value="Sí, puedo cubrir alimentación y salud"]').check();
    await page.locator('input[name="accepts-follow-up"][value="Sí, acepto visitas de seguimiento"]').check();

    const submit = page.getByRole('button', { name: 'Enviar solicitud de adopción' });
    if (!(await submit.isEnabled())) {
      throw new Error(`${label} signed-in: submit button remained disabled`);
    }

    await submit.click();
    await page.getByText('Tu solicitud de adopción fue enviada correctamente.', { exact: true }).waitFor({ timeout: 20_000 });

    if (submittedApplications.length !== 1) {
      throw new Error(`${label} signed-in: expected one application POST, got ${submittedApplications.length}`);
    }

    const application = submittedApplications[0];
    if (application.adoptante_usuario_id !== user.id || application.mascota_id !== pet.id) {
      throw new Error(`${label} signed-in: application identifiers are incorrect`);
    }
    if (!application.mensaje?.includes('Motivo: Quiero darle un hogar responsable')) {
      throw new Error(`${label} signed-in: form answers were not serialized`);
    }
    if (errors.length) {
      throw new Error(`${label} signed-in page errors: ${errors.join(' | ')}`);
    }

    console.log(`${label} signed-in adoption submission OK`);
  } finally {
    await browser.close();
  }
}

for (const [browserType, label] of [
  [chromium, 'Chromium'],
  [webkit, 'WebKit'],
]) {
  await verifyAnonymous(browserType, label);
  await verifySignedIn(browserType, label);
}
