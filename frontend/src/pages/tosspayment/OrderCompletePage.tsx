import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import api from '@/api/axios';
import { Loader2, Package } from 'lucide-react';

type OrderCompleteLocationState = {
    orderNumbers?: string[];
};

// GET /buyer/orders 목록 응답 중 요약 표시에 필요한 필드만 사용한다.
type BuyerOrderListItem = {
    orderId: number;
    orderNo: string;
    totalAmount: number;
    representativeProductName: string;
    itemCount: number;
    totalQuantity: number;
};

function formatPrice(value: number) {
    return `${value.toLocaleString()}원`;
}

export default function OrderCompletePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const orderNumbers =
        (location.state as OrderCompleteLocationState | null)?.orderNumbers ?? [];

    const [orders, setOrders] = useState<BuyerOrderListItem[]>([]);
    const [isLoadingSummary, setIsLoadingSummary] = useState(orderNumbers.length > 0);

    useEffect(() => {
        if (orderNumbers.length === 0) return;

        let cancelled = false;

        api.get<BuyerOrderListItem[]>('/buyer/orders')
            .then((allOrders) => {
                if (cancelled) return;
                const matched = allOrders.filter((order) =>
                    orderNumbers.includes(order.orderNo),
                );
                setOrders(matched);
            })
            .catch((error) => {
                console.error('주문 요약 조회 실패', error);
            })
            .finally(() => {
                if (!cancelled) setIsLoadingSummary(false);
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totalPaid = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    return (
        <div className="min-h-screen bg-[#f7f9fb] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">

                {/* 성공 체크 마크 아이콘 */}
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
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
                <h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                    주문 및 결제 완료!
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    결제가 성공적으로 완료되었습니다.<br />
                    소중한 주문 감사드립니다.
                </p>

                {/* 주문 요약 */}
                {orderNumbers.length > 0 && (
                    <div className="mt-6 rounded-lg border border-slate-200 text-left">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                            <span className="text-sm font-bold text-slate-800">주문 요약</span>
                            <span className="rounded-md bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                                {orders.length}건
                            </span>
                        </div>

                        {isLoadingSummary ? (
                            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                                <Loader2 size={16} className="animate-spin" />
                                주문 정보를 불러오는 중입니다.
                            </div>
                        ) : (
                            <>
                                <ul className="divide-y divide-slate-100">
                                    {orders.map((order) => (
                                        <li key={order.orderId} className="flex items-center gap-3 px-4 py-3">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                                                <Package size={18} />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-slate-800">
                                                    {order.representativeProductName}
                                                    {order.itemCount > 1 && ` 외 ${order.itemCount - 1}건`}
                                                </p>
                                                <p className="mt-0.5 font-mono text-xs text-slate-400">
                                                    {order.orderNo} · {order.totalQuantity}개
                                                </p>
                                            </div>
                                            <p className="shrink-0 text-sm font-bold text-slate-800">
                                                {formatPrice(order.totalAmount)}
                                            </p>
                                        </li>
                                    ))}
                                </ul>

                                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                                    <span className="text-sm font-bold text-slate-800">총 결제금액</span>
                                    <span className="text-lg font-black text-blue-700">
                                        {formatPrice(totalPaid)}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* 안내 문구 */}
                <p className="mt-6 text-xs leading-relaxed text-slate-400">
                    배송 및 주문 처리 현황은 <span className="font-semibold text-slate-600">마이페이지 &gt; 주문 내역</span>에서 확인하실 수 있습니다.
                </p>

                {/* 버튼 영역 */}
                <div className="mt-6 flex flex-col gap-2">
                    <button
                        onClick={() => navigate('/buyer/orders')}
                        className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                    >
                        주문 내역 확인하기
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full rounded-md bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
                    >
                        쇼핑 계속하기
                    </button>
                </div>

            </div>
        </div>
    );
}