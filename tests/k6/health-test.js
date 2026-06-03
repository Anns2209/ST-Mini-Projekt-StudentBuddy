import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 1,
  iterations: 10,
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<200"]
  }
};

export default function () {
  const res = http.get("http://localhost:3000/api/health");

  check(res, {
    "GET /api/health vrne status 200": r => r.status === 200,
    "backend vrne status ok": r => r.json("status") === "ok"
  });

  sleep(0.5);
}