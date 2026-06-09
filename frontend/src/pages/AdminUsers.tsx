import { useState } from "react";
import { Link } from "react-router";

interface User {
  id: string;
  name: string;
  email: string;
  companyName: string;
  role: 'BUYER/대표' | 'BUYER/직원' | 'SELLER/대표' | 'SELLER/직원' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  createdAt: string;
}

export const INITIAL_USERS: User[] = [
  { id: 'USR-001', name: '김바이어', email: 'buyer1@global.com', companyName: '(주)글로벌유통', role: 'BUYER/대표', status: 'ACTIVE', createdAt: '2026-01-15' },
  { id: 'USR-002', name: '이셀러', email: 'seller1@ecopack.com', companyName: '(주)에코팩', role: 'SELLER/대표', status: 'ACTIVE', createdAt: '2026-02-20' },
  { id: 'USR-003', name: '박그린', email: 'seller2@greenpack.com', companyName: '그린패키지', role: 'SELLER/직원', status: 'SUSPENDED', createdAt: '2026-03-11' },
  { id: 'USR-004', name: '최수입', email: 'buyer2@trade.com', companyName: '트레이드인포', role: 'BUYER/직원', status: 'PENDING', createdAt: '2026-06-01' },
];

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  

  const handleToggleStatus = (userId: string) => {
    setUsers(prevUsers =>
      prevUsers.map(user => {
        if (user.id === userId) {
          const nextStatus: User['status'] = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
          return { ...user, status: nextStatus };
        }
        return user;
      })
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    
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
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = filteredUsers.slice(
  (currentPage - 1) * PAGE_SIZE,
  currentPage * PAGE_SIZE
  );

  const getRoleBadge = (role: User['role']) => {
    if (role.endsWith('/대표')) {
      return 'bg-blue-50 text-blue-700 ring-1 ring-blue-700/10';
    }
    if (role.endsWith('/직원')) {
      return 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-700/10';
    }
    return 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/10';
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans antialiased">
      
      {/* ── 헤더 영역 ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">전체 사용자 관리</h1>
          <p className="text-sm text-slate-500 mt-1">총 {filteredUsers.length}명 등록됨</p>
        </div>
        <div className="text-sm text-slate-600 bg-white border border-slate-200/60 px-4 py-2 rounded-xl shadow-sm font-medium">
          전체 가입자 계정: <span className="text-indigo-600 font-bold">{users.length}</span>개
        </div>
      </div>

      {/* ── 필터 및 검색 바 ── */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 mb-6 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="이름, 이메일, 혹은 회사명으로 검색..."
            value={searchTerm}
            onChange={(e) => {setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-4 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-sm transition-all placeholder-slate-400"
          />
        </div>
        <div className="w-full md:w-52">
          <select
            value={roleFilter}
            onChange={(e) => {setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-sm text-slate-700 font-medium transition-all cursor-pointer"
          >
            <option value="ALL">전체 유형</option>
            <option value="BUYER">바이어 (Buyer)</option>
            <option value="SELLER">셀러 (Seller)</option>
          </select>
        </div>
      </div>

      {/* ── 사용자 테이블 목록 ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
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
                    조건과 일치하는 검색 결과가 존재하지 않습니다.
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
                        disabled={user.status === 'PENDING'}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide border transition-all ${
                          user.status === 'PENDING' 
                            ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                            : user.status === 'ACTIVE'
                            ? 'border-rose-200 text-rose-600 hover:bg-rose-50/70 hover:border-rose-300 shadow-sm shadow-rose-100/50'
                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50/70 hover:border-emerald-300 shadow-sm shadow-emerald-100/50'
                        }`}
                      >
                        {user.status === 'ACTIVE' ? '계정 정지' : user.status === 'SUSPENDED' ? '정지 해제' : '승인 처리'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── 하단 페이지네이션 영역 ── */}
        <div className="p-4 px-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium bg-slate-50/30">
  <span>{filteredUsers.length}개 항목</span>
  <div className="flex gap-1.5">
    {/* 이전 */}
    <button
      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
      disabled={currentPage === 1}
      className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-400 font-semibold text-xs shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
    >
      이전
    </button>

    {/* 페이지 번호 */}
    {Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(p => {
        // 현재 페이지 앞뒤 2개 + 첫/마지막 항상 표시
        return p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1;
      })
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
                ? 'bg-indigo-600 text-white shadow-indigo-200'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {p}
          </button>
        )
      )}

    {/* 다음 */}
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
  );
};