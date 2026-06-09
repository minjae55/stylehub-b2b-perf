import { useSearchParams } from "react-router";
import { INITIAL_USERS } from "../AdminUsers";

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const results = INITIAL_USERS.filter(user =>
    user.name.toLowerCase().includes(query.toLowerCase()) ||
    user.email.toLowerCase().includes(query.toLowerCase()) ||
    user.companyName.toLowerCase().includes(query.toLowerCase())
  );

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
                    <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-700/10">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
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