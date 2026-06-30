import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import axios, { AxiosResponse } from 'axios';

interface PaymentConfirmResponse {
  [key: string]: unknown;
}

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 무한 루프 방지를 위한 상태 관리 플래그
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const orderId = searchParams.get('orderId');
  const paymentKey = searchParams.get('paymentKey');
  const amount = searchParams.get('amount');

    useEffect(() => {
        if (!orderId || !paymentKey || !amount || isProcessing) return;

        setIsProcessing(true);
        const storedIds = sessionStorage.getItem("pending_order_ids");
        const orderIds = storedIds ? JSON.parse(storedIds) : null;

        axios.post('/api/v1/payments/confirm', {
            orderId,
            paymentKey,
            amount: Number(amount),
            orderIds
        })
            .then((response) => {
                console.log('결제 성공, 이동 시도:', response);
                sessionStorage.removeItem("pending_order_ids");
                navigate('/payment/ordersuccess', { replace: true });
                console.log('navigate 호출 완료');
            })
            .catch((error) => {
                console.error('결제 승인 실패:', error);
                sessionStorage.removeItem("pending_order_ids");
                // 실패 시 존재하는 경로로 이동 (예: 장바구니나 에러 페이지)
                navigate('/cart', { replace: true });
            });
    }, [orderId, paymentKey, amount, isProcessing, navigate]);

  return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900">결제가 진행 중입니다...</h2>
        <p className="text-slate-500 mt-2">잠시만 기다려주세요.</p>
      </div>
  );
}