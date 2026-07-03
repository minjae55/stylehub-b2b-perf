import { useState, type JSX, useRef, useEffect } from "react";
import {
  Plus, MapPin, Pencil, Trash2, CheckCircle,
  X, Search, Star, Package, RotateCcw,
  Building2,
} from "lucide-react";
import { AddressSearchModal, type DaumAddressResult, Field, inputCls } from "@/pages/auth/register/shared";
import { useAuthStore } from "@/store/useAuthStore";
import { UserResponse } from "@/api/auth/auth.types";
import {
  getCompanyAddresses,
  getAddressDefaults,
  createAddress,
  updateAddress,
  deleteAddress,
  updateDefaultAddress
} from "@/api/user/user.service";

interface CompanyDefaults { returnAddressId: number | null; }
interface UserDefaults    { shippingAddressId: number | null; receivingAddressId: number | null; }
type DefaultType          = "return" | "shipping" | "receiving";
type BusinessRole         = UserResponse["businessRole"];
type UserRole             = UserResponse["role"];

const DEFAULT_META: Record<DefaultType, {
  label: string; icon: JSX.Element; color: string; bg: string; border: string; desc: string;
}> = {
  return: {
    label: "기본 반품지", desc: "회사 공통 반품지 (셀러 대표 전용)",
    icon: <RotateCcw size={11} />,
    color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200",
  },
  shipping: {
    label: "내 기본 출고지", desc: "내 출고 기본값 (셀러/BOTH 전용)",
    icon: <Package size={11} />,
    color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200",
  },
  receiving: {
    label: "내 기본 수령지", desc: "내 수령 기본값 (바이어/BOTH 전용)",
    icon: <Star size={11} />,
    color: "text-primary", bg: "bg-primary/5", border: "border-primary/20",
  },
};

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

interface AddressFormData { addressName: string; zipcode: string; address: string; addressDetail: string; }
const EMPTY_FORM: AddressFormData = { addressName: "", zipcode: "", address: "", addressDetail: "" };

function AddressForm({ initial, onSave, onCancel }: { initial?: AddressFormData; onSave: (data: AddressFormData) => void; onCancel: () => void; }) {
  const [form, setForm] = useState<AddressFormData>(initial ?? EMPTY_FORM);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const detailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setForm(initial ?? EMPTY_FORM); }, [initial]);
  const set = (p: Partial<AddressFormData>) => setForm((f) => ({ ...f, ...p }));

  const handleAddressComplete = (data: DaumAddressResult) => {
    set({ zipcode: data.zonecode, address: data.roadAddress, addressDetail: "" });
    setAddressModalOpen(false);
    setTimeout(() => detailInputRef.current?.focus(), 100);
  };

  const isValid = form.addressName.trim() && form.zipcode.trim() && form.address.trim();

  return (
      <div className="border border-primary/30 bg-primary/[0.03] rounded-lg p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">{initial ? "주소 수정" : "새 주소 추가"}</h3>
          </div>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
        </div>

        <div className="space-y-3">
          <Field label="주소 이름" required>
            <input type="text" value={form.addressName} onChange={(e) => set({ addressName: e.target.value })} placeholder="본사 / 김포창고 / 부산센터" className={inputCls} />
          </Field>
          <Field label="주소 검색" required>
            <div className="flex gap-2 mb-2">
              <input
                  type="text"
                  value={form.zipcode}
                  readOnly
                  onClick={() => setAddressModalOpen(true)}
                  placeholder="우편번호"
                  className={`${inputCls} max-w-[140px] bg-gray-50 text-muted-foreground cursor-pointer`}
              />
              <button
                  type="button"
                  onClick={() => setAddressModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-border rounded text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
              >
                <Search size={13} />우편번호 검색
              </button>
            </div>

            <input
                type="text"
                value={form.address}
                readOnly
                onClick={() => setAddressModalOpen(true)}
                placeholder="우편번호 검색 버튼을 눌러 주소를 입력해 주세요."
                className={`${inputCls} mb-2 bg-gray-50 text-muted-foreground cursor-pointer`}
            />

            <input
                type="text"
                ref={detailInputRef}
                value={form.addressDetail}
                onChange={(e) => set({ addressDetail: e.target.value })}
                placeholder="상세 주소 입력 (동, 호수, 층 등)"
                className={inputCls}
            />
          </Field>
        </div>

        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onCancel} className="flex-1 py-2.5 border border-border rounded text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">취소</button>
          <button type="button" onClick={() => isValid && onSave(form)} disabled={!isValid} className="flex-1 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white rounded text-sm font-semibold transition-colors">{initial ? "수정 완료" : "주소 추가"}</button>
        </div>
        <AddressSearchModal open={addressModalOpen} onClose={() => setAddressModalOpen(false)} onComplete={handleAddressComplete} />
      </div>
  );
}

