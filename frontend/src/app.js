const API_BASE_URL = "http://localhost:3000/api";
const connectionStatus = document.getElementById("connection-status");
const taskForm = document.getElementById("task-form");
const taskList = document.getElementById("task-list");

const enableNotificationsButton = document.getElementById("enable-notifications-button");
const notificationStatus = document.getElementById("notification-status");
const dueRemindersButton = document.getElementById("due-reminders-button");

const submitTaskButton = document.getElementById("submit-task-button");
const cancelEditButton = document.getElementById("cancel-edit-button");

let editingTaskId = null;

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

function startEditingTask(task) {
  editingTaskId = task.id;

  document.getElementById("task-title").value = task.title;
  document.getElementById("task-subject").value = task.subject;
  document.getElementById("task-due-date").value = task.dueDate;
  document.getElementById("task-priority").value = task.priority;

  submitTaskButton.textContent = "Shrani spremembe";
  cancelEditButton.hidden = false;

  document.getElementById("task-form-title").textContent = "Uredi nalogo";

  document.getElementById("task-title").focus();
}

function cancelEditingTask() {
  editingTaskId = null;

  taskForm.reset();
  clearFormErrors();

  submitTaskButton.textContent = "Dodaj nalogo";
  cancelEditButton.hidden = true;

  document.getElementById("task-form-title").textContent = "Dodaj nalogo";
}

function createTaskSummary(task) {
  const priorityText = getPriorityText(task.priority);
  const syncText = task.synced ? "Sinhronizirano" : "Čaka na sinhronizacijo";
  const dueDateText = task.dueDate ? formatDateOnly(task.dueDate) : "Rok ni določen";

  return [
    `Naloga: ${task.title}`,
    `Predmet: ${task.subject}`,
    `Rok: ${dueDateText}`,
    `Prioriteta: ${priorityText}`,
    `Status: ${syncText}`
  ].join("\n");
}

