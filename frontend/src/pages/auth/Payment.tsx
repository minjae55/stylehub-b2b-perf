"use client";

import { useState } from "react";

type PaymentMethod = "card" | "bank";

interface OrderSummary {
  label: string;
  amount: number;
  type?: "discount" | "tax" | "default";
}

interface B2BPaymentModalProps {
  orderNumber?: string;
  totalAmount?: number;
  orderItems?: OrderSummary[];
  onClose?: () => void;
  onSuccess?: () => void;
}

const ORDER_ITEMS: OrderSummary[] = [
  { label: "기업용 라이선스 (12개월)", amount: 2000000 },
  { label: "부가세 (10%)", amount: 200000, type: "tax" },
  { label: "할인", amount: -200000, type: "discount" },
];

const BANKS = [
  "국민은행", "신한은행", "우리은행", "하나은행",
  "기업은행", "농협", "카카오뱅크", "토스뱅크",
];

const INSTALLMENTS = ["일시불", "2개월", "3개월", "6개월", "12개월"];

function formatKRW(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(Math.abs(amount));
}

function formatCardNumber(value: string): string {
  return value.replace(/\D/g, "").substring(0, 16)
    .replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").substring(0, 4);
  if (digits.length >= 3) return digits.substring(0, 2) + " / " + digits.substring(2);
  return digits;
}

function formatBizNum(value: string): string {
  const digits = value.replace(/\D/g, "").substring(0, 10);
  if (digits.length >= 7) return digits.substring(0, 3) + "-" + digits.substring(3, 5) + "-" + digits.substring(5);
  if (digits.length >= 4) return digits.substring(0, 3) + "-" + digits.substring(3);
  return digits;
}

