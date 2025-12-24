# 🔐 API 키 암호화 완료!

## ✅ 수행된 작업

1. **AES-256-GCM 암호화 시스템** 구축
2. **암호화 유틸리티** 생성: `src/utils/encryption.ts`
3. **암호화 스크립트** 생성: `encrypt-env.js`
4. **Supabase 통합** 업데이트: 자동 복호화 기능 추가
5. **보안 가이드** 작성: `SECURITY_GUIDE.md`

---

## 🚀 지금 해야 할 일 (중요!)

### 1️⃣ 새로운 Supabase 키 발급 (필수!)

**현재 API 키가 이미 노출되었으므로 반드시 새로운 키를 발급받으세요!**

1. https://app.supabase.com 접속
2. 프로젝트 선택 → Settings → API
3. **기존 Anon Key 삭제**
4. 새로운 Key 생성

### 2️⃣ 암호화 키 생성 및 API 키 암호화

터미널에서 다음 명령 실행:

```bash
cd frontend

# 새로운 Supabase URL 암호화
node encrypt-env.js VITE_SUPABASE_URL "https://your-project.supabase.co"
```

출력:
```
✅ 암호화 완료!
1️⃣  이 암호화 키를 환경 변수로 설정하세요:
   export ENCRYPTION_KEY=a1b2c3d4...
2️⃣  .env.local 파일에 다음을 추가하세요:
   VITE_SUPABASE_URL="iv:authtag:encrypted..."
```

**암호화 키 (ENCRYPTION_KEY)를 기록해두세요!** ⚠️

### 3️⃣ 환경 변수 설정

#### PowerShell (임시):
```powershell
$env:ENCRYPTION_KEY = "a1b2c3d4e5f6..."
npm run dev
```

#### 영구 설정 (권장):
Windows 환경 변수에 추가
1. `Win + X` → 시스템
2. `고급 시스템 설정 → 환경 변수`
3. 새로 만들기
   - 변수명: `ENCRYPTION_KEY`
   - 값: `a1b2c3d4e5f6...` (위에서 받은 값)
4. PC 재시작

#### .env.local 파일 (개발용):
```
ENCRYPTION_KEY=a1b2c3d4e5f6...
VITE_SUPABASE_URL="020cc7d8549e2a7e847802e2d9623616:f65ffee91211433f5972cb04c95a2e29:66ae3b669715b9aafb8d07ddc77fc9ce6312b1989118f371cf25229f58608e58d5b79e14c1a18647"
VITE_SUPABASE_ANON_KEY="[위에서 받은 암호화된 값]"
```

### 4️⃣ 새로운 Anon Key 암호화

다시 터미널에서:

```bash
node encrypt-env.js VITE_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

출력된 암호화된 값을 `.env.local`의 `VITE_SUPABASE_ANON_KEY`에 저장

### 5️⃣ 동작 확인

```bash
npm run dev
```

브라우저에서 정상 작동하는지 확인

---

## 📂 생성된 파일 목록

| 파일 | 설명 |
|------|------|
| `src/utils/encryption.ts` | AES-256-GCM 암호화/복호화 함수 |
| `encrypt-env.js` | API 키 암호화 스크립트 |
| `SECURITY_GUIDE.md` | 상세한 보안 가이드 |
| `.env.example` | 환경 변수 템플릿 |

---

## 🔒 보안 체크리스트

```
[ ] Supabase에서 기존 API 키 삭제됨
[ ] 새로운 API 키 발급받음
[ ] 암호화 스크립트로 새로운 키들 암호화
[ ] ENCRYPTION_KEY를 Windows 환경 변수에 설정
[ ] .env.local에 암호화된 값 저장
[ ] npm run dev 실행 → 정상 작동 확인
[ ] Git 커밋 전에 .env.local은 .gitignore 확인
```

---

## 🆘 문제 발생 시

### 에러: "복호화 실패"
→ `ENCRYPTION_KEY` 값이 정확한지 확인
→ 개발 서버 재시작

### 에러: "Supabase 연결 불가"
→ 새로운 API 키가 올바르게 암호화되었는지 확인
→ Supabase 대시보드에서 CORS 설정 확인

### npm run dev 후 홈페이지가 로드 안 됨
→ 브라우저 개발자 도구 (F12) → Console 확인
→ 에러 메시지 확인

---

## 📝 암호화 방식 요약

- **알고리즘**: AES-256-GCM
- **키 크기**: 256비트 (32바이트)
- **인증**: AEAD (Authenticated Encryption with Associated Data)
- **형식**: `IV:AuthTag:EncryptedData`

---

## 🌍 프로덕션 배포

### Vercel / Netlify 설정
1. 대시보드 → Environment Variables
2. `ENCRYPTION_KEY` 추가
3. 암호화된 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 추가
4. 배포

---

**더 궁금한 점은 `SECURITY_GUIDE.md` 참고**
