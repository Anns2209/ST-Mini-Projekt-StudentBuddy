import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 1,
  iterations: 5,
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"]
  }
};

export default function () {
  const clientId = `k6-${Date.now()}-${Math.random()}`;

  const payload = JSON.stringify({
    clientId,
    title: "k6 test naloga",
    subject: "Testiranje",
    dueDate: "2026-06-09",
    priority: "medium",
    createdAt: new Date().toISOString()
  });

  const params = {
    headers: {
      "Content-Type": "application/json"
    }
  };

  const postRes = http.post("http://localhost:3000/api/tasks", payload, params);

  check(postRes, {
    "POST /api/tasks status 201 ali 200": r => r.status === 201 || r.status === 200,
    "POST vrne task": r => r.json("task") !== undefined
  });

  const serverId = postRes.json("task.serverId");

  const getRes = http.get("http://localhost:3000/api/tasks");

  check(getRes, {
    "GET /api/tasks status 200": r => r.status === 200,
    "GET vrne seznam tasks": r => Array.isArray(r.json("tasks"))
  });

  if (serverId) {
    const updatePayload = JSON.stringify({
      title: "k6 posodobljena naloga",
      subject: "Testiranje API",
      dueDate: "2026-06-10",
      priority: "high"
    });

    const putRes = http.put(
      `http://localhost:3000/api/tasks/${serverId}`,
      updatePayload,
      params
    );

    check(putRes, {
      "PUT /api/tasks/:serverId status 200": r => r.status === 200,
      "PUT vrne posodobljeno task": r => r.json("task") !== undefined
    });

    const deleteRes = http.del(`http://localhost:3000/api/tasks/${serverId}`);

    check(deleteRes, {
      "DELETE /api/tasks/:serverId status 200": r => r.status === 200
    });
  }

  sleep(1);
}