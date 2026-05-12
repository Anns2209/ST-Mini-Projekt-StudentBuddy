const CACHE_NAME = "studysync-cache-v5";
const DB_NAME = "studysync-db";
const DB_VERSION = 1;
const TASK_STORE = "tasks";
const API_BASE_URL = "http://localhost:3000/api";

const STATIC_FILES = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
  "/src/styles.css",
  "/src/db.js",
  "/src/app.js",
  "/icons/icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_FILES);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});

self.addEventListener("sync", event => {
  if (event.tag === "sync-tasks") {
    event.waitUntil(syncUnsyncedTasksInBackground());
  }
});

function openStudySyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = event => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(TASK_STORE)) {
        const store = db.createObjectStore(TASK_STORE, {
          keyPath: "id",
          autoIncrement: true
        });

        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("synced", "synced", { unique: false });
      }
    };
  });
}

async function getAllTasksFromDB() {
  const db = await openStudySyncDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(TASK_STORE, "readonly");
    const store = transaction.objectStore(TASK_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

async function updateTaskInDB(task) {
  const db = await openStudySyncDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(TASK_STORE, "readwrite");
    const store = transaction.objectStore(TASK_STORE);
    const request = store.put(task);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

async function sendTaskToServer(task) {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      clientId: task.clientId,
      title: task.title,
      subject: task.subject,
      dueDate: task.dueDate,
      priority: task.priority,
      createdAt: task.createdAt
    })
  });

  if (!response.ok) {
    throw new Error("Background Sync: pošiljanje naloge ni uspelo.");
  }

  return response.json();
}

async function syncUnsyncedTasksInBackground() {
  const tasks = await getAllTasksFromDB();
  const unsyncedTasks = tasks.filter(task => task.synced === false);

  for (const task of unsyncedTasks) {
    const result = await sendTaskToServer(task);

    const updatedTask = {
      ...task,
      synced: true,
      serverId: result.task.serverId,
      syncedAt: result.task.syncedAt
    };

    await updateTaskInDB(updatedTask);
  }

  const clientsList = await self.clients.matchAll();

  clientsList.forEach(client => {
    client.postMessage({
      type: "TASKS_SYNCED"
    });
  });
}