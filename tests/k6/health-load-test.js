import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 10 },
    { duration: "20s", target: 20 },
    { duration: "10s", target: 0 }
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<500"]
  }
};

export default function () {
  const res = http.get("http://localhost:3000/api/health");

  check(res, {
    "status je 200": r => r.status === 200
  });

  sleep(1);
}