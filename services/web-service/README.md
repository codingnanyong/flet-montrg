# Felt Montrg API Documentation (Web UI)

통합 Swagger UI 웹 클라이언트. Svelte + Vite + Tailwind로 구성됩니다.  
백엔드는 `integrated-swagger-service`(프록시/API)를 사용합니다.

## 스택

- **Svelte 4** – UI 프레임워크
- **Vite 5** – 빌드 도구
- **Tailwind CSS (CDN)** – 스타일
- **Swagger UI** – API 문서 표시

## npm 스크립트

```bash
# 의존성 설치 (최초 1회)
npm install

# 개발 서버 (핫 리로드)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 설정

- **API_BASE**: `?apiBase=URL` 쿼리로 지정. 미지정 시 `window.location.origin` 사용.
- **테마**: localStorage `felt-montrg-theme` (light | dark)

## 로컬 개발

```bash
# nvm 사용 시 (터미널에서 npm을 못 찾을 때)
source ~/.zshrc
# 또는
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 개발 서버 실행 (기본 http://localhost:5173)
npm run dev
```

브라우저: `http://localhost:5173`  
API가 다른 호스트/포트일 경우: `http://localhost:5173?apiBase=http://localhost:30005`

## 배포

```bash
npm run build
```

`dist/` 폴더를 nginx, Apache, S3+CloudFront 등 정적 호스팅에 배포합니다.  
Docker/K8s: `Dockerfile` 및 `k8s/web-service/` 매니페스트 사용.
