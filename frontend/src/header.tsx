import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { supabase } from "./supabase";
import AuthBox from "./AuthBox";

const ADMIN_EMAILS = [
  "25_otj1024@dshs.kr", // ✅ 여기 관리자 이메일 추가
  // "teacher@dshs.kr",
];

export default function Header() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user.email ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const isAdmin = useMemo(() => {
    if (!userEmail) return false;
    return ADMIN_EMAILS.includes(userEmail);
  }, [userEmail]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `pb-1 border-b-2 text-sm ${
      isActive
        ? "text-black border-black"
        : "text-gray-600 border-transparent hover:text-black"
    }`;

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <div className="font-bold text-lg tracking-tight text-black">
          Suggestion Center
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <NavLink to="/" className={linkClass}>HOME</NavLink>
          <NavLink to="/my" className={linkClass}>MY</NavLink>

          {isAdmin && (
            <NavLink to="/admin" className={linkClass}>ADMIN</NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3 text-sm text-gray-700">
          <div className="hidden sm:block">{userEmail ?? "로그인 필요"}</div>
          <AuthBox />
        </div>
      </div>
    </header>
  );
}
