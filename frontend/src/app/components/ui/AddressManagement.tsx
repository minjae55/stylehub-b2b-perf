import { useState, type JSX } from "react";
import {
  Plus, MapPin, Pencil, Trash2, CheckCircle,
  X, Search, Star, Package, RotateCcw, AlertCircle,
  Building2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

/** DB: addresses 테이블 */
interface Address {
  addressId: number;
  companyId: number;
  addressName: string;       // 본사 / 김포창고 / 부산센터 등
  zipcode: string;
  address: string;
  addressDetail: string;
  createdAt: string;
  deletedAt: string | null;
}

/** DB: companies.default_return_address_id */
type CompanyDefaults = {
  returnAddressId: number | null;
};

/** DB: users.default_shipping_address_id + default_receiving_address_id */
type UserDefaults = {
  shippingAddressId: number | null;
  receivingAddressId: number | null;
};

type DefaultType = "return" | "shipping" | "receiving";

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_META: Record<DefaultType, {
  label: string; icon: JSX.Element; color: string; bg: string; border: string;
  desc: string;
}> = {
  return: {
    label: "기본 반품지", desc: "회사 공통 반품지",
    icon: <RotateCcw size={11} />,
    color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200",
  },
  shipping: {
    label: "내 기본 출고지", desc: "내 출고 기본값",
    icon: <Package size={11} />,
    color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200",
  },
  receiving: {
    label: "내 기본 수령지", desc: "내 수령 기본값",
    icon: <Star size={11} />,
    color: "text-primary", bg: "bg-primary/5", border: "border-primary/20",
  },
};

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_ADDRESSES: Address[] = [
  {
    addressId: 1, companyId: 1,
    addressName: "본사",
    zipcode: "04538",
    address: "서울특별시 중구 을지로 123",
    addressDetail: "패션빌딩 5층",
    createdAt: "2024.01.15", deletedAt: null,
  },
  {
    addressId: 2, companyId: 1,
    addressName: "김포 물류창고",
    zipcode: "10003",
    address: "경기도 김포시 양촌읍 물류로 456",
    addressDetail: "A동 3층",
    createdAt: "2024.03.02", deletedAt: null,
  },
  {
    addressId: 3, companyId: 1,
    addressName: "부산 센터",
    zipcode: "48058",
    address: "부산광역시 해운대구 센터로 789",
    addressDetail: "2층",
    createdAt: "2024.06.10", deletedAt: null,
  },
];

const MOCK_COMPANY_DEFAULTS: CompanyDefaults = { returnAddressId: 2 };
const MOCK_USER_DEFAULTS: UserDefaults = { shippingAddressId: 2, receivingAddressId: 1 };

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls =
  "w-full border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors bg-white";

function Field({
  label, required, hint, children,
}: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#333] mb-1.5">
        {label}
        {required && <span className="text-primary ml-1 text-xs">(필수)</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function DefaultBadge({ type }: { type: DefaultType }) {
  const m = DEFAULT_META[type];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border ${m.color} ${m.bg} ${m.border}`}>
      {m.icon}{m.label}
    </span>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background text-sm font-medium px-5 py-3 rounded-full shadow-lg flex items-center gap-2">
      <CheckCircle size={15} className="text-emerald-400" />
      {message}
    </div>
  );
}

// ── Address Form (add / edit) ─────────────────────────────────────────────────

interface AddressFormData {
  addressName: string;
  zipcode: string;
  address: string;
  addressDetail: string;
}

const EMPTY_FORM: AddressFormData = {
  addressName: "", zipcode: "", address: "", addressDetail: "",
};

function AddressForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: AddressFormData;
  onSave: (data: AddressFormData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<AddressFormData>(initial ?? EMPTY_FORM);
  const [searching, setSearching] = useState(false);
  const set = (p: Partial<AddressFormData>) => setForm((f) => ({ ...f, ...p }));

  const handleZipSearch = () => {
    if (!form.zipcode.trim()) return;
    setSearching(true);
    // TODO: 실제 도로명주소 API 연동 (카카오 주소 API 등)
    setTimeout(() => {
      set({ address: "서울특별시 중구 을지로 123" });
      setSearching(false);
    }, 600);
  };

  const isValid = form.addressName.trim() && form.address.trim();

  return (
    <div className="border border-primary/30 bg-primary/[0.03] rounded-lg p-5 mb-5">
      {/* Form header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin size={15} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {initial ? "주소 수정" : "새 주소 추가"}
          </h3>
        </div>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-3">
        {/* Address name */}
        <Field label="주소 이름" required hint="팀원들이 알아보기 쉬운 이름으로 입력해 주세요. (예: 본사, 김포창고)">
          <input
            type="text"
            value={form.addressName}
            onChange={(e) => set({ addressName: e.target.value })}
            placeholder="본사 / 김포창고 / 부산센터"
            className={inputCls}
          />
        </Field>

        {/* Zipcode + search */}
        <Field label="우편번호">
          <div className="flex gap-2">
            <input
              type="text"
              value={form.zipcode}
              onChange={(e) => set({ zipcode: e.target.value })}
              placeholder="12345"
              maxLength={6}
              className={`${inputCls} max-w-[140px]`}
            />
            <button
              type="button"
              onClick={handleZipSearch}
              disabled={searching || !form.zipcode.trim()}
              className="flex items-center gap-1.5 px-3 py-2.5 border border-border rounded text-sm font-medium text-foreground hover:border-primary hover:text-primary disabled:opacity-40 transition-colors whitespace-nowrap bg-white"
            >
              <Search size={13} />
              {searching ? "검색 중..." : "주소 검색"}
            </button>
          </div>
        </Field>

        {/* Address */}
        <Field label="기본 주소" required>
          <input
            type="text"
            value={form.address}
            onChange={(e) => set({ address: e.target.value })}
            placeholder="도로명 주소"
            className={`${inputCls} mb-2`}
          />
          <input
            type="text"
            value={form.addressDetail}
            onChange={(e) => set({ addressDetail: e.target.value })}
            placeholder="상세 주소 (동/호수 등)"
            className={inputCls}
          />
        </Field>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 border border-border rounded text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          취소
        </button>
        <button
          type="button"
          onClick={() => isValid && onSave(form)}
          disabled={!isValid}
          className="flex-1 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white rounded text-sm font-semibold transition-colors"
        >
          {initial ? "수정 완료" : "주소 추가"}
        </button>
      </div>
    </div>
  );
}

// ── Address Card ──────────────────────────────────────────────────────────────

function AddressCard({
  addr,
  companyDefaults,
  userDefaults,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  addr: Address;
  companyDefaults: CompanyDefaults;
  userDefaults: UserDefaults;
  onEdit: (addr: Address) => void;
  onDelete: (id: number) => void;
  onSetDefault: (id: number, type: DefaultType) => void;
}) {
  const isReturnDefault   = companyDefaults.returnAddressId   === addr.addressId;
  const isShippingDefault = userDefaults.shippingAddressId   === addr.addressId;
  const isReceivingDefault = userDefaults.receivingAddressId === addr.addressId;

  const activeBadges: DefaultType[] = [
    ...(isReturnDefault    ? (["return"]    as DefaultType[]) : []),
    ...(isShippingDefault  ? (["shipping"]  as DefaultType[]) : []),
    ...(isReceivingDefault ? (["receiving"] as DefaultType[]) : []),
  ];

  return (
    <div className="bg-white border border-border rounded-lg p-4 flex flex-col gap-3 hover:border-primary/30 transition-colors">
      {/* Name row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 size={15} className="text-primary shrink-0 mt-0.5" />
          <span className="font-semibold text-sm text-foreground truncate">{addr.addressName}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(addr)}
            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded transition-colors"
            title="수정"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(addr.addressId)}
            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            title="삭제"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Address */}
      <div className="text-xs text-muted-foreground leading-relaxed">
        <span className="text-foreground/60 mr-1">[{addr.zipcode}]</span>
        {addr.address}
        {addr.addressDetail && (
          <span className="block text-muted-foreground mt-0.5 pl-0">{addr.addressDetail}</span>
        )}
      </div>

      {/* Default badges */}
      {activeBadges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeBadges.map((type) => (
            <DefaultBadge key={type} type={type} />
          ))}
        </div>
      )}

      {/* Set default actions */}
      <div className="border-t border-border/60 pt-2.5 flex flex-wrap gap-1.5">
        {(
          [
            { type: "return"    as DefaultType, active: isReturnDefault,   label: "반품지로 설정" },
            { type: "shipping"  as DefaultType, active: isShippingDefault,  label: "내 출고지로 설정" },
            { type: "receiving" as DefaultType, active: isReceivingDefault, label: "내 수령지로 설정" },
          ] as { type: DefaultType; active: boolean; label: string }[]
        ).map(({ type, active, label }) => (
          <button
            key={type}
            onClick={() => !active && onSetDefault(addr.addressId, type)}
            disabled={active}
            className={`text-[11px] font-medium px-2.5 py-1 rounded border transition-colors ${
              active
                ? `${DEFAULT_META[type].color} ${DEFAULT_META[type].bg} ${DEFAULT_META[type].border} cursor-default`
                : "text-muted-foreground border-border hover:border-primary/40 hover:text-primary bg-white"
            }`}
          >
            {active ? "✓ " : ""}{label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Defaults Summary ─────────────────────────────────────────────────────────

function DefaultsSummary({
  addresses,
  companyDefaults,
  userDefaults,
}: {
  addresses: Address[];
  companyDefaults: CompanyDefaults;
  userDefaults: UserDefaults;
}) {
  const find = (id: number | null) =>
    id != null ? addresses.find((a) => a.addressId === id) : null;

  const returnAddr   = find(companyDefaults.returnAddressId);
  const shippingAddr = find(userDefaults.shippingAddressId);
  const receivingAddr = find(userDefaults.receivingAddressId);

  const rows: { type: DefaultType; addr: Address | null | undefined }[] = [
    { type: "return",   addr: returnAddr },
    { type: "shipping",  addr: shippingAddr },
    { type: "receiving", addr: receivingAddr },
  ];

  return (
    <div className="bg-muted/30 border border-border rounded-lg p-4 mb-5">
      <p className="text-xs font-semibold text-foreground mb-3">현재 기본 주소 설정</p>
      <div className="space-y-2">
        {rows.map(({ type, addr }) => {
          const m = DEFAULT_META[type];
          return (
            <div key={type} className="flex items-center gap-2 text-xs">
              <span className={`inline-flex items-center gap-1 font-medium w-[88px] shrink-0 ${m.color}`}>
                {m.icon}{m.label}
              </span>
              <span className="text-muted-foreground">·</span>
              {addr ? (
                <span className="text-foreground font-medium">
                  {addr.addressName}
                  <span className="text-muted-foreground font-normal ml-1.5">
                    {addr.address}
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground italic">설정된 주소 없음</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export function AddressManagement() {
  const [addresses, setAddresses]           = useState<Address[]>(MOCK_ADDRESSES);
  const [companyDefaults, setCompanyDefaults] = useState<CompanyDefaults>(MOCK_COMPANY_DEFAULTS);
  const [userDefaults, setUserDefaults]       = useState<UserDefaults>(MOCK_USER_DEFAULTS);

  // form state: null = hidden, "new" = add mode, Address = edit mode
  const [formMode, setFormMode] = useState<null | "new" | Address>(null);
  const [toast, setToast]       = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ── CRUD handlers ────────────────────────────────────────────────────────

  const handleSave = (data: AddressFormData) => {
    if (formMode === "new") {
      const next: Address = {
        addressId: Date.now(),
        companyId: 1,
        ...data,
        createdAt: new Date().toLocaleDateString("ko-KR"),
        deletedAt: null,
      };
      setAddresses((prev) => [...prev, next]);
      showToast("주소를 추가했습니다.");
    } else if (formMode && formMode !== "new") {
      setAddresses((prev) =>
        prev.map((a) => a.addressId === formMode.addressId ? { ...a, ...data } : a),
      );
      showToast("주소를 수정했습니다.");
    }
    setFormMode(null);
  };

  const handleDelete = (id: number) => {
    // soft delete — in real usage: PATCH /addresses/:id { deletedAt: now }
    setAddresses((prev) => prev.filter((a) => a.addressId !== id));
    // clear any defaults that pointed to this address
    setCompanyDefaults((prev) => ({
      returnAddressId: prev.returnAddressId === id ? null : prev.returnAddressId,
    }));
    setUserDefaults((prev) => ({
      shippingAddressId:  prev.shippingAddressId  === id ? null : prev.shippingAddressId,
      receivingAddressId: prev.receivingAddressId === id ? null : prev.receivingAddressId,
    }));
    showToast("주소를 삭제했습니다.");
  };

  const handleSetDefault = (id: number, type: DefaultType) => {
    if (type === "return") {
      setCompanyDefaults({ returnAddressId: id });
      showToast("기본 반품지를 변경했습니다.");
    } else if (type === "shipping") {
      setUserDefaults((prev) => ({ ...prev, shippingAddressId: id }));
      showToast("내 기본 출고지를 변경했습니다.");
    } else {
      setUserDefaults((prev) => ({ ...prev, receivingAddressId: id }));
      showToast("내 기본 수령지를 변경했습니다.");
    }
  };

  const editInitial =
    formMode && formMode !== "new"
      ? {
          addressName: formMode.addressName,
          zipcode: formMode.zipcode,
          address: formMode.address,
          addressDetail: formMode.addressDetail,
        }
      : undefined;

  return (
    <>
      {/* Sub-header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground">
          회사 공용 주소록을 관리하고 기본 주소를 설정하세요.
        </p>
        <button
          onClick={() => setFormMode("new")}
          disabled={formMode !== null}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus size={15} /> 주소 추가
        </button>
      </div>

      {/* Current defaults summary */}
      <DefaultsSummary
        addresses={addresses}
        companyDefaults={companyDefaults}
        userDefaults={userDefaults}
      />

      {/* Add / Edit inline form */}
      {formMode !== null && (
        <AddressForm
          initial={editInitial}
          onSave={handleSave}
          onCancel={() => setFormMode(null)}
        />
      )}

      {/* Address grid */}
      {addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg">
          <MapPin size={28} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">등록된 주소가 없습니다.</p>
          <p className="text-xs text-muted-foreground mt-1">주소 추가 버튼을 눌러 첫 번째 주소를 등록해 주세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.addressId}
              addr={addr}
              companyDefaults={companyDefaults}
              userDefaults={userDefaults}
              onEdit={(a) => setFormMode(a)}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      {/* Default type legend */}
      <div className="mt-6 flex flex-wrap gap-3">
        {(Object.entries(DEFAULT_META) as [DefaultType, typeof DEFAULT_META[DefaultType]][]).map(([type, m]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <DefaultBadge type={type} />
            <span>— {m.desc}</span>
          </div>
        ))}
      </div>

      {toast && <Toast message={toast} />}
    </>
  );
}
