import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import axios, { AxiosResponse } from 'axios';

interface PaymentConfirmRequest {
  orderId: string | null;
  paymentKey: string | null;
  amount: string | null;
}

interface PaymentConfirmResponse {
  [key: string]: unknown;
}

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const orderId: string | null = searchParams.get('orderId');
  const paymentKey: string | null = searchParams.get('paymentKey');
  const amount: string | null = searchParams.get('amount');

  useEffect(() => {
    if (orderId && paymentKey && amount) {
      const paymentData = { 
      orderId: orderId, 
      paymentKey: paymentKey, 
      amount: Number(amount) // 👈 기존 문자열 "5000"을 숫자 5000으로 변환하여 매핑!
    };
      console.log("결제 데이터 승인 요청:", paymentData);
      // 여기에 백엔드 axios 요청 등을 작성하시면 됩니다.// axios.post('/api/v1/payments/confirm', { orderId, paymentKey, amount }) ...
      axios.post<PaymentConfirmResponse>('/api/v1/payments/confirm', paymentData)
        .then((response: AxiosResponse<PaymentConfirmResponse>) => {
          console.log("결제 승인 성공:", response.data);
          // 결제 성공 후 처리 로직 (예: 결제 완료 페이지로 이동)
        })
        .catch((error: unknown) => {
          console.error("결제 승인 실패:", error);
          // 결제 실패 처리 로직 (예: 오류 메시지 표시)
        });
    }
  }, [orderId, paymentKey, amount, isProcessing]);

  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-bold text-slate-900">결제가 진행 중입니다...</h2>
      <p className="text-slate-500 mt-2">잠시만 기다려주세요.</p>
    </div>
  );
}