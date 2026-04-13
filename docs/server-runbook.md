# giwon-home Server Runbook

실제 서버에서 `giwon-home`과 공개 서비스들을 올릴 때 쓰는 최소 운영 절차다.

## 1. DNS 준비
- `home.giwon.dev`
- `signal.giwon.dev`
- `route.giwon.dev`
- `metro.giwon.dev`
- `shelter.giwon.dev`
- `er.giwon.dev`
- `harmony.giwon.dev`

모든 도메인은 같은 서버 IP로 먼저 연결한다.

## 2. 서버 기본 준비
```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
```

## 3. Caddy 설치
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

## 4. Caddy 설정 반영
```bash
sudo cp /path/to/giwon-home/docs/caddy/Caddyfile.example /etc/caddy/Caddyfile
sudo systemctl restart caddy
sudo systemctl status caddy
```

## 5. 허브 환경변수 준비
`/Users/g/workspace/public/platform/giwon-home/.env`

```bash
PUBLIC_URL_HOME=https://home.giwon.dev
PUBLIC_URL_ASSISTANT=https://home.giwon.dev/assistant
PUBLIC_URL_HOME_HARMONY=https://harmony.giwon.dev
PUBLIC_URL_ROUTE_OPS=https://route.giwon.dev
PUBLIC_URL_METRO_PULSE=https://metro.giwon.dev
PUBLIC_URL_SHELTER_NOW=https://shelter.giwon.dev
PUBLIC_URL_EMERGENCY_ROOM=https://er.giwon.dev
PUBLIC_URL_SIGNAL_DESK=https://signal.giwon.dev
```

이 값이 `giwon-home-api`의 프로젝트 카드 링크로 그대로 들어간다.

## 6. 허브 스택 기동
```bash
cd /Users/g/workspace/public/platform/giwon-home
docker compose up --build -d
docker compose ps
```

## 7. 서비스별 기동
공개 서비스는 각 레포 기준으로 별도 기동한다.

- `signal-desk`
- `route-ops`
- `metro-pulse`
- `shelter-now`
- `emergency-room`
- `HomeHarmony`

각 서비스는 로컬 포트로만 열고, 외부 공개는 Caddy가 담당한다.

## 8. 1차 검증
```bash
curl -I http://127.0.0.1:4173/
curl -s http://127.0.0.1:8081/api/projects
curl -s http://127.0.0.1:8080/api/v1/briefings/today
curl -I https://home.giwon.dev
```

## 9. 확인 포인트
- `docker compose ps`에서 `giwon-home-api`, `giwon-assistant-api`가 `healthy`
- `home.giwon.dev` 접속 가능
- 허브 카드의 `Live` 링크가 더 이상 `localhost`가 아님
- 외부에서 API 포트 `8080`, `8081` 직접 노출하지 않음

## 10. 장애 시 기본 확인
```bash
docker compose logs giwon-home-api
docker compose logs giwon-assistant-api
docker compose logs giwon-home
sudo journalctl -u caddy -n 200
```

## 11. 재배포
```bash
git pull --rebase
docker compose up --build -d
docker compose ps
```

## 12. 롤백 감각
- 문제가 허브 UI만이면 `giwon-home`만 재빌드
- 링크/카탈로그 문제면 `giwon-home-api` 설정과 `.env`부터 확인
- 도메인/인증서 문제면 Caddy 로그부터 확인