export default function B2BPaymentModal({
  orderNumber = "ORD-2026-08814",
  totalAmount = 2400000,
  orderItems = ORDER_ITEMS,
  onClose,
  onSuccess,
}: B2BPaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Card fields
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [installment, setInstallment] = useState("일시불");

  // Bank fields
  const [bank, setBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  // Billing fields
  const [companyName, setCompanyName] = useState("");
  const [bizNumber, setBizNumber] = useState("");
  const [billingEmail, setBillingEmail] = useState("");

  const handlePay = async () => {
    setLoading(true);
    // 실제 PG 연동 로직으로 교체하세요
    await new Promise((res) => setTimeout(res, 1800));
    setLoading(false);
    setSuccess(true);
    onSuccess?.();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <p style={styles.labelSm}>결제 금액</p>
            <p style={styles.totalAmount}>{formatKRW(totalAmount)}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={styles.labelSm}>주문번호</p>
            <p style={styles.orderNum}>{orderNumber}</p>
          </div>
        </div>

        {/* Order summary */}
        <div style={styles.summary}>
          {orderItems.map((item, i) => (
            <div key={i} style={styles.summaryRow}>
              <span style={styles.summaryLabel}>{item.label}</span>
              <span style={{
                ...styles.summaryAmt,
                color: item.type === "discount" ? "#3B6D11" : "inherit",
              }}>
                {item.type === "discount" ? "−" : ""}{formatKRW(item.amount)}
              </span>
            </div>
          ))}
        </div>

        {/* Payment method tabs */}
        <div style={styles.section}>
          <p style={styles.labelSm}>결제 수단</p>
          <div style={styles.tabs}>
            {(["card", "bank"] as PaymentMethod[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setMethod(tab)}
                style={{
                  ...styles.tab,
                  ...(method === tab ? styles.tabActive : styles.tabInactive),
                }}
              >
                {tab === "card" ? "신용/체크카드" : "계좌이체"}
              </button>
            ))}
          </div>

          {/* Card form */}
          {method === "card" && (
            <div style={styles.form}>
              <Field label="카드 번호">
                <input
                  style={styles.input}
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                />
              </Field>
              <div style={styles.row2}>
                <Field label="유효기간">
                  <input
                    style={styles.input}
                    placeholder="MM / YY"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  />
                </Field>
                <Field label="CVC">
                  <input
                    style={styles.input}
                    type="password"
                    placeholder="•••"
                    maxLength={4}
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
                  />
                </Field>
              </div>
              <Field label="카드 소지자명">
                <input
                  style={styles.input}
                  placeholder="홍길동"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                />
              </Field>
              <Field label="할부">
                <select
                  style={styles.input}
                  value={installment}
                  onChange={(e) => setInstallment(e.target.value)}
                >
                  {INSTALLMENTS.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          {/* Bank form */}
          {method === "bank" && (
            <div style={styles.form}>
              <Field label="은행 선택">
                <select
                  style={styles.input}
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                >
                  <option value="">은행을 선택해주세요</option>
                  {BANKS.map((b) => <option key={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="계좌번호">
                <input
                  style={styles.input}
                  placeholder="계좌번호를 입력해주세요"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                />
              </Field>
              <Field label="예금주명">
                <input
                  style={styles.input}
                  placeholder="홍길동"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                />
              </Field>
              <div style={styles.infoBox}>
                <span style={styles.infoIcon}>ℹ️</span>
                <p style={styles.infoText}>
                  계좌이체는 영업일 기준 1~2일 내에 처리됩니다.
                  법인 계좌 사용 시 사업자등록증이 필요할 수 있습니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Billing info */}
        <div style={{ padding: "0 1.5rem 1.25rem" }}>
          <p style={styles.labelSm}>청구 정보</p>
          <div style={styles.form}>
            <div style={styles.row2}>
              <Field label="회사명">
                <input
                  style={styles.input}
                  placeholder="(주)아크미코리아"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </Field>
              <Field label="사업자등록번호">
                <input
                  style={styles.input}
                  placeholder="000-00-00000"
                  value={bizNumber}
                  onChange={(e) => setBizNumber(formatBizNum(e.target.value))}
                />
              </Field>
            </div>
            <Field label="세금계산서 이메일">
              <input
                style={styles.input}
                type="email"
                placeholder="billing@company.com"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* Success message */}
        {success && (
          <div style={styles.successBox}>
            ✅ 결제가 완료되었습니다. 세금계산서가 이메일로 발송됩니다.
          </div>
        )}

        {/* Actions */}
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>취소</button>
          <button
            onClick={handlePay}
            disabled={loading || success}
            style={{ ...styles.payBtn, opacity: loading || success ? 0.7 : 1 }}
          >
            {loading ? "처리 중..." : `${formatKRW(totalAmount)} 결제하기`}
          </button>
        </div>

        {/* Security note */}
        <div style={styles.securityBar}>
          256-bit SSL 암호화로 안전하게 보호됩니다
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "1rem",
  },
  modal: {
    background: "#ffffff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 520,
    boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
    overflow: "hidden",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif",
  },
  header: {
    padding: "1.25rem 1.5rem",
    borderBottom: "0.5px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labelSm: {
    fontSize: 12,
    color: "#6b7280",
    margin: "0 0 2px",
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: 600,
    margin: 0,
    color: "#111827",
  },
  orderNum: {
    fontSize: 13,
    fontWeight: 500,
    margin: 0,
    color: "#111827",
    fontFamily: "monospace",
  },
  summary: {
    padding: "0.875rem 1.5rem",
    background: "#f9fafb",
    borderBottom: "0.5px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
  },
  summaryLabel: { color: "#6b7280" },
  summaryAmt: { color: "#111827" },
  section: { padding: "1.25rem 1.5rem 0" },
  tabs: { display: "flex", gap: 8, marginBottom: "1.25rem", marginTop: 8 },
  tab: {
    flex: 1,
    padding: "10px 0",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all .15s",
    border: "none",
  },
  tabActive: {
    background: "#EFF6FF",
    color: "#185FA5",
    outline: "1.5px solid #378ADD",
  },
  tabInactive: {
    background: "transparent",
    color: "#6b7280",
    outline: "0.5px solid #d1d5db",
  },
  form: { display: "flex", flexDirection: "column", gap: 12, marginBottom: "1.25rem" },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  input: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "9px 12px",
    border: "0.5px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    color: "#111827",
    background: "#fff",
    outline: "none",
  },
  fieldLabel: { fontSize: 12, color: "#6b7280" },
  infoBox: {
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
    background: "#f9fafb",
    borderRadius: 8,
    padding: "10px 12px",
  },
  infoIcon: { fontSize: 14, flexShrink: 0 },
  infoText: { fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.6 },
  footer: {
    padding: "1rem 1.5rem",
    borderTop: "0.5px solid #e5e7eb",
    display: "flex",
    gap: 10,
  },
  cancelBtn: {
    padding: "0 1.25rem",
    height: 44,
    borderRadius: 8,
    fontSize: 14,
    cursor: "pointer",
    background: "transparent",
    border: "0.5px solid #d1d5db",
    color: "#6b7280",
  },
  payBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    background: "#185FA5",
    border: "none",
    color: "#fff",
    transition: "opacity .15s",
  },
  successBox: {
    margin: "0 1.5rem 1rem",
    padding: "12px 14px",
    borderRadius: 8,
    background: "#EAF3DE",
    color: "#3B6D11",
    fontSize: 13,
    border: "0.5px solid #97C459",
  },
  securityBar: {
    padding: "10px 1.5rem",
    background: "#f9fafb",
    borderTop: "0.5px solid #e5e7eb",
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "center" as const,
  },
};
