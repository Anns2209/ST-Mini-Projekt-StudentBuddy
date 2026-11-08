const { test, expect } = require('./fixtures');

const subject = 'Zanesljivost in testiranje IS';
const row = (page, title) => page.getByRole('list', { name: 'Seznam dodanih nalog' })
  .getByRole('listitem').filter({ has: page.getByText(title, { exact: true }) });

async function form(page, data) {
  await page.getByLabel(/^Naslov naloge\s*\*?$/).fill(data.title);
  await page.getByLabel(/^Predmet\s*\*?$/).fill(data.subject);
  await page.getByLabel(/^Rok naloge\s*\*?$/).fill(data.dueDate);
  await page.getByLabel(/^Prioriteta\s*\*?$/).selectOption(data.priority);
  await checkForm(page, data);
}

async function checkForm(page, data) {
  await expect(page.getByLabel(/^Naslov naloge\s*\*?$/)).toHaveValue(data.title);
  await expect(page.getByLabel(/^Predmet\s*\*?$/)).toHaveValue(data.subject);
  await expect(page.getByLabel(/^Rok naloge\s*\*?$/)).toHaveValue(data.dueDate);
  await expect(page.getByLabel(/^Prioriteta\s*\*?$/)).toHaveValue(data.priority);
}

async function visibleTask(page, data, synced = true) {
  const item = row(page, data.title);
  await expect(item).toHaveCount(1);
  await expect(item.locator('.task-meta')).toContainText(data.subject);
  const date = new Intl.DateTimeFormat('sl-SI', { dateStyle: 'medium', timeZone: 'Europe/Ljubljana' })
    .format(new Date(data.dueDate));
  await expect(item.locator('.due-date')).toHaveText(`Rok: ${date}`);
  await expect(item.locator('.priority-label')).toHaveText(
    { low: 'Nizka prioriteta', medium: 'Srednja prioriteta', high: 'Visoka prioriteta' }[data.priority]);
  await expect(item.locator('.sync-status')).toHaveText(synced ? 'Sinhronizirano' : 'Čaka na sinhronizacijo');
}

async function stored(backend, data) {
  await expect.poll(async () => (await backend.tasks()).filter(t => t.title === data.title)).toEqual([
    expect.objectContaining(data)
  ]);
}

async function add(page, backend, data) {
  expect((await backend.tasks()).some(t => t.title === data.title)).toBe(false);
  await expect(row(page, data.title)).toHaveCount(0);
  await form(page, data);
  await page.getByRole('button', { name: 'Dodaj nalogo', exact: true }).click();
  await expect(page.locator('#form-error-summary')).toBeHidden();
  await visibleTask(page, data);
  await stored(backend, data);
}

async function remove(page, backend, title) {
  await row(page, title).getByRole('button', { name: `Izbriši nalogo ${title}`, exact: true }).click();
  await expect(row(page, title)).toHaveCount(0);
  await expect.poll(async () => (await backend.tasks()).filter(t => t.title === title)).toEqual([]);
}

test('TC-01: Dodajanje nove študijske obveznosti', async ({ page, backend }) => {
  const data = { title: 'ZTIS_TC01_Kolokvij', subject, dueDate: '2026-11-12', priority: 'high' };
  await add(page, backend, data);
  await page.reload();
  await visibleTask(page, data);
  await stored(backend, data);
  await remove(page, backend, data.title);
});

test('TC-02: Validacija obveznega naslova', async ({ page, backend }) => {
  const before = await backend.tasks();
  await expect(page.getByRole('heading', { name: 'Dodaj nalogo', exact: true })).toBeVisible();
  await form(page, { title: '', subject, dueDate: '2026-11-12', priority: 'medium' });
  await page.getByRole('button', { name: 'Dodaj nalogo', exact: true }).click();
  await expect(page.locator('#task-title-error')).toHaveText('Vnesi naslov naloge.');
  await expect(page.getByLabel(/^Naslov naloge\s*\*?$/)).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#form-error-summary')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Naslov naloge je obvezen.' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel(/^Naslov naloge\s*\*?$/)).toBeFocused();
  await expect(page.locator('#task-list .task-item')).toHaveCount(0);
  expect(await page.evaluate(() => window.studySyncDB.getAllTasks())).toEqual([]);
  expect(await backend.tasks()).toEqual(before);
  await page.reload();
  await expect(page.getByLabel(/^Naslov naloge\s*\*?$/)).toHaveValue('');
});

test('TC-03: Urejanje obstoječe obveznosti', async ({ page, backend }) => {
  const initial = { title: 'ZTIS_TC03_Porocilo', subject: 'Baze podatkov', dueDate: '2026-11-15', priority: 'low' };
  const updated = { ...initial, title: 'ZTIS_TC03_Porocilo_popravljeno', dueDate: '2026-11-20', priority: 'high' };
  await add(page, backend, initial);
  const original = (await backend.tasks())[0];
  await row(page, initial.title).getByRole('button', { name: `Uredi nalogo ${initial.title}`, exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Uredi nalogo', exact: true })).toBeVisible();
  await checkForm(page, initial);
  await form(page, updated);
  await page.getByRole('button', { name: 'Shrani spremembe', exact: true }).click();
  await expect(page.locator('#form-error-summary')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Dodaj nalogo', exact: true })).toBeVisible();
  await visibleTask(page, updated);
  await page.reload();
  await visibleTask(page, updated);
  await expect(row(page, initial.title)).toHaveCount(0);
  await stored(backend, updated);
  expect(await backend.tasks()).toEqual([expect.objectContaining({ ...updated, serverId: original.serverId })]);
  await remove(page, backend, updated.title);
});

test('TC-04: Brisanje obstoječe obveznosti', async ({ page, backend }) => {
  const other = { title: 'ZTIS_Kontrolna_naloga', subject: 'Kontrolni predmet', dueDate: '2026-12-01', priority: 'medium' };
  const data = { title: 'ZTIS_TC04_ZacasnaNaloga', subject, dueDate: '2026-11-18', priority: 'low' };
  await add(page, backend, other);
  const baseline = await backend.tasks();
  await add(page, backend, data);
  page.on('dialog', dialog => dialog.accept());
  await remove(page, backend, data.title);
  await visibleTask(page, other);
  expect(await backend.tasks()).toEqual(baseline);
  await page.reload();
  await expect(row(page, data.title)).toHaveCount(0);
  await visibleTask(page, other);
  expect(await backend.tasks()).toEqual(baseline);
  await remove(page, backend, other.title);
});

test('TC-05: Offline dodajanje in kasnejša sinhronizacija', async ({ page, backend, request }) => {
  const data = { title: 'ZTIS_TC05_OfflineRok', subject, dueDate: '2026-11-25', priority: 'high' };
  expect(await backend.tasks()).toEqual([]);
  await backend.stop();
  await expect(request.get('http://localhost:3000/api/health', { timeout: 2000 })).rejects.toThrow();
  expect((await request.get('http://localhost:5173')).ok()).toBe(true);
  await form(page, data);
  await page.getByRole('button', { name: 'Dodaj nalogo', exact: true }).click();
  await visibleTask(page, data, false);
  await expect.poll(() => page.evaluate(() => window.studySyncDB.getAllTasks())).toEqual([
    expect.objectContaining({ ...data, synced: false })
  ]);
  await page.reload();
  await visibleTask(page, data, false);
  await backend.start();
  // The application listens for this event; navigator remains online because only the backend stopped.
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await visibleTask(page, data);
  await stored(backend, data);
  await page.reload();
  await visibleTask(page, data);
  await stored(backend, data);
  await remove(page, backend, data.title);
});
