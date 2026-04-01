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
- frontend의 `/api/*` 요청은 nginx가 `giwon-home-api`로 프록시한다.
- 현재 compose는 sibling repo `../giwon-home-api`를 함께 띄우는 기준이다.

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
```

- 로컬 Vite 개발 서버에서는 `http://localhost:8081`을 그대로 쓴다.
- Docker 이미지 빌드에서는 `/api`로 대체되어 nginx 프록시를 탄다.

## Future Services
이 허브는 서비스 자체를 한 repo에 다 넣는 구조가 아니라, 독립 서비스들을 연결하는 공개 진입점으로 쓴다.

- 새 서비스는 독립 repo + 독립 Dockerfile로 만든다.
- `giwon-home-api`의 프로젝트 카탈로그에 `liveUrl`, `repositoryUrl`, `docsUrl`을 추가한다.
- 별도 도메인이나 URL이 있으면 `liveUrl`로 바로 연결한다.
- 허브 도메인 아래에 reverse proxy로 붙이고 싶으면 `nginx.conf`와 `docker-compose.yml`에 서비스만 추가한다.
- 자세한 패턴은 [docs/service-onboarding.md](./docs/service-onboarding.md)에 정리했다.

## Notes
- 공개 허브가 메인이고 로그인 기능은 보조 템플릿으로 남겨둔 상태다.
- `docker-compose.yml`은 sibling repo `../giwon-home-api`를 기준으로 전체 스택을 함께 띄운다.
- 이후 서비스가 늘어나도 허브는 링크/프록시 진입점 역할만 유지하는 게 기본 원칙이다.
