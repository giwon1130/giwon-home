# giwon-home Deployment Playbook

`giwon-home` 스택을 로컬이나 소형 서버에서 운영할 때 쓰는 배포 기준 문서다.

## 구성
- `giwon-home`
  - 공개 허브 프론트, nginx reverse proxy 포함
- `giwon-home-api`
  - 프로필/프로젝트 카탈로그 API
- `giwon-assistant-api`
  - AI 비서 API

## 사전 확인
1. `giwon-home-api` 테스트 통과
2. `giwon-home` 빌드 통과
3. `.env`의 `PUBLIC_URL_*` 값 확인

예시:
```bash
PUBLIC_URL_HOME=https://home.example.com
PUBLIC_URL_ASSISTANT=https://home.example.com/assistant
PUBLIC_URL_HOME_HARMONY=https://home-harmony.example.com
PUBLIC_URL_ROUTE_OPS=https://route.example.com
PUBLIC_URL_METRO_PULSE=https://metro.example.com
PUBLIC_URL_SHELTER_NOW=https://shelter.example.com
PUBLIC_URL_EMERGENCY_ROOM=https://er.example.com
PUBLIC_URL_SIGNAL_DESK=https://signal.example.com
```

## 실행
```bash
cd /Users/g/workspace/public/platform/giwon-home
docker compose up --build -d
```

## 현재 compose 기준
- `restart: unless-stopped`
- `giwon-home-api`, `giwon-assistant-api` healthcheck 포함
- `giwon-home`은 두 API가 `healthy`가 된 뒤 기동
- 허브 카드 `liveUrl`은 `PUBLIC_URL_*` 환경변수에서 읽음
- `MetroPulse`, `ShelterNow`, `Emergency Room`, `RouteOps`, `HomeHarmony`, `SignalDesk`도 허브에서 env로 주소를 분리한다

## 공개 배포 전략
- 메인 공개 주소는 `giwon-home`으로 유지
- 서비스별 공개는 가능하면 서브도메인 기준으로 분리
  - `home.<domain>`
  - `signal.<domain>`
  - `route.<domain>`
  - `metro.<domain>`
  - `shelter.<domain>`
  - `er.<domain>`
  - `home-harmony.<domain>`
- path 기반 공개도 가능하지만, SPA base path와 프록시 설정이 더 복잡해지므로 1차는 서브도메인 방식이 더 단순하다
- API 컨테이너, DB, Redis는 직접 외부 노출하지 않고 reverse proxy 또는 내부 네트워크 뒤에 둔다
- 실제 reverse proxy 예시는 [docs/caddy/Caddyfile.example](./caddy/Caddyfile.example)에 둔다
- 실제 서버 절차는 [docs/server-runbook.md](./server-runbook.md) 기준으로 맞춘다

## 검증
```bash
curl -i http://127.0.0.1:4173/
curl -i http://127.0.0.1:8081/api/projects
curl -i http://127.0.0.1:8080/api/v1/briefings/today
```

## 주의
- 현재는 GitHub Actions 자동 배포가 아니라 수동 compose 재기동 기준이다.
- 외부 공개 시 `localhost`, `127.0.0.1` 링크가 남지 않도록 `.env`를 먼저 바꿔야 한다.
- 다른 서비스와 포트 충돌이 있으면 직접 포트를 열지 말고 reverse proxy 뒤로 붙이는 방향을 우선한다.
- 실제 공개 전에는 `/api/projects` 응답의 `liveUrl`이 도메인 기준으로 바뀌었는지 먼저 확인한다.
