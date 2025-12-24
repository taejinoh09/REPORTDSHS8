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

  return (
    <header className="bg-gradient-to-r from-[#1a3a52] to-[#2d5f8d] sticky top-0 z-40 shadow-md">
      <div className="mx-auto max-w-6xl px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
        <div className="font-bold text-base sm:text-lg tracking-tight text-white">
          Suggestion
        </div>

        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          <NavLink to="/" className={({ isActive }) => `pb-1 border-b-2 text-sm ${
            isActive
              ? "text-white border-white"
              : "text-green-100 border-transparent hover:text-white"
          }`}>HOME</NavLink>
          <NavLink to="/my" className={({ isActive }) => `pb-1 border-b-2 text-sm ${
            isActive
              ? "text-white border-white"
              : "text-green-100 border-transparent hover:text-white"
          }`}>MY</NavLink>

          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `pb-1 border-b-2 text-sm ${
              isActive
                ? "text-white border-white"
                : "text-green-100 border-transparent hover:text-white"
            }`}>ADMIN</NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-green-100">
          <div className="hidden sm:block truncate max-w-[150px] md:max-w-full">{userEmail ?? "로그인"}</div>
          <AuthBox />
        </div>
      </div>
    </header>
  );
}
