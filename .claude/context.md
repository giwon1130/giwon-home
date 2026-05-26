# Context

## purpose
- 여러 개인 프로젝트를 한 곳에서 보여주는 홈 서비스
- About/프로젝트 리스트/AI 비서 링크 허브

## backend deps
- profile/projects: `giwon-home-api`
- assistant endpoints: `giwon-assistant-api`
- default frontend API base: `VITE_API_BASE_URL` or `/api` (`src/api/client.ts`)
- default assistant API base: `VITE_ASSISTANT_API_BASE_URL` or `http://localhost:8080`

## key files
- `src/api/client.ts`: API base URL wiring
- `src/api/projectApi.ts`, `src/api/profileApi.ts`: home/profile/project data
- `src/api/assistantApi.ts`: assistant integration endpoints
- `src/pages/AssistantPage.tsx`: assistant dashboard surface

## local compose
- frontend + backend + assistant 동시 실행 구조 사용

## verify
- `pnpm build`
- `pnpm test`
