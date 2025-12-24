import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

type Status = "RECEIVED" | "PREP" | "IN_PROGRESS" | "DONE";

const STATUS_LABEL: Record<Status, string> = {
  RECEIVED: "접수 완료",
  PREP: "준비물 구비 중",
  IN_PROGRESS: "개선 중",
  DONE: "완료",
};

// ✅ 관리자 이메일(여기에 추가)
const ADMIN_EMAILS = ["25_otj1024@dshs.kr"];

// ✅ 학교 도메인 제한
const SCHOOL_DOMAIN = "dshs.kr";

type Suggestion = {
  id: string;
  title: string;
  content: string;
  status: Status;
  created_at: string;
  updated_at: string;

  // ✅ 등록자 판별용
  user_id?: string | null;

  // (있어도 되고 없어도 됨)
  user_email?: string | null;
};

function StatusChip({ status }: { status: Status }) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset";
  const cls =
    status === "RECEIVED"
      ? "bg-blue-50 text-blue-700 ring-blue-200"
      : status === "PREP"
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : status === "IN_PROGRESS"
      ? "bg-purple-50 text-purple-700 ring-purple-200"
      : "bg-emerald-50 text-emerald-700 ring-emerald-200";
  return <span className={`${base} ${cls}`}>{STATUS_LABEL[status]}</span>;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export default function Home({
  pageMode,
}: {
  pageMode: "home" | "all" | "my" | "admin";
}) {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "ALL">("ALL");
  const [onlyMine, setOnlyMine] = useState(false);

  // ✅ 신청서(모달) 상태
  const [openForm, setOpenForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");

  // ✅ 로그인 상태
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  // ✅ 관리자 여부
  const isAdmin = useMemo(() => {
    if (!userEmail) return false;
    return ADMIN_EMAILS.includes(userEmail);
  }, [userEmail]);

  // ✅ 학교계정 로그인 여부
  const isSchoolUser = useMemo(() => {
    if (!userEmail) return false;
    return userEmail.endsWith("@" + SCHOOL_DOMAIN);
  }, [userEmail]);

  // ✅ 등록 가능 조건(학교계정 로그인)
  const canCreate = useMemo(() => {
    return !!authUserId && isSchoolUser;
  }, [authUserId, isSchoolUser]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user.email ?? null);
      setAuthUserId(data.session?.user.id ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user.email ?? null);
      setAuthUserId(session?.user.id ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // ✅ 페이지 모드에 따라 기본 필터 자동 설정
  useEffect(() => {
    if (pageMode === "my") {
      setOnlyMine(true);
      setFilterStatus("ALL");
    } else {
      setOnlyMine(false);
      setFilterStatus("ALL");
    }
  }, [pageMode]);

  async function fetchItems() {
    setLoading(true);

    let query = supabase.from("suggestions").select("*");

    if (filterStatus !== "ALL") query = query.eq("status", filterStatus);

    // ✅ 내 건의: user_id로 필터
    if (onlyMine) {
      if (!authUserId) {
        setItems([]);
        setLoading(false);
        return;
      }
      query = query.eq("user_id", authUserId);
    }

    if (q.trim().length > 0) {
      const keyword = `%${q.trim()}%`;
      query = query.or(`title.ilike.${keyword},content.ilike.${keyword}`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      alert("불러오기 실패: " + error.message);
    } else {
      setItems((data as Suggestion[]) ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, onlyMine]);

  // ✅ 등록은 "모달 안 등록 버튼"에서만 호출됨
  async function addSuggestion() {
    // ✅ 로그인+학교계정 아니면 차단
    if (!authUserId || !userEmail) {
      alert(`학교 구글 계정(@${SCHOOL_DOMAIN})으로 로그인 후 등록할 수 있습니다.`);
      return;
    }
    if (!isSchoolUser) {
      alert(`학교 계정(@${SCHOOL_DOMAIN})만 등록 가능합니다.`);
      return;
    }

    if (!formTitle.trim() || !formContent.trim()) {
      alert("제목/내용을 입력하세요.");
      return;
    }

    const { error } = await supabase.from("suggestions").insert({
      title: formTitle.trim(),
      content: formContent.trim(),
      status: "RECEIVED",
      user_id: authUserId, // ✅ 등록자 저장
    });

    if (error) {
      alert("등록 실패: " + error.message);
      return;
    }

    setFormTitle("");
    setFormContent("");
    setOpenForm(false);
    fetchItems();
  }

  // ✅ 접수 상태 변경: 어드민만
  async function updateStatus(id: string, status: Status) {
    if (!isAdmin) {
      alert("관리자만 상태 변경이 가능합니다.");
      return;
    }

    const { error } = await supabase.from("suggestions").update({ status }).eq("id", id);

    if (error) {
      alert("상태 변경 실패: " + error.message);
      return;
    }

    fetchItems();
  }

  // ✅ 삭제: 등록자 or 어드민만
  async function removeItem(item: Suggestion) {
    const canDelete = isAdmin || (!!authUserId && item.user_id === authUserId);
    if (!canDelete) {
      alert("삭제 권한이 없습니다.");
      return;
    }

    if (!confirm("삭제할까요?")) return;

    const { error } = await supabase.from("suggestions").delete().eq("id", item.id);

    if (error) {
      alert("삭제 실패: " + error.message);
      return;
    }

    fetchItems();
  }

  const activeQuick = useMemo(() => {
    if (onlyMine) return "MINE";
    return filterStatus;
  }, [onlyMine, filterStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f9fc] to-white">
      <main className="mx-auto max-w-6xl px-3 sm:px-4 py-4 sm:py-8">
        {/* Notice */}
        <div className="rounded-xl sm:rounded-2xl border-2 border-[#1a3a52] bg-white px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center rounded-full bg-[#1a3a52] px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-semibold text-white">
              NOTICE
            </span>
            <span className="text-xs sm:text-sm text-gray-700">욕설·비방 건의는 삭제될 수 있습니다.</span>
          </div>
          <button className="text-xs sm:text-sm text-[#1a3a52] hover:text-[#2d5f8d] whitespace-nowrap font-medium">자세히</button>
        </div>

        {/* Hero */}
        <div className="mt-4 sm:mt-6 rounded-xl sm:rounded-2xl border-2 border-[#1a3a52] bg-white p-4 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1a3a52]">
                건의사항 센터
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
                건의를 등록하면 처리 상태로 진행 상황을 확인할 수 있습니다.
              </p>
              {!canCreate && (
                <p className="mt-2 text-xs sm:text-sm text-gray-500">
                  학교 계정(@{SCHOOL_DOMAIN}) 로그인 후 등록 가능
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  if (!canCreate) {
                    alert(`학교 계정(@${SCHOOL_DOMAIN})으로 로그인 후 등록할 수 있습니다.`);
                    return;
                  }
                  setOpenForm(true);
                }}
                className={`flex-1 sm:flex-none rounded-lg sm:rounded-xl px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold ${
                  canCreate
                    ? "bg-[#1a3a52] text-white hover:bg-[#2d5f8d]"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                건의 등록
              </button>

              <button
                onClick={() => fetchItems()}
                className="flex-1 sm:flex-none rounded-lg sm:rounded-xl border-2 border-[#1a3a52] px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base text-[#1a3a52] font-semibold hover:bg-[#f5f9fc]"
              >
                전체 보기
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <div className="w-full sm:flex-1 relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="검색"
                className="w-full rounded-lg sm:rounded-xl border border-gray-300 bg-white px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 text-sm outline-none focus:ring-2 focus:ring-black/10"
              />
              <button
                onClick={fetchItems}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black text-lg"
              >
                🔍
              </button>
            </div>

            <button
              onClick={() => {
                setQ("");
                setFilterStatus("ALL");
                setOnlyMine(pageMode === "my");
                fetchItems();
              }}
              className="w-full sm:w-auto rounded-lg sm:rounded-xl border border-gray-300 px-4 sm:px-5 py-2 sm:py-3 text-sm sm:text-base hover:bg-gray-50"
            >
              새로고침
            </button>
          </div>

          {/* Quick filters */}
          <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            <button
              onClick={() => {
                setOnlyMine(false);
                setFilterStatus("ALL");
              }}
              className={`rounded-lg sm:rounded-xl px-2 sm:px-4 py-1.5 sm:py-3 text-xs sm:text-sm border-2 ${
                activeQuick === "ALL"
                  ? "bg-[#1a3a52] text-white border-[#1a3a52]"
                  : "bg-white text-[#1a3a52] border-[#1a3a52] hover:bg-[#f5f9fc]"
              }`}
            >
              전체
            </button>

            <button
              onClick={() => {
                setOnlyMine(false);
                setFilterStatus("RECEIVED");
              }}
              className={`rounded-lg sm:rounded-xl px-2 sm:px-4 py-1.5 sm:py-3 text-xs sm:text-sm border-2 ${
                activeQuick === "RECEIVED"
                  ? "bg-[#1a3a52] text-white border-[#1a3a52]"
                  : "bg-white text-[#1a3a52] border-[#1a3a52] hover:bg-[#f5f9fc]"
              }`}
            >
              접수
            </button>

            <button
              onClick={() => {
                setOnlyMine(false);
                setFilterStatus("PREP");
              }}
              className={`rounded-lg sm:rounded-xl px-2 sm:px-4 py-1.5 sm:py-3 text-xs sm:text-sm border-2 ${
                activeQuick === "PREP"
                  ? "bg-[#1a3a52] text-white border-[#1a3a52]"
                  : "bg-white text-[#1a3a52] border-[#1a3a52] hover:bg-[#f5f9fc]"
              }`}
            >
              준비
            </button>

            <button
              onClick={() => {
                setOnlyMine(false);
                setFilterStatus("IN_PROGRESS");
              }}
              className={`rounded-lg sm:rounded-xl px-2 sm:px-4 py-1.5 sm:py-3 text-xs sm:text-sm border-2 ${
                activeQuick === "IN_PROGRESS"
                  ? "bg-[#1a3a52] text-white border-[#1a3a52]"
                  : "bg-white text-[#1a3a52] border-[#1a3a52] hover:bg-[#f5f9fc]"
              }`}
            >
              개선
            </button>

            <button
              onClick={() => {
                setOnlyMine(false);
                setFilterStatus("DONE");
              }}
              className={`rounded-lg sm:rounded-xl px-2 sm:px-4 py-1.5 sm:py-3 text-xs sm:text-sm border-2 ${
                activeQuick === "DONE"
                  ? "bg-[#1a3a52] text-white border-[#1a3a52]"
                  : "bg-white text-[#1a3a52] border-[#1a3a52] hover:bg-[#f5f9fc]"
              }`}
            >
              완료
            </button>

            <button
              onClick={() => {
                setOnlyMine(true);
                setFilterStatus("ALL");
              }}
              className={`rounded-lg sm:rounded-xl px-2 sm:px-4 py-1.5 sm:py-3 text-xs sm:text-sm border-2 ${
                activeQuick === "MINE"
                  ? "bg-[#1a3a52] text-white border-[#1a3a52]"
                  : "bg-white text-[#1a3a52] border-[#1a3a52] hover:bg-[#f5f9fc]"
              }`}
            >
              내 건의
            </button>
          </div>
        </div>

        {/* List */}
        <div className="mt-6 sm:mt-8">
          <div className="flex items-end justify-between px-0">
            <h2 className="text-lg sm:text-xl font-bold text-[#1a3a52]">건의 목록</h2>
            <div className="text-xs sm:text-sm text-gray-500">{items.length}건</div>
          </div>

          <div className="mt-3 sm:mt-4 rounded-xl sm:rounded-2xl border-2 border-[#1a3a52] bg-white p-3 sm:p-4 shadow-sm">
            {loading ? (
              <div className="py-10 text-center text-gray-500">불러오는 중...</div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center text-gray-400">등록된 건의가 없음</div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {items.map((it) => {
                  const canDelete = isAdmin || (!!authUserId && it.user_id === authUserId);

                  return (
                    <div
                      key={it.id}
                      className="rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 hover:bg-gray-50"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <h3 className="font-semibold text-sm sm:text-base line-clamp-2">{it.title}</h3>
                            <StatusChip status={it.status} />
                          </div>
                          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                            {it.content}
                          </p>
                          <div className="mt-1.5 sm:mt-2 text-xs text-gray-500">
                            {formatDate(it.created_at)}
                            {it.user_email ? ` · ${it.user_email}` : ""}
                          </div>
                        </div>

                        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
                          <select
                            value={it.status}
                            disabled={!isAdmin}
                            onChange={(e) => updateStatus(it.id, e.target.value as Status)}
                            className={`rounded-md text-xs sm:text-sm px-2 py-1 border ${
                              isAdmin
                                ? "border-gray-300"
                                : "border-gray-200 opacity-50 cursor-not-allowed"
                            }`}
                            title={isAdmin ? "" : "관리자만 상태 변경 가능"}
                          >
                            <option value="RECEIVED">접수</option>
                            <option value="PREP">준비</option>
                            <option value="IN_PROGRESS">개선</option>
                            <option value="DONE">완료</option>
                          </select>

                          {canDelete && (
                            <button
                              onClick={() => removeItem(it)}
                              className="text-xs sm:text-sm text-gray-500 hover:text-black"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ✅ 신청서(모달) */}
      {openForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg sm:rounded-2xl bg-white p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto border-2 border-[#1a3a52]">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-[#1a3a52]">건의 등록</h3>
              <button
                onClick={() => setOpenForm(false)}
                className="text-gray-500 hover:text-[#1a3a52] text-xl"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 sm:mt-4 space-y-2.5 sm:space-y-3">
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="제목"
                className="w-full rounded-lg sm:rounded-xl border-2 border-[#1a3a52] px-3 sm:px-4 py-2 sm:py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a3a52]/30"
              />

              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="내용"
                rows={5}
                className="w-full rounded-lg sm:rounded-xl border-2 border-[#1a3a52] px-3 sm:px-4 py-2 sm:py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a3a52]/30 resize-none"
              />
            </div>

            <div className="mt-4 sm:mt-5 flex justify-end gap-2">
              <button
                onClick={() => setOpenForm(false)}
                className="rounded-lg sm:rounded-xl border-2 border-[#1a3a52] px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium text-[#1a3a52] hover:bg-[#f5f9fc]"
              >
                취소
              </button>
              <button
                onClick={addSuggestion}
                className="rounded-lg sm:rounded-xl bg-[#1a3a52] px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold text-white hover:bg-[#2d5f8d]"
              >
                등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
