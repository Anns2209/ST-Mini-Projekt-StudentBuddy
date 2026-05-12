const express = require("express");
const cors = require("cors");
const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");

const app = express();
const PORT = 3000;

const TASKS_FILE = path.join(__dirname, "data", "tasks.json");

app.use(cors());
app.use(express.json());

async function readTasks() {
  try {
    const data = await fs.readFile(TASKS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeTasks(tasks) {
  await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "StudySync backend deluje."
  });
});

app.get("/api/tasks", async (req, res) => {
  const tasks = await readTasks();

  res.json({
    count: tasks.length,
    tasks
  });
});

app.post("/api/tasks", async (req, res) => {
  const { clientId, title, subject, dueDate, priority, createdAt } = req.body;

  if (!title || !subject || !dueDate || !priority) {
    return res.status(400).json({
      error: "Manjkajo obvezni podatki za nalogo."
    });
  }

  const tasks = await readTasks();
  if (clientId) {
    const existingTask = tasks.find(task => task.clientId === clientId);

    if (existingTask) {
        return res.status(200).json({
        message: "Naloga je že bila sinhronizirana.",
        task: existingTask
        });
    }
  }

  const newTask = {
    serverId: randomUUID(),
    clientId: clientId || randomUUID(),
    title,
    subject,
    dueDate,
    priority,
    createdAt: createdAt || new Date().toISOString(),
    syncedAt: new Date().toISOString()
  };

  tasks.push(newTask);

  await writeTasks(tasks);

  res.status(201).json({
    message: "Naloga je bila uspešno shranjena na strežnik.",
    task: newTask
  });
});

app.delete("/api/tasks/:serverId", async (req, res) => {
  const { serverId } = req.params;

  const tasks = await readTasks();
  const filteredTasks = tasks.filter(task => task.serverId !== serverId);

  await writeTasks(filteredTasks);

  res.json({
    message: "Naloga je bila izbrisana s strežnika."
  });
});

app.listen(PORT, () => {
  console.log(`StudySync backend teče na http://localhost:${PORT}`);
});