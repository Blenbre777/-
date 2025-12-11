## 📁 Project Structure

```text
login-project/
│
├── app.js
├── package.json
├── package-lock.json
│
├── config/
│   └── db.js
│
├── db/
│   ├── users.sql
│   ├── login_log.sql
│   └── password_reset.sql
│
├── public/
│   ├── css/
│   │   └── style.css
│   ├── html/
│   │   ├── index.html
│   │   ├── login.html
│   │   ├── signup.html
│   │   ├── logout.html
│   │   └── forgot-password.html
│   ├── js/
│   │   ├── index.js
│   │   ├── login.js
│   │   ├── signup.js
│   │   ├── logout.js
│   │   └── forgot-password.js
│   └── img/
```
# 🚀 기술 스택(Tech Stack)

프로젝트에서 사용한 전체 기술 스택과 기능 구성입니다.

# 🖥️ Backend (Server)

Node.js + Express — REST 기반 서버 구성

express-session — 메모리 기반 세션 인증

bcrypt — 보안 비밀번호 해싱

crypto(UUID) — 토큰/고유 키 생성

mysql2/promise — 비동기 기반 MySQL 쿼리 실행

nodemon — 개발 환경 자동 리로드

# 🗄️ Database (MySQL)

MySQL 스키마 구성

```TEXT
db/
├─ users.sql              # 회원 정보 테이블
├─ login_log.sql          # 로그인 이력 기록 테이블
└─ password_reset.sql     # 비밀번호 재설정 토큰 테이블
```

# 🎨 Frontend

HTML5

Bootstrap 5

Custom CSS (public/css/style.css)

Vanilla JavaScript (fetch 기반 비동기 통신)
→ 로그인/회원가입/로그아웃/비밀번호 재설정 UI 처리


# 🔐 Authentication & Features

세션 기반 인증 (Session-based Auth)

회원가입 / 로그인 / 로그아웃 기능

로그인 이력 기록 (IP / Timestamp 저장)

비밀번호 재설정 토큰 발급 및 검증

이메일 실제 발송은 미구현 상태

토큰은 콘솔 출력 또는 API 응답으로 확인 가능


# ⚙️ Scripts (npm)
npm start       # 서버 실행
npm run dev     # nodemon 기반 개발 서버 실행


# 📦 Dependencies
```
"dependencies": {
  "express": "...",
  "express-session": "...",
  "bcrypt": "...",
  "crypto": "...",
  "mysql2": "..."
},
"devDependencies": {
  "nodemon": "..."
}
```



