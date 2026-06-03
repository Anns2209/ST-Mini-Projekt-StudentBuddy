import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 10,
  duration: "20s",
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<500"]
  }
};

export default function () {
  const res = http.get("http://localhost:3000/api/tasks");

  check(res, {
    "GET /api/tasks status 200": r => r.status === 200,
    "GET vrne seznam nalog": r => Array.isArray(r.json("tasks"))
  });

  sleep(1);
}