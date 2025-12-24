import { useEffect, useState } from "react";
import { supabase } from "./supabase";

const SCHOOL_DOMAIN = "dshs.kr";

export default function AuthBox() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user.email ?? null;
      setLoggedIn(!!email);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      const email = session?.user.email ?? null;
      setLoggedIn(!!email);

      // 학교 이메일 도메인 제한
      if (email && !email.endsWith("@" + SCHOOL_DOMAIN)) {
        alert(`학교 계정(@${SCHOOL_DOMAIN})만 허용`);
        await supabase.auth.signOut();
        setLoggedIn(false);
        window.location.href = "/";
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function loginGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) alert("로그인 실패: " + error.message);
  }

 async function logout() {
  try {
    // 1️⃣ Supabase 세션 종료
    const { error } = await supabase.auth.signOut();

    if (error && !String(error.message).includes("Auth session missing")) {
      alert("로그아웃 실패: " + error.message);
      return;
    }

    // 2️⃣ localStorage 명시적 정리
    localStorage.clear();
    
    // 3️⃣ sessionStorage 정리
    sessionStorage.clear();

  } finally {
    // 4️⃣ UI 상태 초기화
    setLoggedIn(false);
    
    // 5️⃣ 홈으로 이동 (캐시 무시)
    window.location.href = "/?logout=" + Date.now();
  }
}


  return loggedIn ? (
    <button 
      onClick={logout}
      className="rounded-lg px-3 py-1.5 text-xs sm:text-sm bg-white/20 hover:bg-white/30 text-white font-medium transition-colors"
    >
      로그아웃
    </button>
  ) : (
    <button 
      onClick={loginGoogle}
      className="rounded-lg px-3 py-1.5 text-xs sm:text-sm bg-white/20 hover:bg-white/30 text-white font-medium transition-colors"
    >
      로그인
    </button>
  );
}
