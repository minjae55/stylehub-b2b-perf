import { useState } from "react";
import { Link } from "react-router";

// 1. 사용자 데이터 타입 정의
interface User {
  id: string;
  name: string;
  email: string;
  companyName: string;
  role: 'BUYER/대표' | 'BUYER/직원' | 'SELLER/대표' | 'SELLER/직원' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  createdAt: string;
}

// 2. 테스트용 더미 데이터
const INITIAL_USERS: User[] = [
  { id: 'USR-001', name: '김바이어', email: 'buyer1@global.com', companyName: '(주)글로벌유통', role: 'BUYER/대표', status: 'ACTIVE', createdAt: '2026-01-15' },
  { id: 'USR-002', name: '이셀러', email: 'seller1@ecopack.com', companyName: '(주)에코팩', role: 'SELLER/대표', status: 'ACTIVE', createdAt: '2026-02-20' },
  { id: 'USR-003', name: '박그린', email: 'seller2@greenpack.com', companyName: '그린패키지', role: 'SELLER/직원', status: 'SUSPENDED', createdAt: '2026-03-11' },
  { id: 'USR-004', name: '최수입', email: 'buyer2@trade.com', companyName: '트레이드인포', role: 'BUYER/직원', status: 'PENDING', createdAt: '2026-06-01' },
];

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // 3. 상태(Status) 변경 핸들러 (예: 활성화/정지 전환)
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

  // 4. 검색 및 필터링 로직
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    
   let matchesRole = false;
    
    if (roleFilter === 'ALL') {
      matchesRole = true; // 전체 선택 시 무조건 패스
    } else if (roleFilter === 'BUYER') {
      // 선택창에서 'BUYER'를 고르면, 데이터의 role에 'BUYER'가 포함된 것(MASTER, STAFF) 둘 다 추출
      matchesRole = user.role.startsWith('BUYER'); 
    }  else if (roleFilter === 'SELLER') {
      // 선택창에서 'BUYER'를 고르면, 데이터의 role에 'BUYER'가 포함된 것(MASTER, STAFF) 둘 다 추출
      matchesRole = user.role.startsWith('SELLER');
    } else {
      // 셀러 등 다른 역할은 정확히 일치하는 것만
      matchesRole = user.role === roleFilter;
    }
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* ── 헤더 영역 ── */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">전체 사용자 관리</h1>
          <p className="text-sm text-gray-500 mt-1">플랫폼에 가입된 모든 바이어 및 셀러 계정을 관리합니다.</p>
        </div>
        <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-lg shadow-sm font-medium">
          총 회원 수: <span className="text-blue-600 font-bold">{users.length}</span>명
        </div>
      </div>

      {/* ── 필터 및 검색 바 ── */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="이름, 이메일, 회사명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="w-full md:w-48">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
          >
            <option value="ALL">전체 유형</option>
            <option value="BUYER">바이어 (Buyer)</option>
            <option value="SELLER">셀러 (Seller)</option>
          </select>
        </div>
      </div>

      {/* ── 사용자 테이블 목록 ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm font-semibold">
                <th className="p-4">사용자 ID</th>
                <th className="p-4">유형</th>
                <th className="p-4">이름 / 이메일</th>
                <th className="p-4">회사명</th>
                <th className="p-4">가입일</th>
                <th className="p-4">상태</th>
                <th className="p-4 text-center">관리 액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-gray-400">
                    검색 결과와 일치하는 사용자가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono text-xs text-gray-500">{user.id}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.role.endsWith('/대표') ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </td>
                    <td className="p-4 font-medium">{user.companyName}</td>
                    <td className="p-4 text-gray-500">{user.createdAt}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        user.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.status === 'ACTIVE' && '정상 영업'}
                        {user.status === 'SUSPENDED' && '이용 정지'}
                        {user.status === 'PENDING' && '승인 대기'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        disabled={user.status === 'PENDING'}
                        className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                          user.status === 'PENDING' 
                            ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                            : user.status === 'ACTIVE'
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-green-200 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {user.status === 'ACTIVE' ? '계정 정지' : user.status === 'SUSPENDED' ? '정지 해제' : '승인 필요'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── 하단 페이지네이션 샘플 ── */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span></span>
          <div className="flex gap-1">
            <button className="px-2 py-1 border rounded bg-gray-50 cursor-not-allowed">이전</button>
            <button className="px-2 py-1 border rounded bg-blue-600 text-white font-medium">1</button>
            <button className="px-2 py-1 border rounded hover:bg-gray-50">다음</button>
          </div>
        </div>
      </div>
    </div>
  );
};