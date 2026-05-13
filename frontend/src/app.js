const API_BASE_URL = "http://localhost:3000/api";
const connectionStatus = document.getElementById("connection-status");
const taskForm = document.getElementById("task-form");
const taskList = document.getElementById("task-list");

const enableNotificationsButton = document.getElementById("enable-notifications-button");
const testNotificationButton = document.getElementById("test-notification-button");
const notificationStatus = document.getElementById("notification-status");

function createClientId() {
  if (crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function updateConnectionStatus() {
  if (navigator.onLine) {
    connectionStatus.textContent = "Povezava je aktivna. Podatki se lahko sinhronizirajo.";
    connectionStatus.className = "online";
  } else {
    connectionStatus.textContent = "Trenutno si brez povezave. Spremembe bodo shranjene lokalno.";
    connectionStatus.className = "offline";
  }
}

function clearFormErrors() {
  const titleInput = document.getElementById("task-title");
  const subjectInput = document.getElementById("task-subject");
  const dueDateInput = document.getElementById("task-due-date");
  const priorityInput = document.getElementById("task-priority");

  const titleError = document.getElementById("task-title-error");
  const subjectError = document.getElementById("task-subject-error");
  const dueDateError = document.getElementById("task-due-date-error");
  const priorityError = document.getElementById("task-priority-error");

  const errorSummary = document.getElementById("form-error-summary");
  const errorList = document.getElementById("form-error-list");

  titleError.textContent = "";
  subjectError.textContent = "";
  dueDateError.textContent = "";
  priorityError.textContent = "";

  errorList.innerHTML = "";
  errorSummary.hidden = true;

  titleInput.removeAttribute("aria-invalid");
  subjectInput.removeAttribute("aria-invalid");
  dueDateInput.removeAttribute("aria-invalid");
  priorityInput.removeAttribute("aria-invalid");
}

function validateTaskForm() {
  const titleInput = document.getElementById("task-title");
  const subjectInput = document.getElementById("task-subject");
  const dueDateInput = document.getElementById("task-due-date");
  const priorityInput = document.getElementById("task-priority");

  const titleError = document.getElementById("task-title-error");
  const subjectError = document.getElementById("task-subject-error");
  const dueDateError = document.getElementById("task-due-date-error");
  const priorityError = document.getElementById("task-priority-error");

  const errorSummary = document.getElementById("form-error-summary");
  const errorList = document.getElementById("form-error-list");

  const title = titleInput.value.trim();
  const subject = subjectInput.value.trim();
  const dueDate = dueDateInput.value;
  const priority = priorityInput.value;

  let hasError = false;

  clearFormErrors();

  if (!title) {
    hasError = true;
    titleError.textContent = "Vnesi naslov naloge.";
    titleInput.setAttribute("aria-invalid", "true");

    const li = document.createElement("li");
    li.innerHTML = '<a href="#task-title">Naslov naloge je obvezen.</a>';
    errorList.appendChild(li);
  }

  if (!subject) {
    hasError = true;
    subjectError.textContent = "Vnesi predmet.";
    subjectInput.setAttribute("aria-invalid", "true");

    const li = document.createElement("li");
    li.innerHTML = '<a href="#task-subject">Predmet je obvezen.</a>';
    errorList.appendChild(li);
  }

  if (!dueDate) {
    hasError = true;
    dueDateError.textContent = "Izberi rok naloge.";
    dueDateInput.setAttribute("aria-invalid", "true");

    const li = document.createElement("li");
    li.innerHTML = '<a href="#task-due-date">Rok naloge je obvezen.</a>';
    errorList.appendChild(li);
  }

  if (!priority) {
    hasError = true;
    priorityError.textContent = "Izberi prioriteto naloge.";
    priorityInput.setAttribute("aria-invalid", "true");

    const li = document.createElement("li");
    li.innerHTML = '<a href="#task-priority">Prioriteta je obvezna.</a>';
    errorList.appendChild(li);
  }

  if (hasError) {
    errorSummary.hidden = false;
    errorSummary.focus();

    return {
      isValid: false
    };
  }

  return {
    isValid: true,
    title,
    subject,
    dueDate,
    priority
  };
}

function formatDateTime(dateString) {
  const date = new Date(dateString);

  return date.toLocaleString("sl-SI", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function formatDateOnly(dateString) {
  const date = new Date(dateString);

  return date.toLocaleDateString("sl-SI", {
    dateStyle: "medium"
  });
}

function getPriorityText(priority) {
  if (priority === "low") {
    return "Nizka prioriteta";
  }

  if (priority === "medium") {
    return "Srednja prioriteta";
  }

  if (priority === "high") {
    return "Visoka prioriteta";
  }

  return "Prioriteta ni določena";
}

function getPriorityClass(priority) {
  if (priority === "low") {
    return "priority-low";
  }

  if (priority === "medium") {
    return "priority-medium";
  }

  if (priority === "high") {
    return "priority-high";
  }

  return "";
}

function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = "task-item";

  const content = document.createElement("div");
  content.className = "task-main";

  const title = document.createElement("span");
  title.className = "task-title";
  title.textContent = task.title;

  const meta = document.createElement("span");
  meta.className = "task-meta";
  meta.textContent = `${task.subject} · dodano ${formatDateTime(task.createdAt)}`;

  const dueDate = document.createElement("span");
  dueDate.className = "due-date";
  dueDate.textContent = `Rok: ${formatDateOnly(task.dueDate)}`;

  const priority = document.createElement("span");
  priority.className = `priority-label ${getPriorityClass(task.priority)}`;
  priority.textContent = getPriorityText(task.priority);

  const syncStatus = document.createElement("span");
  syncStatus.className = task.synced ? "sync-status synced" : "sync-status pending";
  syncStatus.textContent = task.synced ? "Sinhronizirano" : "Čaka na sinhronizacijo";

  content.appendChild(title);
  content.appendChild(meta);
  content.appendChild(dueDate);
  content.appendChild(priority);
  content.appendChild(syncStatus);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-button";
  deleteButton.textContent = "Izbriši";
  deleteButton.setAttribute("aria-label", `Izbriši nalogo ${task.title}`);

  deleteButton.addEventListener("click", async () => {
    try {
      await window.studySyncDB.deleteTask(task.id);
      await renderTasks();
    } catch (error) {
      console.error("Napaka pri brisanju naloge:", error);
    }
  });

  li.appendChild(content);
  li.appendChild(deleteButton);

  return li;
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
    throw new Error("Naloge ni bilo mogoče poslati na strežnik.");
  }

  return response.json();
}

async function syncUnsyncedTasks() {
  if (!navigator.onLine) {
    return;
  }

  try {
    const unsyncedTasks = await window.studySyncDB.getUnsyncedTasks();

    for (const task of unsyncedTasks) {
      const result = await sendTaskToServer(task);

      const updatedTask = {
        ...task,
        synced: true,
        serverId: result.task.serverId,
        syncedAt: result.task.syncedAt
      };

      await window.studySyncDB.updateTask(updatedTask);
    }

    await renderTasks();
  } catch (error) {
    console.error("Napaka pri sinhronizaciji:", error);
  }
}

async function registerBackgroundSync() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  if (!("SyncManager" in window)) {
    console.log("Background Sync ni podprt. Uporabljam navadno sinhronizacijo.");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register("sync-tasks");
    console.log("Background Sync za naloge je registriran.");
  } catch (error) {
    console.error("Background Sync registracija ni uspela:", error);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

async function getVapidPublicKey() {
  const response = await fetch(`${API_BASE_URL}/push/public-key`);

  if (!response.ok) {
    throw new Error("Javnega ključa za obvestila ni bilo mogoče pridobiti.");
  }

  const data = await response.json();
  return data.publicKey;
}

async function enablePushNotifications() {
  if (!("Notification" in window)) {
    notificationStatus.textContent = "Ta brskalnik ne podpira obvestil.";
    return;
  }

  if (!("serviceWorker" in navigator)) {
    notificationStatus.textContent = "Service Worker ni podprt.";
    return;
  }

  if (!("PushManager" in window)) {
    notificationStatus.textContent = "Push obvestila niso podprta v tem brskalniku.";
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    notificationStatus.textContent = "Obvestila niso bila dovoljena.";
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const publicKey = await getVapidPublicKey();

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    const response = await fetch(`${API_BASE_URL}/push/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(subscription)
    });

    if (!response.ok) {
      throw new Error("Naročnine ni bilo mogoče shraniti na strežnik.");
    }

    notificationStatus.textContent = "Obvestila so omogočena.";
  } catch (error) {
    console.error("Napaka pri omogočanju obvestil:", error);
    notificationStatus.textContent = "Obvestil trenutno ni mogoče omogočiti.";
  }
}

async function sendTestNotification() {
  try {
    const response = await fetch(`${API_BASE_URL}/push/test`, {
      method: "POST"
    });

    if (!response.ok) {
      throw new Error("Testnega obvestila ni bilo mogoče poslati.");
    }

    notificationStatus.textContent = "Testno obvestilo je bilo poslano.";
  } catch (error) {
    console.error("Napaka pri testnem obvestilu:", error);
    notificationStatus.textContent = "Testnega obvestila ni bilo mogoče poslati.";
  }
}

enableNotificationsButton.addEventListener("click", enablePushNotifications);
testNotificationButton.addEventListener("click", sendTestNotification);

async function renderTasks() {
  try {
    const tasks = await window.studySyncDB.getAllTasks();

    taskList.innerHTML = "";

    if (tasks.length === 0) {
      const emptyItem = document.createElement("li");
      emptyItem.className = "empty-state";
      emptyItem.textContent = "Trenutno še nimaš dodanih nalog.";
      taskList.appendChild(emptyItem);
      return;
    }

    tasks.forEach(task => {
      const taskElement = createTaskElement(task);
      taskList.appendChild(taskElement);
    });
  } catch (error) {
    console.error("Napaka pri prikazu nalog:", error);

    taskList.innerHTML = "";

    const errorItem = document.createElement("li");
    errorItem.className = "error-message";
    errorItem.textContent = "Naloge trenutno niso na voljo.";
    taskList.appendChild(errorItem);
  }
}

window.addEventListener("online", async () => {
  updateConnectionStatus();
  await syncUnsyncedTasks();
});

window.addEventListener("offline", updateConnectionStatus);

updateConnectionStatus();

taskForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const validation = validateTaskForm();

  if (!validation.isValid) {
    return;
  }

  const newTask = {
    clientId: createClientId(),
    title: validation.title,
    subject: validation.subject,
    dueDate: validation.dueDate,
    priority: validation.priority,
    createdAt: new Date().toISOString(),
    synced: false
  };

  try {
    await window.studySyncDB.addTask(newTask);

    taskForm.reset();
    clearFormErrors();

    await renderTasks();

    await registerBackgroundSync();
    
    if (navigator.onLine) {
      await syncUnsyncedTasks();
    }
  } catch (error) {
    console.error("Napaka pri shranjevanju naloge:", error);
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("/service-worker.js");
      console.log("Service Worker je registriran.");
    } catch (error) {
      console.error("Napaka pri registraciji Service Workerja:", error);
    }
  });
}

renderTasks();

if (navigator.onLine) {
  syncUnsyncedTasks();
}