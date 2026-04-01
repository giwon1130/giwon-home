# giwon-home

공개용 프로젝트 허브와 자기소개 페이지를 위한 React + Vite + TypeScript 프론트엔드입니다.

## Stack
- React 18
- TypeScript 5
- Vite 7
- Vitest + Testing Library

## What Included
- 공개 홈 화면
- About 페이지
- 백엔드 `profile/projects` API 연동
- 기존 로그인 페이지는 템플릿 용도로 유지

## Quick Start
```bash
cp .env.example .env
pnpm install
pnpm dev
```

App default: `http://localhost:5173`

## Required Backend
- Start backend template first: `http://localhost:8081`
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
- `/login`: login form

## Environment
`.env.example`
```bash
VITE_APP_NAME=home-frontend-template
VITE_API_BASE_URL=http://localhost:8081
```

## Notes
- 공개 허브가 메인이고 로그인 기능은 보조 템플릿으로 남겨둔 상태다.
