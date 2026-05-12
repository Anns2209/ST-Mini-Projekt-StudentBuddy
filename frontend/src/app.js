const connectionStatus = document.getElementById("connection-status");
const taskForm = document.getElementById("task-form");
const taskList = document.getElementById("task-list");

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

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);

updateConnectionStatus();

taskForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const validation = validateTaskForm();

  if (!validation.isValid) {
    return;
  }

  const newTask = {
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