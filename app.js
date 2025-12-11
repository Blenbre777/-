const path = require('path');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 1000 * 60 * 30; // 30분

// 기본 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
  })
);

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// 로그인/로그 기록 헬퍼
const logLogin = async ({ userId, result, reason = null, ipAddr = null }) => {
  try {
    await db.query(
      'INSERT INTO TB_LOGIN_LOG (USER_ID, LOGIN_RESULT, IP_ADDR, REASON) VALUES (?, ?, ?, ?)',
      [userId, result, ipAddr, reason]
    );
  } catch (err) {
    console.error('로그인 이력 기록 실패:', err);
  }
};

// 회원가입
app.post('/signup', async (req, res) => {
  const { userId, userName, password, email, phone } = req.body;
  if (!userId || !userName || !password) {
    return res.status(400).json({ message: '필수 항목(userId, userName, password)을 입력하세요.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userUuid = crypto.randomUUID();

    await db.query(
      `INSERT INTO TB_USER (
        USER_ID, USER_UUID, USER_NM, PASSWORD_HASH, PASSWORD_SALT,
        PHONE_NO, EMAIL, ROLE_CD, STATUS, LOGIN_FAIL_CNT, CREATED_BY, UPDATED_BY
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        userUuid,
        userName,
        passwordHash,
        null,
        phone || null,
        email || null,
        'USER',
        'A',
        0,
        userId,
        userId,
      ]
    );

    return res.status(201).json({ message: '회원가입 완료' });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: '이미 존재하는 사용자입니다.' });
    }
    console.error(err);
    return res.status(500).json({ message: '회원가입 중 오류가 발생했습니다.' });
  }
});

// 로그인
app.post('/login', async (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ message: '아이디와 비밀번호를 입력하세요.' });
  }

  try {
    const [rows] = await db.query(
      `SELECT USER_ID, PASSWORD_HASH, STATUS, LOGIN_FAIL_CNT
       FROM TB_USER WHERE USER_ID = ? LIMIT 1`,
      [userId]
    );

    const user = rows && rows[0];
    const clientIp = req.ip;

    if (!user) {
      await logLogin({ userId, result: 'F', reason: 'NOT_FOUND', ipAddr: clientIp });
      return res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    if (user.STATUS === 'I') {
      await logLogin({ userId, result: 'F', reason: 'INACTIVE', ipAddr: clientIp });
      return res.status(403).json({ message: '비활성화된 계정입니다.' });
    }
    if (user.STATUS === 'L') {
      await logLogin({ userId, result: 'F', reason: 'LOCKED', ipAddr: clientIp });
      return res.status(403).json({ message: '잠긴 계정입니다.' });
    }

    const match = await bcrypt.compare(password, user.PASSWORD_HASH);
    if (!match) {
      await logLogin({ userId, result: 'F', reason: 'WRONG_PASSWORD', ipAddr: clientIp });
      return res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    req.session.userId = user.USER_ID;
    await logLogin({ userId: user.USER_ID, result: 'S', ipAddr: clientIp });
    return res.json({ message: '로그인 성공' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: '서버 오류' });
  }
});

// 로그아웃 라우트
app.post('/logout', (req, res) => {
  if (!req.session) {
    return res.status(200).json({ message: '이미 로그아웃된 상태입니다.' });
  }

  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: '로그아웃 중 오류가 발생했습니다.' });
    }
    res.clearCookie('connect.sid');
    return res.json({ message: '로그아웃 완료' });
  });
});

// 비밀번호 찾기(더미 응답) - 실제 로직 구현 시 토큰 발급/메일 전송으로 대체
app.post('/password-reset', async (req, res) => {
  const { userId, email } = req.body;
  if (!userId || !email) {
    return res.status(400).json({ message: '아이디와 이메일을 입력하세요.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT USER_ID, EMAIL FROM TB_USER WHERE USER_ID = ? LIMIT 1',
      [userId]
    );
    const user = rows && rows[0];
    if (!user || (user.EMAIL && user.EMAIL !== email)) {
      return res.status(400).json({ message: '일치하는 사용자를 찾을 수 없습니다.' });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await db.query(
      `INSERT INTO TB_PWD_RESET (TOKEN, USER_ID, EXPIRES_AT, USED)
       VALUES (?, ?, ?, 0)`,
      [token, user.USER_ID, expiresAt]
    );

    // 실제 서비스에서는 이메일 전송 로직을 넣어야 합니다.
    // 여기서는 콘솔에 토큰을 출력합니다.
    console.log(`[PWD-RESET] user=${user.USER_ID} token=${token}`);

    return res.json({
      message: '재설정 안내를 전송했습니다.',
      // 테스트용으로 토큰을 응답에 포함 (실서비스에서는 제거)
      token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: '비밀번호 재설정 처리 중 오류가 발생했습니다.' });
  }
});

// 비밀번호 재설정 확정
app.post('/password-reset/confirm', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ message: '토큰과 새 비밀번호를 입력하세요.' });
  }

  try {
    const [rows] = await db.query(
      `SELECT TOKEN, USER_ID, EXPIRES_AT, USED
       FROM TB_PWD_RESET WHERE TOKEN = ? LIMIT 1`,
      [token]
    );
    const record = rows && rows[0];
    if (!record) {
      return res.status(400).json({ message: '유효하지 않은 토큰입니다.' });
    }
    if (record.USED) {
      return res.status(400).json({ message: '이미 사용된 토큰입니다.' });
    }
    if (new Date(record.EXPIRES_AT).getTime() < Date.now()) {
      return res.status(400).json({ message: '만료된 토큰입니다.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await db.query(
      `UPDATE TB_USER
       SET PASSWORD_HASH = ?, PASSWORD_CHANGED_DT = NOW()
       WHERE USER_ID = ?`,
      [passwordHash, record.USER_ID]
    );

    await db.query(`UPDATE TB_PWD_RESET SET USED = 1 WHERE TOKEN = ?`, [token]);

    return res.json({ message: '비밀번호가 변경되었습니다. 새 비밀번호로 로그인하세요.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: '비밀번호 재설정 처리 중 오류가 발생했습니다.' });
  }
});

// 간단한 인증 확인 라우트 (사용자 이름 포함)
app.get('/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT USER_ID, USER_NM FROM TB_USER WHERE USER_ID = ? LIMIT 1',
      [req.session.userId]
    );
    const user = rows && rows[0];
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    return res.json({ userId: user.USER_ID, userName: user.USER_NM });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: '서버 오류' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

