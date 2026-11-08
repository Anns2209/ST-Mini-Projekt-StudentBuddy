const base = require('@playwright/test');
const { mkdtemp, mkdir, copyFile, writeFile, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const net = require('node:net');
const { once } = require('node:events');

const test = base.test.extend({
  backend: async ({ request }, use) => {
    // Refuse to interact with an existing personal backend.
    const probe = net.createServer();
    await new Promise((resolve, reject) => {
      probe.once('error', reject);
      probe.listen(3000, resolve);
    });
    await new Promise(resolve => probe.close(resolve));
    const directory = await mkdtemp(path.join(tmpdir(), 'studysync-e2e-'));
    await mkdir(path.join(directory, 'data'));
    await copyFile(path.resolve('backend/server.js'), path.join(directory, 'server.js'));
    await writeFile(path.join(directory, 'data/tasks.json'), '[]');
    await writeFile(path.join(directory, 'data/subscriptions.json'), '[]');
    let child;
    let logs = '';
    const backend = {
      async start() {
        child = spawn(process.execPath, [path.join(directory, 'server.js')], {
          env: { ...process.env, PORT: '3000', NODE_PATH: path.resolve('backend/node_modules') },
          stdio: ['ignore', 'pipe', 'pipe']
        });
        child.stdout.on('data', data => { logs += data; });
        child.stderr.on('data', data => { logs += data; });
        await base.expect.poll(async () => {
          if (child.exitCode !== null) throw new Error(logs);
          try { return (await request.get('http://localhost:3000/api/health')).ok(); }
          catch { return false; }
        }).toBe(true);
      },
      async stop() {
        if (child && child.exitCode === null && child.signalCode === null) {
          const exited = once(child, 'exit');
          child.kill('SIGTERM');
          await exited;
        }
      },
      async tasks() {
        const response = await request.get('http://localhost:3000/api/tasks');
        base.expect(response.ok()).toBe(true);
        return (await response.json()).tasks;
      }
    };
    try {
      await backend.start();
      await use(backend);
    } finally {
      await backend.stop();
      await rm(directory, { recursive: true, force: true });
    }
  },
  ready: [async ({ page, backend }, use, testInfo) => {
    await page.goto('/');
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
    await base.expect(page.getByRole('list', { name: 'Seznam dodanih nalog' }))
      .toContainText('Trenutno še nimaš dodanih nalog.');
    await use();
    if (testInfo.status !== testInfo.expectedStatus) {
      const local = await page.evaluate(() => window.studySyncDB.getAllTasks()).catch(() => []);
      const server = await backend.tasks().catch(() => 'Backend ni dosegljiv');
      await testInfo.attach('stanje-pred-ciscenjem', {
        body: JSON.stringify({ local, server }, null, 2), contentType: 'application/json'
      });
    }
  }, { auto: true }]
});

module.exports = { test, expect: base.expect };
