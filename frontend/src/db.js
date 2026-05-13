const DB_NAME = "studysync-db";
const DB_VERSION = 1;
const TASK_STORE = "tasks";

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

async function addTaskToDB(task) {
  const db = await openStudySyncDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(TASK_STORE, "readwrite");
    const store = transaction.objectStore(TASK_STORE);

    const request = store.add(task);

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

async function getAllTasksFromDB() {
  const db = await openStudySyncDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(TASK_STORE, "readonly");
    const store = transaction.objectStore(TASK_STORE);

    const request = store.getAll();

    request.onsuccess = () => {
      const tasks = request.result.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      resolve(tasks);
    };

    request.onerror = () => {
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

async function deleteTaskFromDB(id) {
  const db = await openStudySyncDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(TASK_STORE, "readwrite");
    const store = transaction.objectStore(TASK_STORE);

    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
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

async function getUnsyncedTasksFromDB() {
  const tasks = await getAllTasksFromDB();

  return tasks.filter(task => task.synced === false);
}

async function getPendingDeleteTasksFromDB() {
  const tasks = await getAllTasksFromDB();

  return tasks.filter(task => task.pendingDelete === true);
}

window.studySyncDB = {
  addTask: addTaskToDB,
  getAllTasks: getAllTasksFromDB,
  deleteTask: deleteTaskFromDB,
  updateTask: updateTaskInDB,
  getUnsyncedTasks: getUnsyncedTasksFromDB,
  getPendingDeleteTasks: getPendingDeleteTasksFromDB
};