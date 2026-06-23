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
  };
  const statusMap: Record<string, User['status']> = {
    'APPROVED': 'ACTIVE',
    'PENDING': 'PENDING',
    'SUSPENDED': 'SUSPENDED',
  };

  return {
    id: String(u.userId),
    name: u.name,
    email: u.email,
    companyName: u.companyName,
    role: roleMap[`${u.businessRole}_${u.role}`] ?? 'ADMIN',
    status: statusMap[u.status] ?? 'PENDING',
    createdAt: u.createdAt?.slice(0,10) ?? '',
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
  const PAGE_SIZE = 10;

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
  const handleToggleStatus = (userId: string) => {
    setUsers(prevUsers =>
      prevUsers.map(user => {
        if (user.id === userId) {
          // 대기 중(PENDING)일 때 누르면 바로 'ACTIVE(정상)' 승인 처리, 그 외에는 정지/해제 토글
          const nextStatus: User['status'] = 
            user.status === 'PENDING' ? 'ACTIVE' : 
            user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
          return { ...user, status: nextStatus };
        }
        return user;
      })
    );
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

    if (searchTerm) {
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
    if (searchFilter === 'all') { // 통합 검색일 때
      return (
        user.name.toLowerCase().includes(targetTerm) ||
        user.companyName.toLowerCase().includes(targetTerm) ||
        user.email.toLowerCase().includes(targetTerm)
      );
    }
  }

    // 2. 검색 조건 검증
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 3. 역할군 조건 검증
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

    return matchesSearch && matchesRole;
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
    <div className="w-full h-screen bg-slate-50 text-slate-700 flex flex-col overflow-hidden font-sans antialiased">
      
      {/* ── 헤더 영역 ── */}
      <div className="p-8 pb-4 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">전체 사용자 관리</h1>
          <p className="text-sm text-slate-500 mt-1">총 {filteredUsers.length}명 검색/조회됨</p>
        </div>
        <div className="text-sm text-slate-600 bg-white border border-slate-200/60 px-4 py-2 rounded-xl shadow-sm font-medium">
          전체 가입자 계정: <span className="text-indigo-600 font-bold">{users.length}</span>개
        </div>
      </div>

      {/* ── 메인 2단 스플릿 레이아웃 바디 ── */}
      <div className="flex-1 px-8 pb-8 grid grid-cols-5 gap-6 min-h-0">
        
        {/* 💡 [왼쪽 칸] 사이드 네비게이션 기능 */}
        <div className="col-span-1 bg-white rounded-xl border border-slate-200/60 shadow-sm p-2.5 h-full flex flex-col gap-1 shrink-0">
          <button 
            onClick={() => {
              setActiveSubCategory('ALL');
              setCurrentPage(1);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all ${
              activeSubCategory === 'ALL' 
                ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100/50' 
                : 'text-slate-600 hover:bg-slate-50/80'
            }`}
          >
            <Users size={18} />
            전체 사용자 조회
          </button>
          
          <button 
            onClick={() => {
              setActiveSubCategory('REQUEST');
              setCurrentPage(1);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-lg transition-all ${
              activeSubCategory === 'REQUEST' 
                ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100/50' 
                : 'text-slate-600 hover:bg-slate-50/80'
            }`}
          >
            <div className="flex items-center gap-3">
              <UserPlus size={18} />
              등록 요청 사용자
            </div>
            {pendingCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-2xs font-bold transition-colors ${
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
          className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-lg transition-all ${
            activeSubCategory === 'SUSPENDED' 
              ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100/50' 
              : 'text-slate-600 hover:bg-slate-50/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <UserX size={18} />
            계정 정지 사용자
          </div>
          {/* 버그 수정: pendingCount 대신 상단에서 선언한 suspendedCount를 매핑하여 정지 유저 수 노출 */}
          {suspendedCount > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-2xs font-bold transition-colors ${
              activeSubCategory === 'SUSPENDED' ? 'bg-indigo-600 text-white' : 'bg-rose-500 text-white'
            }`}>
              {suspendedCount}
            </span>
          )}
        </button>
        </div>

        {/* [오른쪽 칸] 데이터 필터링 & 메인 테이블 보드 */}
        <div className="col-span-4 flex flex-col h-full min-h-0">
          
          {/* 필터 및 검색 바 */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 mb-4 flex flex-col md:flex-row gap-3 shrink-0">
            {/* <div className="flex items-center gap-2 w-full max-w-xl"> */}
    
    {/* 검색 조건 선택 Select 박스 */}
    <select
      value={searchFilter}
      onChange={(e) => {
        setSearchFilter(e.target.value as any);
        setSearchTerm(""); 
        setCurrentPage(1);
      }}
      className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-sm transition-all text-slate-700 font-medium cursor-pointer"
    >
      <option value="all">전체</option>
      <option value="name">이름</option>
      <option value="company">회사명</option>
      <option value="email">이메일</option>
    </select>

    {/* 검색어 입력 인풋 */}
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
        className="w-full pl-4 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-sm transition-all placeholder-slate-400"
      />
    </div>
  {/* </div> */}
            <div className="w-full md:w-52">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-sm text-slate-700 font-medium transition-all cursor-pointer"
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
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-600 text-xs font-semibold tracking-wide uppercase">
                    <th className="p-4 pl-6">사용자 ID</th>
                    <th className="p-4">유형 권한</th>
                    <th className="p-4">이름 / 이메일</th>
                    <th className="p-4">회사명</th>
                    <th className="p-4">등록일</th>
                    <th className="p-4">계정 상태</th>
                    <th className="p-4 text-center pr-6">관리 액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                        조건과 일치하는 사용자가 존재하지 않습니다.
                      </td>
                    </tr>
                  ) : (
                    pagedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 pl-6 font-mono text-xs text-slate-400 font-medium">{user.id}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium tracking-wide ${getRoleBadge(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-900">{user.name}</div>
                          <div className="text-xs text-slate-400 font-normal mt-0.5">{user.email}</div>
                        </td>
                        <td className="p-4 font-medium text-slate-800">{user.companyName}</td>
                        <td className="p-4 text-slate-500 font-normal">{user.createdAt}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
                            user.status === 'SUSPENDED' ? 'bg-rose-50 text-rose-700 border-rose-200/60' : 
                            'bg-amber-50 text-amber-700 border-amber-200/60'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              user.status === 'ACTIVE' ? 'bg-emerald-500' :
                              user.status === 'SUSPENDED' ? 'bg-rose-500' : 'bg-amber-500'
                            }`} />
                            {user.status === 'ACTIVE' && '정상'}
                            {user.status === 'SUSPENDED' && '계정정지'}
                            {user.status === 'PENDING' && '승인대기'}
                          </span>
                        </td>
                        <td className="p-4 text-center pr-6">
                          <button
                            onClick={() => handleToggleStatus(user.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide border transition-all ${
                              user.status === 'PENDING'
                                ? 'border-indigo-200 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100/70 shadow-sm shadow-indigo-100/30'
                                : user.status === 'ACTIVE'
                                ? 'border-rose-200 text-rose-600 hover:bg-rose-50/70 hover:border-rose-300 shadow-sm shadow-rose-100/50'
                                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50/70 hover:border-emerald-300 shadow-sm shadow-emerald-100/50'
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

            {/* 페이지네이션 하단 내비바 */}
            <div className="p-4 px-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium bg-slate-50/30 shrink-0">
              <span>검색 항목 {filteredUsers.length}개</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 font-semibold text-xs shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
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
                      <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-slate-400">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p as number)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm transition-colors ${
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
                  className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 font-semibold text-xs shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
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