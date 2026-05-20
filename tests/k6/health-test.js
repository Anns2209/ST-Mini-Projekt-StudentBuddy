import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 5,
  duration: "10s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<200"]
  }
};

export default function () {
  const res = http.get("http://localhost:3000/api/health");

  check(res, {
    "status je 200": r => r.status === 200,
    "backend vrne status ok": r => r.json("status") === "ok"
  });

  sleep(1);
}