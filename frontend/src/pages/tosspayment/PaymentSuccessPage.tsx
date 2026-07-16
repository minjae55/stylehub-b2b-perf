import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import api from '@/api/axios';


interface VirtualAccountResponse {
    bankCode: string;
    accountNumber: string;
    customerName: string;
    dueDate: string;
}
interface PaymentConfirmResponse {
    paymentKey: string;
    orderId: string;
    status: string; // "DONE" | "WAITING_FOR_DEPOSIT"
    virtualAccount: VirtualAccountResponse | null;
}

const BANK_NAMES: Record<string, string> = {
    "039": "경남은행", "034": "광주은행", "004": "국민은행", "088": "신한은행",
    "020": "우리은행", "081": "하나은행", "003": "기업은행", "011": "농협은행",
    "045": "새마을금고", "048": "신협", "071": "우체국",
};

const formatDepositDeadline = (isoString: string): string => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}까지`;
}

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 무한 루프 방지를 위한 상태 관리 플래그
  const [isProcessing, setIsProcessing] = useState(false);
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccountResponse | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const orderId = searchParams.get('orderId');
  const paymentKey = searchParams.get('paymentKey');
  const amount = searchParams.get('amount');

    useEffect(() => {
        if (!orderId || !paymentKey || !amount || isProcessing) return;

        setIsProcessing(true);
        const storedIds = sessionStorage.getItem("pending_order_ids");
        const orderIds = storedIds ? JSON.parse(storedIds) : null;

        api.post<PaymentConfirmResponse>('/v1/payments/confirm', {
            orderId,
            paymentKey,
            amount: Number(amount),
            orderIds
        })
            .then((result) => {
                if (result.status === 'WAITING_FOR_DEPOSIT' && result.virtualAccount) {
                    // 가상계좌 발급 완료 — 입금 안내 화면으로 전환 (페이지 이동 없음)
                    console.log('가상계좌 발급 완료:', result.virtualAccount);
                    sessionStorage.removeItem("pending_order_ids");
                    setVirtualAccount(result.virtualAccount);
                    return;
                }

                // 카드결제 등 즉시 완료된 경우 기존 흐름 그대로
                console.log('결제 성공, 이동 시도:', result);
                sessionStorage.removeItem("pending_order_ids");
                // 완료 페이지에서 간단한 주문 요약을 보여줄 수 있도록 방금 결제된
                // 주문번호(orderNo) 목록을 그대로 넘겨준다 (다건결제 시 여러 건일 수 있음).
                navigate('/payment/ordersuccess', {
                    replace: true,
                    state: { orderNumbers: orderIds },
                });
            })
            .catch((error) => {
                console.error('결제 승인 실패:', error);
                sessionStorage.removeItem("pending_order_ids");
                setConfirmError(error.message ?? '결제 승인에 실패했습니다.');
            });
    }, [orderId, paymentKey, amount, isProcessing, navigate]);

    // 가상계좌 발급 완료 — 입금 안내 화면
    if (virtualAccount) {
        return (
            <div className="max-w-md mx-auto p-8 text-center">
                <h2 className="text-xl font-bold text-slate-900 mb-2">입금 계좌가 발급되었습니다</h2>
                <p className="text-slate-500 mb-6">아래 계좌로 기한 내 입금해주세요.</p>

                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-left space-y-3">
                    <div className="flex justify-between">
                        <span className="text-sm text-slate-500">은행</span>
                        <span className="text-sm font-semibold">
                            {BANK_NAMES[virtualAccount.bankCode] ?? virtualAccount.bankCode}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-slate-500">계좌번호</span>
                        <span className="text-sm font-semibold">{virtualAccount.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-slate-500">예금주</span>
                        <span className="text-sm font-semibold">{virtualAccount.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-slate-500">입금기한</span>
                        <span className="text-sm font-semibold text-red-600">{formatDepositDeadline(virtualAccount.dueDate)}</span>
                    </div>
                </div>

                <p className="text-xs text-slate-400 mt-4">
                    입금 확인은 자동으로 처리되며, 완료 시 주문 상태가 갱신됩니다.
                </p>

                <button
                    onClick={() => navigate('/mypage/orders', { replace: true })}
                    className="mt-6 w-full py-3 bg-slate-900 text-white rounded-lg text-sm font-medium"
                >
                    주문 내역으로 이동
                </button>
            </div>
        );
    }

    if (confirmError) {
        return (
            <div className="max-w-md mx-auto p-8 text-center">
                <h2 className="text-xl font-bold text-red-600 mb-2">결제 승인 실패</h2>
                <p className="text-slate-500">{confirmError}</p>
            </div>
        );
    }
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900">결제가 진행 중입니다...</h2>
        <p className="text-slate-500 mt-2">잠시만 기다려주세요.</p>
      </div>
  );
}