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
    // 세션이 이미 없어도 signOut을 시도
    const { error } = await supabase.auth.signOut();

    // ✅ 이 에러는 "이미 로그아웃 상태"라서 무시해도 됨
    if (error && !String(error.message).includes("Auth session missing")) {
      alert("로그아웃 실패: " + error.message);
      return;
    }
  } finally {
    // ✅ UI/세션 상태 확실히 초기화
    setLoggedIn(false);
    window.location.href = "/";
  }
}


  return loggedIn ? (
    <button onClick={logout} style={{ padding: "10px 12px" }}>
      로그아웃
    </button>
  ) : (
    <button onClick={loginGoogle} style={{ padding: "10px 12px" }}>
      Google로 로그인(학교계정)
    </button>
  );
}
