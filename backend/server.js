const express = require("express");
const cors = require("cors");
const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");
const webpush = require("web-push");

const app = express();
const PORT = 3000;

const TASKS_FILE = path.join(__dirname, "data", "tasks.json");

const SUBSCRIPTIONS_FILE = path.join(__dirname, "data", "subscriptions.json");

const VAPID_PUBLIC_KEY = "BEwpwHZXzHSRCsiMA36iBfAvMMKUdOjcP9ABr9koOInh8v4Cu_xpORB2lS835E5RH7zOIn1uGciC3NpO3gnbwwQ";
const VAPID_PRIVATE_KEY = "d0AHHStR0Z_oatq74Is7uWgOyLdbLJoRRf2yEcN70R0";

webpush.setVapidDetails(
  "mailto:ana.gjorceska@gmail.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);
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

async function readSubscriptions() {
  try {
    const data = await fs.readFile(SUBSCRIPTIONS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeSubscriptions(subscriptions) {
  await fs.writeFile(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));
}

async function sendPushNotificationToAll(payload) {
  const subscriptions = await readSubscriptions();

  const results = [];

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));

      results.push({
        endpoint: subscription.endpoint,
        success: true
      });
    } catch (error) {
      results.push({
        endpoint: subscription.endpoint,
        success: false,
        error: error.message
      });
    }
  }

  return results;
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

  await sendPushNotificationToAll({
    title: "Naloga sinhronizirana",
    body: `Naloga "${newTask.title}" je bila uspešno shranjena na strežnik.`,
    url: "/"
  });

  res.status(201).json({
    message: "Naloga je bila uspešno shranjena na strežnik.",
    task: newTask
  });
});

app.put("/api/tasks/:serverId", async (req, res) => {
  const { serverId } = req.params;
  const { title, subject, dueDate, priority } = req.body;

  if (!title || !subject || !dueDate || !priority) {
    return res.status(400).json({
      error: "Manjkajo obvezni podatki za posodobitev naloge."
    });
  }

  const tasks = await readTasks();

  const taskIndex = tasks.findIndex(task => task.serverId === serverId);

  if (taskIndex === -1) {
    return res.status(404).json({
      error: "Naloga ni bila najdena."
    });
  }

  tasks[taskIndex] = {
    ...tasks[taskIndex],
    title,
    subject,
    dueDate,
    priority,
    updatedAt: new Date().toISOString()
  };

  await writeTasks(tasks);

  res.json({
    message: "Naloga je bila uspešno posodobljena.",
    task: tasks[taskIndex]
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

app.get("/api/push/public-key", (req, res) => {
  res.json({
    publicKey: VAPID_PUBLIC_KEY
  });
});

app.post("/api/push/subscribe", async (req, res) => {
  const subscription = req.body;

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({
      error: "Neveljavna naročnina za obvestila."
    });
  }

  const subscriptions = await readSubscriptions();

  const alreadyExists = subscriptions.some(item => {
    return item.endpoint === subscription.endpoint;
  });

  if (!alreadyExists) {
    subscriptions.push(subscription);
    await writeSubscriptions(subscriptions);
  }

  res.status(201).json({
    message: "Naročnina za obvestila je shranjena."
  });
});

app.post("/api/push/test", async (req, res) => {
  const subscriptions = await readSubscriptions();

  const payload = JSON.stringify({
    title: "StudySync",
    body: "Testno potisno obvestilo deluje.",
    url: "/"
  });

  const results = [];

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(subscription, payload);

      results.push({
        endpoint: subscription.endpoint,
        success: true
      });
    } catch (error) {
      results.push({
        endpoint: subscription.endpoint,
        success: false,
        error: error.message
      });
    }
  }

  res.json({
    message: "Testno obvestilo je bilo poslano.",
    sentTo: subscriptions.length,
    results
  });
});

app.post("/api/push/due-reminders", async (req, res) => {
  const tasks = await readTasks();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const importantTasks = tasks.filter(task => {
    if (!task.dueDate) {
      return false;
    }

    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    return dueDate.getTime() === today.getTime() ||
           dueDate.getTime() === tomorrow.getTime();
  });

  if (importantTasks.length === 0) {
    return res.json({
      message: "Ni nalog z rokom danes ali jutri.",
      count: 0
    });
  }

  for (const task of importantTasks) {
    await sendPushNotificationToAll({
      title: "Opomnik za nalogo",
      body: `Naloga "${task.title}" ima rok danes ali jutri.`,
      url: "/"
    });
  }

  res.json({
    message: "Opomniki za bližnje roke so bili poslani.",
    count: importantTasks.length,
    tasks: importantTasks
  });
});

app.listen(PORT, () => {
  console.log(`StudySync backend teče na http://localhost:${PORT}`);
});