// ── Address Card ──────────────────────────────────────────────────────────────

type SingleAddress = Awaited<ReturnType<typeof getCompanyAddresses>>[number];

function AddressCard({
                       addr, companyDefaults, userDefaults, onEdit, onDelete, onSetDefault,
                       canManage, allowableDefaultActions
                     }: {
  addr: SingleAddress; companyDefaults: CompanyDefaults; userDefaults: UserDefaults;
  onEdit: (addr: SingleAddress) => void; onDelete: (id: number) => void; onSetDefault: (id: number, type: DefaultType) => void;
  canManage: boolean; allowableDefaultActions: { type: DefaultType; label: string }[];
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
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 size={15} className="text-primary shrink-0 mt-0.5" />
            <span className="font-semibold text-sm text-foreground truncate">{addr.addressName}</span>
          </div>
          {canManage && (
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onEdit(addr)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded transition-colors" title="수정"><Pencil size={13} /></button>
                <button onClick={() => onDelete(addr.addressId)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="삭제"><Trash2 size={13} /></button>
              </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground leading-relaxed">
          <span className="text-foreground/60 mr-1">[{addr.zipcode}]</span>{addr.address}
          {addr.addressDetail && <span className="block text-muted-foreground mt-0.5 pl-0">{addr.addressDetail}</span>}
        </div>

        {activeBadges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {activeBadges.map((type) => <DefaultBadge key={type} type={type} />)}
            </div>
        )}

        {allowableDefaultActions.length > 0 && (
            <div className="border-t border-border/60 pt-2.5 flex flex-wrap gap-1.5">
              {allowableDefaultActions.map(({ type, label }) => {
                const isActive =
                    type === "return" ? isReturnDefault :
                        type === "shipping" ? isShippingDefault : isReceivingDefault;

                return (
                    <button
                        key={type}
                        onClick={() => !isActive && onSetDefault(addr.addressId, type)}
                        disabled={isActive}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded border transition-colors ${
                            isActive
                                ? `${DEFAULT_META[type].color} ${DEFAULT_META[type].bg} ${DEFAULT_META[type].border} cursor-default`
                                : "text-muted-foreground border-border hover:border-primary/40 hover:text-primary bg-white"
                        }`}
                    >
                      {isActive ? "✓ " : ""}{label}
                    </button>
                );
              })}
            </div>
        )}
      </div>
  );
}

// ── Defaults Summary ─────────────────────────────────────────────────────────

function DefaultsSummary({ addresses, companyDefaults, userDefaults }: { addresses: SingleAddress[]; companyDefaults: CompanyDefaults; userDefaults: UserDefaults; }) {
  const find = (id: number | null) => id != null ? addresses.find((a) => a.addressId === id) : null;
  const returnAddr   = find(companyDefaults.returnAddressId);
  const shippingAddr = find(userDefaults.shippingAddressId);
  const receivingAddr = find(userDefaults.receivingAddressId);

  const rows: { type: DefaultType; addr: SingleAddress | null | undefined }[] = [
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
                  <span className={`inline-flex items-center gap-1 font-medium w-[88px] shrink-0 ${m.color}`}>{m.icon}{m.label}</span>
                  <span className="text-muted-foreground">·</span>
                  {addr ? (
                      <span className="text-foreground font-medium">{addr.addressName}<span className="text-muted-foreground font-normal ml-1.5">{addr.address}</span></span>
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

export function AddressesTab() {
  const user = useAuthStore(state => state.user);

  const currentUser = {
    businessRole: user?.businessRole as BusinessRole,
    role: user?.role as UserRole
  };

  // 🔍 치트키: getCompanyAddresses 서비스 함수를 토대로 주소 배열 타입을 자동 추론합니다.
  const [addresses, setAddresses]             = useState<Awaited<ReturnType<typeof getCompanyAddresses>>>([]);
  const [companyDefaults, setCompanyDefaults] = useState<CompanyDefaults>({ returnAddressId: null });
  const [userDefaults, setUserDefaults]       = useState<UserDefaults>({ shippingAddressId: null, receivingAddressId: null });

  // 수정 폼 제어용 타입 역시 자동 추론된 배열의 0번째 요소를 기반으로 유연하게 결합합니다.
  const [formMode, setFormMode] = useState<null | "new" | typeof addresses[0]>(null);
  const [toast, setToast]       = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // ── 🌐 컴포넌트 로드 시 실제 API 호출 데이터 동기화 ────────────────────────
  useEffect(() => {
    const initFetch = async () => {
      try {
        const addrData = await getCompanyAddresses();
        setAddresses(addrData);

        const defaultData = await getAddressDefaults();
        setCompanyDefaults({ returnAddressId: defaultData.company.returnAddressId });
        setUserDefaults({
          shippingAddressId: defaultData.user.shippingAddressId,
          receivingAddressId: defaultData.user.receivingAddressId
        });
      } catch (err: any) {
        showToast(err.message || "주소록 데이터를 가져오는 데 실패했습니다.");
      }
    };
    initFetch();
  }, []);

  // ── 권한 계산기 ──────────────────────────────────────────────────────────
  const canManage = currentUser.role === "PRESIDENT" || currentUser.role === "ADMIN";
  const isSellerLine = currentUser.businessRole === "SELLER" || currentUser.businessRole === "BOTH";
  const isBuyerLine = currentUser.businessRole === "BUYER" || currentUser.businessRole === "BOTH";
  const isSellerPresident = isSellerLine && currentUser.role === "PRESIDENT";

  const allowableDefaultActions: { type: DefaultType; label: string }[] = [];
  if (isSellerPresident) allowableDefaultActions.push({ type: "return", label: "회사 반품지로 설정" });
  if (isSellerLine) allowableDefaultActions.push({ type: "shipping", label: "내 출고지로 설정" });
  if (isBuyerLine) allowableDefaultActions.push({ type: "receiving", label: "내 수령지로 설정" });

  // ── 실제 백엔드 연단 CRUD 핸들러 ───────────────────────────────────────

  const handleSave = async (data: AddressFormData) => {
    if (!canManage) return;
    try {
      if (formMode === "new") {
        const newAddress = await createAddress(data);
        setAddresses((prev) => [...prev, newAddress]);
        showToast("주소를 추가했습니다.");
      } else if (formMode) {
        const updatedAddress = await updateAddress(formMode.addressId, data);
        setAddresses((prev) => prev.map((a) => a.addressId === formMode.addressId ? updatedAddress : a));
        showToast("주소를 수정했습니다.");
      }
      setFormMode(null);
    } catch (err: any) {
      showToast(err.message || "주소 저장에 실패했습니다.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!canManage) return;
    if (!confirm("정말 이 주소를 삭제하시겠습니까?")) return;

    try {
      await deleteAddress(id);

      setAddresses((prev) => prev.filter((a) => a.addressId !== id));
      setCompanyDefaults((prev) => ({ returnAddressId: prev.returnAddressId === id ? null : prev.returnAddressId }));
      setUserDefaults((prev) => ({
        shippingAddressId:  prev.shippingAddressId  === id ? null : prev.shippingAddressId,
        receivingAddressId: prev.receivingAddressId === id ? null : prev.receivingAddressId,
      }));
      showToast("주소를 삭제했습니다.");
    } catch (err: any) {
      showToast(err.message || "삭제 처리에 실패했습니다.");
    }
  };

  const handleSetDefault = async (id: number, type: DefaultType) => {
    if (type === "return" && !isSellerPresident) return;
    if (type === "shipping" && !isSellerLine) return;
    if (type === "receiving" && !isBuyerLine) return;

    try {
      await updateDefaultAddress({ addressId: id, defaultType: type });

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
    } catch (err: any) {
      showToast(err.message || "기본지 설정 변경에 실패했습니다.");
    }
  };

  const editInitial = formMode && formMode !== "new" ? { addressName: formMode.addressName, zipcode: formMode.zipcode, address: formMode.address, addressDetail: formMode.addressDetail } : undefined;

  return (
      <>
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-muted-foreground">회사 공용 주소록을 관리하고 기본 주소를 설정하세요.</p>

          {canManage && (
              <button
                  onClick={() => setFormMode("new")}
                  disabled={formMode !== null}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                <Plus size={15} /> 주소 추가
              </button>
          )}
        </div>

        <DefaultsSummary addresses={addresses} companyDefaults={companyDefaults} userDefaults={userDefaults} />

        {formMode !== null && <AddressForm initial={editInitial} onSave={handleSave} onCancel={() => setFormMode(null)} />}

        {addresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg">
              <MapPin size={28} className="text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">등록된 주소가 없습니다.</p>
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
                      canManage={canManage}
                      allowableDefaultActions={allowableDefaultActions}
                  />
              ))}
            </div>
        )}

        <div className="toast-zone">{toast && <Toast message={toast} />}</div>
      </>
  );
}