async function copyTaskToClipboard(task) {
  const summary = createTaskSummary(task);

  try {
    if (!navigator.clipboard) {
      throw new Error("Clipboard API ni podprt v tem brskalniku.");
    }

    await navigator.clipboard.writeText(summary);

    if (notificationStatus) {
      notificationStatus.textContent = `Povzetek naloge "${task.title}" je bil kopiran v odložišče.`;
    }
  } catch (error) {
    console.error("Napaka pri kopiranju:", error);

    if (notificationStatus) {
      notificationStatus.textContent = "Kopiranje trenutno ni uspelo.";
    }
  }
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

  const actions = document.createElement("div");
actions.className = "task-actions";

const copyButton = document.createElement("button");
copyButton.type = "button";
copyButton.className = "copy-button";
copyButton.textContent = "Kopiraj";
copyButton.setAttribute("aria-label", `Kopiraj povzetek naloge ${task.title}`);

copyButton.addEventListener("click", async () => {
  await copyTaskToClipboard(task);
});

const editButton = document.createElement("button");
editButton.type = "button";
editButton.className = "edit-button";
editButton.textContent = "Uredi";
editButton.setAttribute("aria-label", `Uredi nalogo ${task.title}`);

editButton.addEventListener("click", () => {
  startEditingTask(task);
});

const deleteButton = document.createElement("button");
deleteButton.type = "button";
deleteButton.className = "delete-button";
deleteButton.textContent = "Izbriši";
deleteButton.setAttribute("aria-label", `Izbriši nalogo ${task.title}`);

deleteButton.addEventListener("click", async () => {
  await handleDeleteTask(task);
});

actions.appendChild(copyButton);
actions.appendChild(editButton);
actions.appendChild(deleteButton);

li.appendChild(content);
li.appendChild(actions);



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

async function updateTaskOnServer(task) {
  const response = await fetch(`${API_BASE_URL}/tasks/${task.serverId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: task.title,
      subject: task.subject,
      dueDate: task.dueDate,
      priority: task.priority
    })
  });

  if (!response.ok) {
    throw new Error("Naloge ni bilo mogoče posodobiti na strežniku.");
  }

  return response.json();
}

async function deleteTaskFromServer(serverId) {
  const response = await fetch(`${API_BASE_URL}/tasks/${serverId}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("Naloge ni bilo mogoče izbrisati s strežnika.");
  }

  return response.json();
}

async function getTasksFromServer() {
  const response = await fetch(`${API_BASE_URL}/tasks`);

  if (!response.ok) {
    throw new Error("Naloge s strežnika niso dosegljive.");
  }

  const data = await response.json();
  return data.tasks || [];
}

async function pullServerTasksToLocalDB() {
  try {
    console.log("Preverjam naloge na strežniku ...");

    const serverTasks = await getTasksFromServer();
    const localTasks = await window.studySyncDB.getAllTasks();

    const localClientIds = new Set(
      localTasks
        .map(task => task.clientId)
        .filter(Boolean)
    );

    for (const serverTask of serverTasks) {
      if (!serverTask.clientId) {
        continue;
      }

      const existsLocally = localClientIds.has(serverTask.clientId);

      if (!existsLocally) {
        const localTask = {
          clientId: serverTask.clientId,
          serverId: serverTask.serverId,
          title: serverTask.title,
          subject: serverTask.subject,
          dueDate: serverTask.dueDate,
          priority: serverTask.priority,
          createdAt: serverTask.createdAt,
          syncedAt: serverTask.syncedAt,
          updatedAt: serverTask.updatedAt,
          synced: true,
          pendingUpdate: false,
          pendingDelete: false
        };

        await window.studySyncDB.addTask(localTask);

        console.log("Naloga dodana iz strežnika v IndexedDB:", serverTask.title);
      }
    }

    await renderTasks();
  } catch (error) {
    console.error("Prenos nalog iz strežnika v IndexedDB ni uspel:", error);
  }
}

async function repairMissingServerTasks() {
  try {
    console.log("Preverjam, ali lokalne naloge manjkajo na strežniku ...");

    const localTasks = await window.studySyncDB.getAllTasks();
    const serverTasks = await getTasksFromServer();

    const serverClientIds = new Set(
      serverTasks
        .map(task => task.clientId)
        .filter(Boolean)
    );

    const visibleLocalTasks = localTasks.filter(task => {
      return task.pendingDelete !== true;
    });

    for (const task of visibleLocalTasks) {
      let taskToSync = task;

      if (!taskToSync.clientId) {
        taskToSync = {
          ...taskToSync,
          clientId: createClientId()
        };
      }

      const existsOnServer = serverClientIds.has(taskToSync.clientId);

      if (!existsOnServer) {
        console.log("Naloga manjka na strežniku, ponovno jo pošiljam:", taskToSync.title);

        const result = await sendTaskToServer(taskToSync);

        const repairedTask = {
          ...taskToSync,
          synced: true,
          pendingUpdate: false,
          serverId: result.task.serverId,
          syncedAt: result.task.syncedAt
        };

        await window.studySyncDB.updateTask(repairedTask);
      }
    }

    await renderTasks();
  } catch (error) {
    console.error("Popravilo manjkajočih nalog na strežniku ni uspelo:", error);
  }
}

async function syncPendingDeletes() {
  if (!navigator.onLine) {
    return;
  }

  try {
    const pendingDeletes = await window.studySyncDB.getPendingDeleteTasks();

    for (const task of pendingDeletes) {
      if (task.serverId) {
        await deleteTaskFromServer(task.serverId);
      }

      await window.studySyncDB.deleteTask(task.id);
    }

    await renderTasks();
  } catch (error) {
    console.error("Napaka pri sinhronizaciji brisanja:", error);
  }
}

async function handleDeleteTask(task) {
  try {
    /*
      Če naloga nima serverId, pomeni, da še nikoli ni bila uspešno
      shranjena na strežnik. Zato jo lahko izbrišemo samo lokalno.
    */
    if (!task.serverId) {
      await window.studySyncDB.deleteTask(task.id);
      await renderTasks();
      return;
    }

    /*
      Če ima naloga serverId in smo povezani, jo poskusimo izbrisati
      s strežnika. Šele nato jo izbrišemo lokalno.
    */
    if (navigator.onLine) {
      await deleteTaskFromServer(task.serverId);
      await window.studySyncDB.deleteTask(task.id);
      await renderTasks();

      if (notificationStatus) {
        notificationStatus.textContent = "Naloga je bila izbrisana s strežnika.";
      }

      return;
    }

    /*
      Če ima naloga serverId, ampak nismo povezani, je ne izbrišemo
      iz IndexedDB. Označimo jo kot čakajočo za brisanje.
    */
    const updatedTask = {
      ...task,
      pendingDelete: true,
      deletedAt: new Date().toISOString()
    };

    await window.studySyncDB.updateTask(updatedTask);
    await registerBackgroundSync();
    await renderTasks();

    if (notificationStatus) {
      notificationStatus.textContent = "Naloga bo izbrisana s strežnika, ko bo povezava ponovno na voljo.";
    }
  } catch (error) {
    console.error("Napaka pri brisanju naloge:", error);

    /*
      Če je brisanje s strežnika spodletelo, naloge ne izbrišemo lokalno,
      ampak jo označimo za kasnejše brisanje.
    */
    const updatedTask = {
      ...task,
      pendingDelete: true,
      deletedAt: new Date().toISOString()
    };

    await window.studySyncDB.updateTask(updatedTask);
    await registerBackgroundSync();
    await renderTasks();

    if (notificationStatus) {
      notificationStatus.textContent = "Brisanje trenutno ni uspelo. Naloga čaka na sinhronizacijo brisanja.";
    }
  }
}

async function syncPendingDeletes() {
  try {
    console.log("Preverjam čakajoča brisanja ...");

    const pendingDeletes = await window.studySyncDB.getPendingDeleteTasks();

    console.log("Čakajoča brisanja:", pendingDeletes);

    if (pendingDeletes.length === 0) {
      return;
    }

    for (const task of pendingDeletes) {
      console.log("Brišem nalogo s strežnika:", task.serverId);

      if (task.serverId) {
        await deleteTaskFromServer(task.serverId);
      }

      console.log("Brišem nalogo lokalno:", task.id);
      await window.studySyncDB.deleteTask(task.id);
    }

    await renderTasks();

    if (notificationStatus) {
      notificationStatus.textContent = "Čakajoča brisanja so bila uspešno sinhronizirana.";
    }
  } catch (error) {
    console.error("Napaka pri sinhronizaciji brisanja:", error);

    if (notificationStatus) {
      notificationStatus.textContent = "Brisanje še čaka na sinhronizacijo.";
    }
  }
}

async function syncUnsyncedTasks() {
  try {
    const unsyncedTasks = (await window.studySyncDB.getUnsyncedTasks())
      .filter(task => task.pendingDelete !== true);

    for (const task of unsyncedTasks) {
      if (task.pendingUpdate === true && task.serverId) {
        const result = await updateTaskOnServer(task);

        const updatedTask = {
          ...task,
          synced: true,
          pendingUpdate: false,
          updatedAt: result.task.updatedAt
        };

        await window.studySyncDB.updateTask(updatedTask);
        continue;
      }

      if (!task.serverId) {
        const result = await sendTaskToServer(task);

        const updatedTask = {
          ...task,
          synced: true,
          serverId: result.task.serverId,
          syncedAt: result.task.syncedAt
        };

        await window.studySyncDB.updateTask(updatedTask);
      }
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


async function sendDueReminders() {
  try {
    const response = await fetch(`${API_BASE_URL}/push/due-reminders`, {
      method: "POST"
    });

    if (!response.ok) {
      throw new Error("Opomnikov ni bilo mogoče poslati.");
    }

    const data = await response.json();

    if (data.count === 0) {
      notificationStatus.textContent = "Trenutno ni nalog z rokom danes ali jutri.";
      return;
    }

    notificationStatus.textContent = `Poslanih opomnikov: ${data.count}.`;
  } catch (error) {
    console.error("Napaka pri pošiljanju opomnikov:", error);
    notificationStatus.textContent = "Opomnikov trenutno ni mogoče poslati.";
  }
}

enableNotificationsButton.addEventListener("click", enablePushNotifications);

dueRemindersButton.addEventListener("click", sendDueReminders);

cancelEditButton.addEventListener("click", cancelEditingTask);

function parseLocalDate(dateString) {
  if (!dateString) {
    return null;
  }

  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getStartOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isSameDay(dateA, dateB) {
  return dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate();
}

function getDaysUntil(date) {
  const today = getStartOfToday();
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const difference = target.getTime() - today.getTime();
  return Math.round(difference / (1000 * 60 * 60 * 24));
}

function setDashboardText(id, text) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = text;
  }
}

function renderDashboard(tasks) {
  const today = getStartOfToday();

  const activeTasks = tasks.filter(task => task.pendingDelete !== true);

  const tasksWithDueDate = activeTasks
    .filter(task => task.dueDate)
    .map(task => ({
      ...task,
      dueDateObject: parseLocalDate(task.dueDate)
    }))
    .filter(task => task.dueDateObject !== null);

  const upcomingTasks = tasksWithDueDate
    .filter(task => task.dueDateObject >= today)
    .sort((a, b) => a.dueDateObject - b.dueDateObject);

  const todayTasks = tasksWithDueDate.filter(task => {
    return isSameDay(task.dueDateObject, today);
  });

  const highPriorityTasks = activeTasks.filter(task => {
    return task.priority === "high";
  });

  const unsyncedTasks = activeTasks.filter(task => {
    return task.synced === false || task.pendingUpdate === true;
  });

  if (upcomingTasks.length > 0) {
    const nextTask = upcomingTasks[0];
    const daysUntil = getDaysUntil(nextTask.dueDateObject);

    let dayText = "Rok je danes";

    if (daysUntil === 1) {
      dayText = "Rok je jutri";
    } else if (daysUntil > 1) {
      dayText = `Rok čez ${daysUntil} dni`;
    }

    setDashboardText("next-task-title", nextTask.title);
    setDashboardText(
      "next-task-meta",
      `${nextTask.subject} · ${dayText} · ${formatDateOnly(nextTask.dueDate)}`
    );
  } else {
    setDashboardText("next-task-title", "Ni prihajajočih rokov");
    setDashboardText("next-task-meta", "Dodaj nalogo z rokom, da se prikaže tukaj.");
  }

  setDashboardText("today-task-count", todayTasks.length);

  if (todayTasks.length === 1) {
    setDashboardText("today-task-text", "Danes imaš 1 nalogo z rokom.");
  } else if (todayTasks.length > 1) {
    setDashboardText("today-task-text", `Danes imaš ${todayTasks.length} nalog z rokom.`);
  } else {
    setDashboardText("today-task-text", "Danes nimaš označenih rokov.");
  }

  setDashboardText("high-priority-count", highPriorityTasks.length);

  if (highPriorityTasks.length === 1) {
    setDashboardText("high-priority-text", "Imaš 1 nalogo z visoko prioriteto.");
  } else if (highPriorityTasks.length > 1) {
    setDashboardText("high-priority-text", `Imaš ${highPriorityTasks.length} nalog z visoko prioriteto.`);
  } else {
    setDashboardText("high-priority-text", "Trenutno ni nujnih nalog.");
  }

  setDashboardText("sync-count", unsyncedTasks.length);

  if (unsyncedTasks.length === 1) {
    setDashboardText("sync-text", "1 obveznost čaka na sinhronizacijo.");
  } else if (unsyncedTasks.length > 1) {
    setDashboardText("sync-text", `${unsyncedTasks.length} obveznosti čakajo na sinhronizacijo.`);
  } else {
    setDashboardText("sync-text", "Vse obveznosti so sinhronizirane.");
  }
}

async function renderTasks() {
  try {
    const allTasks = await window.studySyncDB.getAllTasks();
    const tasks = allTasks.filter(task => task.pendingDelete !== true);
    renderDashboard(tasks);

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

async function runSync() {
  await syncPendingDeletes();

  /*
    Najprej prenesemo naloge, ki obstajajo na strežniku,
    ampak jih lokalna IndexedDB še nima.
  */
  await pullServerTasksToLocalDB();

  /*
    Nato preverimo še obratno:
    ali kakšna lokalna naloga manjka na strežniku.
  */
  await repairMissingServerTasks();

  /*
    Na koncu sinhroniziramo nove ali urejene lokalne naloge.
  */
  await syncUnsyncedTasks();
}

window.addEventListener("online", async () => {
  updateConnectionStatus();
  await syncPendingDeletes();
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

  try {
    if (editingTaskId !== null) {
      const allTasks = await window.studySyncDB.getAllTasks();
      const existingTask = allTasks.find(task => task.id === editingTaskId);

      if (!existingTask) {
        throw new Error("Naloga za urejanje ni bila najdena.");
      }

      const updatedTask = {
        ...existingTask,
        title: validation.title,
        subject: validation.subject,
        dueDate: validation.dueDate,
        priority: validation.priority,
        updatedAt: new Date().toISOString(),
        synced: false,
        pendingUpdate: true
      };

      await window.studySyncDB.updateTask(updatedTask);

      if (updatedTask.serverId) {
        try {
          const result = await updateTaskOnServer(updatedTask);

          const syncedTask = {
            ...updatedTask,
            synced: true,
            pendingUpdate: false,
            updatedAt: result.task.updatedAt
          };

          await window.studySyncDB.updateTask(syncedTask);
        } catch (error) {
          console.error("Posodobitev na strežniku ni uspela, čaka na sinhronizacijo:", error);
          await registerBackgroundSync();
        }
      }

      cancelEditingTask();
      await renderTasks();
      await runSync();

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
runSync();

if (navigator.onLine) {
  syncPendingDeletes();
  syncUnsyncedTasks();
}
