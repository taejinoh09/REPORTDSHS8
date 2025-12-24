# 🔐 API 키 암호화 가이드

## ⚠️ 현재 상황
- **Supabase API 키가 이미 노출되었습니다**
- `.env.local` 파일에 평문으로 저장된 상태

## 📋 해야 할 일

### 1단계: Supabase 키 재발급
1. [Supabase 대시보드](https://app.supabase.com) 접속
2. 프로젝트 선택 → `Settings` → `API`
3. **기존 Anon Key를 삭제**하고 새로운 키 발급받기
4. Supabase URL 확인

### 2단계: 암호화 키 생성 및 API 키 암호화
```bash
# 터미널에서 실행
cd frontend

# 새로운 Supabase URL 암호화
node encrypt-env.js VITE_SUPABASE_URL "https://your-project.supabase.co"

# 새로운 Anon Key 암호화  
node encrypt-env.js VITE_SUPABASE_ANON_KEY "eyJhbGciOi..."
```

**출력 예시:**
```
✅ 암호화 완료!

1️⃣  이 암호화 키를 환경 변수로 설정하세요:
   export ENCRYPTION_KEY=a1b2c3d4e5f6...

2️⃣  .env.local 파일에 다음을 추가하세요:
   VITE_SUPABASE_URL="iv:authtag:encrypted..."
```

### 3단계: 환경 변수 설정

#### Windows PowerShell에서:
```powershell
$env:ENCRYPTION_KEY = "a1b2c3d4e5f6..."
```

#### Windows Command Prompt에서:
```cmd
set ENCRYPTION_KEY=a1b2c3d4e5f6...
```

#### 영구 설정 (권장):
1. 시스템 환경 변수 설정
   - `Win + X` → 시스템 → 고급 시스템 설정
   - `환경 변수` 클릭
   - `새로 만들기` → 변수명: `ENCRYPTION_KEY`, 값: `a1b2c3d4e5f6...`
   - PC 재시작

#### .env.local 파일 방식:
```bash
# .env.local에 저장 (평문)
ENCRYPTION_KEY=a1b2c3d4e5f6...
VITE_SUPABASE_URL="iv:authtag:encrypted..."
VITE_SUPABASE_ANON_KEY="iv:authtag:encrypted..."
```

### 4단계: 동작 확인
```bash
npm run dev
```

## 🔒 보안 체크리스트
- [ ] Supabase 대시보드에서 기존 키 삭제됨
- [ ] 암호화 키 (ENCRYPTION_KEY) 안전히 보관
- [ ] 새로운 암호화된 API 키를 .env.local에 저장
- [ ] git에서 평문 API 키 이력 제거 (아래 참조)
- [ ] 프로덕션 환경변수 설정 완료

## 🗑️ Git 이력 정리 (선택)

평문 API 키가 이미 커밋된 경우:

```bash
# 1. .env.local 파일을 git 이력에서 제거
git rm --cached .env.local

# 2. git 이력에서 평문 키 제거 (BFG Repo-Cleaner 사용 권장)
# https://rtyley.github.io/bfg-repo-cleaner/

# 3. .gitignore에 .env.local 추가 (이미 되어있음)
```

## 🏗️ 프로덕션 배포 시

### Vercel의 경우:
1. Dashboard → Settings → Environment Variables
2. `ENCRYPTION_KEY` 추가
3. 암호화된 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 추가

### Netlify의 경우:
1. Site settings → Build & deploy → Environment
2. 동일하게 환경 변수 추가

## 📝 기술 설명

### 암호화 방식
- **알고리즘**: AES-256-GCM (Advanced Encryption Standard)
- **키 크기**: 256비트 (32바이트)
- **IV (Initialization Vector)**: 128비트 (16바이트) 무작위 생성
- **인증**: GCM 모드의 auth tag로 무결성 검증

### 암호화된 데이터 형식
```
iv:authtag:encrypted_data
예: abc123:def456:ghi789
```

## 🆘 트러블슈팅

### "복호화 실패" 에러
→ `ENCRYPTION_KEY` 환경 변수 확인
→ 키 값이 올바른지 확인

### API 접근 불가
→ Supabase 대시보드에서 새로운 키로 다시 암호화
→ CORS 설정 확인

### 환경 변수가 로드되지 않음
→ 개발 서버 재시작: `npm run dev`
→ Vite 캐시 정리: `.vite` 폴더 삭제

---

**더 안전한 방법**: AWS Secrets Manager, Azure Key Vault, HashiCorp Vault 등의 전문 비밀 관리 서비스 사용
