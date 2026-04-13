# giwon-home

공개용 프로젝트 허브, 자기소개 페이지, 그리고 여러 독립 서비스를 연결하는 웹 진입점이다.

## Stack
- React 18
- TypeScript 5
- Vite 7
- Vitest + Testing Library

## What Included
- 공개 홈 화면
- About 페이지
- AI 비서 대시보드 페이지
- 백엔드 `profile/projects` API 연동
- 프로젝트 카드별 `Live / Repository / Docs` 링크 노출
- 대표 서비스의 최신 상태를 허브 카드에 반영해 탐색 흐름 유지
- 주요 공개 프로젝트의 배포 최소 기준 정리 완료
  - `signal-desk`: web/api compose + healthcheck
  - `route-ops`: web/api compose + healthcheck
  - `metro-pulse`: backend/frontend Docker 이미지
  - `shelter-now`: backend/frontend Docker 이미지
  - `emergency-room`: backend compose + frontend Docker 이미지
  - `TripMemo`, `HomeHarmony`: Docker 실행 기준 보강
- 기존 로그인 페이지는 내부 실험용으로 유지

## Quick Start
```bash
cp .env.example .env
pnpm install
pnpm dev
```

App default: `http://localhost:5173`

## Docker
허브와 API를 같이 띄우려면:

```bash
docker compose up --build
```

- frontend: `http://localhost:4173`
- backend: `http://localhost:8081`
- assistant api: `http://localhost:8080`
- frontend의 `/api/*` 요청은 nginx가 `giwon-home-api`로 프록시한다.
- frontend의 `/assistant-api/*` 요청은 nginx가 `giwon-assistant-api`로 프록시한다.
- 현재 compose는 sibling repo `../giwon-home-api`, `../giwon-assistant-api`를 함께 띄우는 기준이다.
- `restart: unless-stopped`와 healthcheck를 포함해 로컬/소형 서버 운영 기준으로 보강했다.
- 공개 배포 시에는 `.env`에서 `PUBLIC_URL_*` 값을 실제 도메인으로 바꿔 허브 카드 링크를 맞춘다.
- 자세한 절차는 [docs/deployment-playbook.md](./docs/deployment-playbook.md)에 정리했다.

## Deployment Baseline
현재 허브에서 연결하는 주요 공개 프로젝트는 아래 기준까지 정리된 상태다.

- compose 기반 통합 실행
  - `giwon-home`
  - `signal-desk`
  - `route-ops`
  - `emergency-room-backend`
- Docker 이미지 실행 기준
  - `metro-pulse-backend`
  - `metro-pulse-frontend`
  - `shelter-now-backend`
  - `shelter-now-frontend`
  - `TripMemo`
  - `HomeHarmony`
- 남은 과제
  - 외부 도메인/리버스 프록시 표준화
  - GitHub Actions 기반 자동 배포
  - 허브 프로젝트 카드의 공개 URL 일괄 실도메인 치환

## Required Backend
- Start backend API first: `http://localhost:8081`
- Frontend uses `VITE_API_BASE_URL` from `.env`

## Commands
```bash
pnpm dev
pnpm test
pnpm build
pnpm preview
```

## Project Structure
```
src
├── App.tsx
├── auth/
├── api/
├── main.tsx
├── styles.css
├── components/
├── pages/
└── types/
```

## Routes
- `/`: public home hub
- `/about`: public about page
- `/assistant`: AI 비서 대시보드
- `/login`: login form

## Environment
`.env.example`
```bash
VITE_APP_NAME=giwon-home
VITE_API_BASE_URL=http://localhost:8081
VITE_ASSISTANT_API_BASE_URL=http://localhost:8080
PUBLIC_URL_HOME=http://localhost:4173
PUBLIC_URL_ASSISTANT=http://localhost:4173/assistant
PUBLIC_URL_HOME_HARMONY=http://127.0.0.1:4179
PUBLIC_URL_ROUTE_OPS=http://localhost:4174
PUBLIC_URL_METRO_PULSE=http://localhost:4175
PUBLIC_URL_SHELTER_NOW=http://localhost:4177
PUBLIC_URL_EMERGENCY_ROOM=http://localhost:4178
PUBLIC_URL_SIGNAL_DESK=http://localhost:4180
```

- 로컬 Vite 개발 서버에서는 `http://localhost:8081`을 그대로 쓴다.
- 로컬 Vite 개발 서버에서는 `http://localhost:8080`도 함께 쓴다.
- Docker 이미지 빌드에서는 `/api`, `/assistant-api`로 대체되어 nginx 프록시를 탄다.
- 홈 프로젝트 카탈로그의 `liveUrl`은 `PUBLIC_URL_*` 환경변수에서 읽는다.

## Future Services
이 허브는 서비스 자체를 한 repo에 다 넣는 구조가 아니라, 독립 서비스들을 연결하는 공개 진입점으로 쓴다.

- 새 서비스는 독립 repo + 독립 Dockerfile로 만든다.
- `giwon-home-api`의 프로젝트 카탈로그에 `liveUrl`, `repositoryUrl`, `docsUrl`을 추가한다.
- 별도 도메인이나 URL이 있으면 `liveUrl`로 바로 연결한다.
- 허브 도메인 아래에 reverse proxy로 붙이고 싶으면 `nginx.conf`와 `docker-compose.yml`에 서비스만 추가한다.
- 프론트에서 별도 API를 직접 호출할 일이 있으면 `VITE_*_API_BASE_URL`로 분리한다.
- 자세한 패턴은 [docs/service-onboarding.md](./docs/service-onboarding.md)에 정리했다.

## Notes
- 공개 허브가 메인이고 로그인 기능은 보조 템플릿으로 남겨둔 상태다.
- `docker-compose.yml`은 sibling repo `../giwon-home-api`, `../giwon-assistant-api`를 기준으로 전체 스택을 함께 띄운다.
- 이후 서비스가 늘어나도 허브는 링크/프록시 진입점 역할만 유지하는 게 기본 원칙이다.
- 예시로 `SignalDesk`처럼 웹/API/모바일이 분리된 서비스도 허브 카드 한 장으로 연결한다.
