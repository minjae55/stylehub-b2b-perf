import React, { useState, useEffect } from 'react';
import { Users, UserPlus, UserX } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  companyName: string;
  role: 'BUYER/대표' | 'BUYER/직원' | 'SELLER/대표' | 'SELLER/직원' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  createdAt: string;
}

interface ApiUser {
  userId: number;
  name: string;
  email: string;
  companyName: string;
  role: 'ADMIN' | 'PRESIDENT' | 'EMPLOYEE';
  businessRole: 'BUYER' | 'SELLER' | 'BOTH';
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'DELETED';
  createdAt: string;
}

function mapApiUser(u: ApiUser): User {
  const roleMap: Record<string, User['role']> = {
    'BUYER_PRESIDENT': 'BUYER/대표',
    'BUYER_EMPOLYEE': 'BUYER/직원',
    'SELLER_PRESIDENT': 'SELLER/대표',
    'SELLER_EMPLOYEE': 'SELLER/직원',
    'ADMIN_ADMIN': 'ADMIN'
  };
  const statusMap: Record<string, User['status']> = {
    'APPROVED': 'ACTIVE',
    'PENDING': 'PENDING',
    'SUSPENDED': 'SUSPENDED',
  };
  const combinedRoleKey = `${u.businessRole}_${u.role}`;

  return {
    id: String(u.userId),
    name: u.name,
    email: u.email,
    companyName: u.companyName,
    role: roleMap[combinedRoleKey] ?? (u.role === 'ADMIN' ? 'ADMIN' : 'BUYER/직원'),
    status: statusMap[u.status] ?? 'PENDING',
    createdAt: u.createdAt?.slice(0, 10) ?? '',
  };
}

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilter, setSearchFilter] = useState<"all" | "name" | "company" | "email">("all");
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 14;

  // 💡 왼쪽 사이드바용 상태 카테고리 추가 ('ALL': 전체, 'REQUEST': 등록요청)
  const [activeSubCategory, setActiveSubCategory] = useState<'ALL' | 'REQUEST' | 'SUSPENDED'>('ALL');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
        const data = await res.json();
        setUsers((data.data as ApiUser[]).map(mapApiUser));
      } catch (e) {
        setError(e instanceof Error ? e.message : '불러오기 실패');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // 계정 상태 변경 및 가입 승인 토글 액션
  const handleToggleStatus = async (userId: string) => {
    // 1. 상태를 바꿀 대상을 기존 메모리(State)에서 탐색
    const targetUser = users.find(user => user.id === userId);
    if (!targetUser) return;

    // 2. 현재 상태 기준 다음으로 변환할 백엔드 규격(ApiUser.status) 매핑 연산
    let nextApiStatus: ApiUser['status'] = 'APPROVED'; // 기본값 ACTIVE 매칭용
    if (targetUser.status === 'PENDING') {
      nextApiStatus = 'APPROVED';   // 승인대기 -> 정상 승인
    } else if (targetUser.status === 'ACTIVE') {
      nextApiStatus = 'SUSPENDED';  // 정상 -> 계정정지
    } else if (targetUser.status === 'SUSPENDED') {
      nextApiStatus = 'APPROVED';   // 계정정지 -> 정지 해제(정상)
    }

    try {
      // 3. 백엔드 API에 상태 업데이트 요청 전송
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH', // 💡 부분 수정을 위해 PATCH 메서드 사용
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ status: nextApiStatus }), // 백엔드 DTO 규격에 맞춤
      });

      if (!res.ok) {
        throw new Error(`상태 변경 실패 (서버 에러: ${res.status})`);
      }

      // 4. 백엔드 DB 저장이 확실히 완료된 경우에만 프론트 화면 상태를 실시간 업데이트
      setUsers(prevUsers =>
          prevUsers.map(user => {
            if (user.id === userId) {
              let nextStatus: User['status'] = 'ACTIVE';

              if (targetUser.status === 'PENDING') nextStatus = 'ACTIVE';      // PENDING -> 승인완료(ACTIVE)
              else if (targetUser.status === 'ACTIVE') nextStatus = 'SUSPENDED'; // ACTIVE -> 정지(SUSPENDED)
              else if (targetUser.status === 'SUSPENDED') nextStatus = 'ACTIVE'; // SUSPENDED -> 해제(ACTIVE)

              return { ...user, status: nextStatus };
            }
            return user;
          })
      );
    } catch (error) {
      console.error("유저 상태 갱신 실패:", error);
      alert(error instanceof Error ? error.message : "상태를 변경하는 도중 오류가 발생했습니다.");
    }
  };

  // 데이터 필터링 결합 (텍스트 검색 + 상단 롤 필터 + 왼쪽 사이드바 메뉴)
  const filteredUsers = users.filter(user => {
    // 1. 왼쪽 사이드바 검증 (등록 요청일 경우 PENDING 상태만)
    if (activeSubCategory === 'REQUEST' && user.status !== 'PENDING') {
      return false;
    }
    if (activeSubCategory === 'SUSPENDED' && user.status !== 'SUSPENDED') {
    return false;
    }

    // 역할군 조건 검증
    let matchesRole = false;
    if (roleFilter === 'ALL') {
      matchesRole = true;
    } else if (roleFilter === 'BUYER') {
      matchesRole = user.role.startsWith('BUYER');
    } else if (roleFilter === 'SELLER') {
      matchesRole = user.role.startsWith('SELLER');
    } else {
      matchesRole = user.role === roleFilter;
    }

    if (!matchesRole) return false;

    if (!searchTerm) return true; // 검색어가 없으면 위 조건(사이드바, 역할) 패스 시 무조건 노출

    const targetTerm = searchTerm.toLowerCase();

    if (searchFilter === 'name') {
      return user.name.toLowerCase().includes(targetTerm);
    }
    if (searchFilter === 'company') {
      return user.companyName.toLowerCase().includes(targetTerm);
    }
    if (searchFilter === 'email') {
      return user.email.toLowerCase().includes(targetTerm);
    }

    // 통합 검색 ('all') 일 때
    return (
        user.name.toLowerCase().includes(targetTerm) ||
        user.companyName.toLowerCase().includes(targetTerm) ||
        user.email.toLowerCase().includes(targetTerm)
    );



    // 2. 검색 조건 검증
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.companyName.toLowerCase().includes(searchTerm.toLowerCase());

  });

  // 페이지네이션 가공
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // 역할 전용 세분화 뱃지 스타일
  const getRoleBadge = (role: User['role']) => {
    if (role.startsWith('BUYER')) {
      return 'bg-blue-50 text-blue-700 ring-1 ring-blue-700/10';
    }
    if (role.startsWith('SELLER')) {
      return 'bg-purple-50 text-purple-700 ring-1 ring-purple-700/10';
    }
    return 'bg-slate-50 text-slate-700 ring-1 ring-slate-600/10';
  };

  // 대기 승인 카운트 집계
  const pendingCount = users.filter(u => u.status === 'PENDING').length;
  const suspendedCount = users.filter(u => u.status === 'SUSPENDED').length;

  if (loading) return <div className="p-8 text-slate-500 text-sm">불러오는 중...</div>;
  if (error)   return <div className="p-8 text-rose-500 text-sm">{error}</div>;

  return (
  <div className="w-full h-screen bg-slate-50 text-slate-700 flex flex-col overflow-hidden font-sans antialiased select-none">
    
    {/* ── 헤더 영역 (컴팩트하게 상단 고정) ── */}
    <div className="p-5 pb-3 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">전체 사용자 관리</h1>
        <p className="text-xs text-slate-500 mt-0.5">총 {filteredUsers.length}명 검색/조회됨</p>
      </div>
      <div className="text-xs text-slate-600 bg-white border border-slate-200/60 px-3 py-1.5 rounded-xl shadow-sm font-medium">
        전체 가입자 계정: <span className="text-indigo-600 font-bold">{users.length}</span>개
      </div>
    </div>

    {/* ── 메인 2단 스플릿 레이아웃 바디 (화면을 절대 벗어나지 않음) ── */}
    <div className="flex-1 px-5 pb-5 grid grid-cols-5 gap-4 min-h-0 overflow-hidden">
      
      {/* 💡 [왼쪽 칸] 사이드 네비게이션 기능 */}
      <div className="col-span-1 bg-white rounded-xl border border-slate-200/60 shadow-sm p-2 h-full flex flex-col gap-1 shrink-0 overflow-y-auto">
        <button 
          onClick={() => {
            setActiveSubCategory('ALL');
            setCurrentPage(1);
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all ${
            activeSubCategory === 'ALL' 
              ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100/50' 
              : 'text-slate-600 hover:bg-slate-50/80'
          }`}
        >
          <Users size={15} />
          전체 사용자 조회
        </button>
        
        <button 
          onClick={() => {
            setActiveSubCategory('REQUEST');
            setCurrentPage(1);
          }}
          className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-lg transition-all ${
            activeSubCategory === 'REQUEST' 
              ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100/50' 
              : 'text-slate-600 hover:bg-slate-50/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <UserPlus size={15} />
            등록 요청 사용자
          </div>
          {pendingCount > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
              activeSubCategory === 'REQUEST' ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-white'
            }`}>
              {pendingCount}
            </span>
          )}
        </button>
        
        <button 
          onClick={() => {
            setActiveSubCategory('SUSPENDED');
            setCurrentPage(1);
          }}
          className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-lg transition-all ${
            activeSubCategory === 'SUSPENDED' 
              ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100/50' 
              : 'text-slate-600 hover:bg-slate-50/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <UserX size={15} />
            계정 정지 사용자
          </div>
          {suspendedCount > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
              activeSubCategory === 'SUSPENDED' ? 'bg-indigo-600 text-white' : 'bg-rose-500 text-white'
            }`}>
              {suspendedCount}
            </span>
          )}
        </button>
      </div>

      {/* [오른쪽 칸] 데이터 필터링 & 메인 테이블 보드 */}
      <div className="col-span-4 flex flex-col h-full min-h-0 overflow-hidden">
        
        {/* 필터 및 검색 바 */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200/60 mb-3 flex flex-col md:flex-row gap-3 shrink-0">
          <select
            value={searchFilter}
            onChange={(e) => {
              setSearchFilter(e.target.value as any);
              setSearchTerm(""); 
              setCurrentPage(1);
            }}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-xs transition-all text-slate-700 font-medium cursor-pointer"
          >
            <option value="all">전체</option>
            <option value="name">이름</option>
            <option value="company">회사명</option>
            <option value="email">이메일</option>
          </select>

          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={
                searchFilter === "all"
                  ? "통합 검색..."
                  : searchFilter === "name"
                  ? "이름으로 검색..."
                  : searchFilter === "company"
                  ? "회사명으로 검색..."
                  : "이메일 주소 검색..."
              }
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-3 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-xs transition-all placeholder-slate-400"
            />
          </div>
          
          <div className="w-full md:w-44">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-xs text-slate-700 font-medium transition-all cursor-pointer"
            >
              <option value="ALL">전체 유형</option>
              <optgroup label="대분류">
                <option value="BUYER">전체 바이어</option>
                <option value="SELLER">전체 셀러</option>
              </optgroup>
              <optgroup label="상세 권한">
                <option value="BUYER/대표">바이어 / 대표</option>
                <option value="BUYER/직원">바이어 / 직원</option>
                <option value="SELLER/대표">셀러 / 대표</option>
                <option value="SELLER/직원">셀러 / 직원</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* 사용자 테이블 리스트 보드 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col flex-1 min-h-0">
          
          {/* 내부 데이터만 정밀 스크롤 */}
          <div className="overflow-y-auto flex-1 min-h-0">
            <table className="w-full text-left border-collapse whitespace-nowrap table-layout-fixed">
              <thead className="sticky top-0 bg-slate-50 z-10 shadow-[inset_0_-1px_0_rgba(226,232,240,1)]">
                <tr className="text-slate-500 text-[11px] font-semibold tracking-wide uppercase">
                  <th className="py-2.5 px-4 pl-5 w-16">ID</th>
                  <th className="py-2.5 px-4 w-32">유형 권한</th>
                  <th className="py-2.5 px-4">이름 / 이메일</th>
                  <th className="py-2.5 px-4">회사명</th>
                  <th className="py-2.5 px-4 w-32">등록일</th>
                  <th className="py-2.5 px-4 w-28">계정 상태</th>
                  <th className="py-2.5 px-4 text-center pr-5 w-28">관리 액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 font-medium">
                      조건과 일치하는 사용자가 존재하지 않습니다.
                    </td>
                  </tr>
                ) : (
                  pagedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-2 px-4 pl-5 font-mono text-[11px] text-slate-400">{user.id}</td>
                      <td className="py-2 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wide ${getRoleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        <div className="font-semibold text-slate-900">{user.name}</div>
                        <div className="text-[11px] text-slate-400 font-normal mt-0.5">{user.email}</div>
                      </td>
                      <td className="py-2 px-4 font-medium text-slate-800">{user.companyName}</td>
                      <td className="py-2 px-4 text-slate-500 font-normal">{user.createdAt}</td>
                      <td className="py-2 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
                          user.status === 'SUSPENDED' ? 'bg-rose-50 text-rose-700 border-rose-200/60' : 
                          'bg-amber-50 text-amber-700 border-amber-200/60'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${
                            user.status === 'ACTIVE' ? 'bg-emerald-500' :
                            user.status === 'SUSPENDED' ? 'bg-rose-500' : 'bg-amber-500'
                          }`} />
                          {user.status === 'ACTIVE' && '정상'}
                          {user.status === 'SUSPENDED' && '계정정지'}
                          {user.status === 'PENDING' && '승인대기'}
                        </span>
                      </td>
                      {/* 🛠️ [수정] 글씨 크기를 text-xs보다 살짝 작은 text-[11px]로 완벽 고정 */}
                      <td className="py-2 px-4 text-center pr-5">
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={`px-2 py-1 rounded-md text-[11px] font-bold tracking-wide border transition-all ${
                            user.status === 'PENDING'
                              ? 'border-indigo-200 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100/70 shadow-sm'
                              : user.status === 'ACTIVE'
                              ? 'border-rose-200 text-rose-600 hover:bg-rose-50/70 hover:border-rose-300 shadow-sm'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50/70 hover:border-emerald-300 shadow-sm'
                          }`}
                        >
                          {user.status === 'PENDING' ? '승인 처리' : user.status === 'ACTIVE' ? '계정 정지' : '정지 해제'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── 페이지네이션 하단 내비바 (글씨 크기 text-xs로 축소 및 디자인 정돈) ── */}
          <div className="p-3 px-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium bg-slate-50/30 shrink-0 select-none">
            <span>검색 항목 <span className="text-slate-600 font-semibold">{filteredUsers.length}</span>개</span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 border border-slate-200 rounded-lg bg-white text-slate-600 font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-50 text-xs hover:bg-slate-50"
              >
                이전
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 text-xs">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p as number)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs shadow-sm transition-colors ${
                        currentPage === p
                          ? 'bg-indigo-600 text-white'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 border border-slate-200 rounded-lg bg-white text-slate-600 font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-50 text-xs hover:bg-slate-50"
              >
                다음
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  </div>
);
};