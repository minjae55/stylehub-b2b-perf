import { useNavigate } from 'react-router';

export default function OrderCompletePage() {
    const navigate = useNavigate();

    // 토스 성공 페이지 등에서 state로 주문 정보를 넘겨받아 보여주면 더 좋지만,
    // 우선은 기본 구조와 스타일을 먼저 잡을 수 있도록 깔끔하게 구성했습니다.

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">

                {/* 성공 체크 마크 아이콘 */}
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-6">
                    <svg
                        className="h-10 w-10 text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                        ></path>
                    </svg>
                </div>

                {/* 메인 메시지 */}
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    주문 및 결제 완료!
                </h2>
                <p className="text-slate-500 mt-2 text-sm">
                    결제가 성공적으로 완료되었습니다.<br />
                    소중한 주문 감사드립니다.
                </p>

                {/* 간단한 안내선 */}
                <div className="border-t border-slate-100 my-6"></div>

                {/* 안내 문구 및 다음 액션 유도 */}
                <p className="text-xs text-slate-400 mb-8 leading-relaxed">
                    배송 및 주문 처리 현황은 <span className="font-semibold text-slate-600">마이페이지 &gt; 주문 내역</span>에서 확인하실 수 있습니다.
                </p>

                {/* 버튼 영역 */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => navigate('/mypage/orders')} // 프로젝트 주문내역 주소에 맞게 수정하세요
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-xl transition-colors text-sm"
                    >
                        주문 내역 확인하기
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-xl transition-colors text-sm"
                    >
                        쇼핑 계속하기
                    </button>
                </div>

            </div>
        </div>
    );
}