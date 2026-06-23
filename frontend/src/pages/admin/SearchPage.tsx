import { useSearchParams } from "react-router";
import { useState, useEffect } from "react";

// AdminUsers.tsx에서 가져오던 INITIAL_USERS 제거
// 동일한 타입 정의 (또는 공통 types 파일로 분리 권장)
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
  companyName: string | null;
  role: 'ADMIN' | 'PRESIDENT' | 'EMPLOYEE';
  businessRole: 'BUYER' | 'SELLER' | 'BOTH';
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'DELETED';
  createdAt: string;
}

function mapApiUser(u: ApiUser): User {
  const roleMap: Record<string, User['role']> = {
    'BUYER_PRESIDENT':  'BUYER/대표',
    'BUYER_EMPLOYEE':   'BUYER/직원',
    'SELLER_PRESIDENT': 'SELLER/대표',
    'SELLER_EMPLOYEE':  'SELLER/직원',
  };
  const statusMap: Record<string, User['status']> = {
    'APPROVED':  'ACTIVE',
    'PENDING':   'PENDING',
    'SUSPENDED': 'SUSPENDED',
  };
  return {
    id: String(u.userId),
    name: u.name,
    email: u.email,
    companyName: u.companyName ?? '(미등록)',
    role: roleMap[`${u.businessRole}_${u.role}`] ?? 'ADMIN',
    status: statusMap[u.status] ?? 'PENDING',
    createdAt: u.createdAt?.slice(0, 10) ?? '',
  };
}

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setUsers((data.data as ApiUser[]).filter(u => u.status !== 'DELETED').map(mapApiUser));
      } catch (e) {
        setError(e instanceof Error ? e.message : '불러오기 실패');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const results = users.filter(user =>
    user.name.toLowerCase().includes(query.toLowerCase()) ||
    user.email.toLowerCase().includes(query.toLowerCase()) ||
    user.companyName.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) return <div className="p-8 text-slate-500 text-sm">불러오는 중...</div>;
  if (error)   return <div className="p-8 text-rose-500 text-sm">{error}</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">검색 결과</h1>
      <p className="text-sm text-slate-500 mb-6">
        "<span className="text-indigo-600 font-medium">{query}</span>" 검색 결과 {results.length}건
      </p>

      {results.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/60 p-12 text-center text-slate-400">
          검색 결과가 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-600 text-xs font-semibold uppercase tracking-wide">
                <th className="p-4 pl-6">이름</th>
                <th className="p-4">이메일</th>
                <th className="p-4">회사명</th>
                <th className="p-4">유형</th>
                <th className="p-4">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 font-semibold text-slate-900">{user.name}</td>
                  <td className="p-4 text-slate-500">{user.email}</td>
                  <td className="p-4 text-slate-700">{user.companyName}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ring-1 ${
                      user.role.startsWith('BUYER')  ? 'bg-blue-50 text-blue-700 ring-blue-700/10' :
                      user.role.startsWith('SELLER') ? 'bg-purple-50 text-purple-700 ring-purple-700/10' :
                                                       'bg-slate-50 text-slate-700 ring-slate-600/10'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      user.status === 'ACTIVE'    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
                      user.status === 'SUSPENDED' ? 'bg-rose-50 text-rose-700 border-rose-200/60' :
                                                    'bg-amber-50 text-amber-700 border-amber-200/60'
                    }`}>
                      {user.status === 'ACTIVE' ? '정상' : user.status === 'SUSPENDED' ? '계정정지' : '승인대기'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}