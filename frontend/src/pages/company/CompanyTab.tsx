import React, {useEffect, useRef, useState} from "react";
import {
    AlertTriangle,
    Building2,
    Camera,
    CheckCircle2,
    Clock,
    ExternalLink,
    FileText,
    Globe,
    Lock,
    X,
    XCircle,
} from "lucide-react";
import {useAuthStore} from "@/store/useAuthStore";
import {CompanyDetail} from "@/api/company/company.types";
import {getCompanyDetail, updateCompanyDetail} from "@/api/company/company.service";
import {uploadFile} from "@/api/auth/auth.service";
import {formatBusinessNumber} from "@/pages/auth/register/shared";

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls =
    "w-full border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white text-foreground font-medium";

const textareaCls =
    "w-full border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white text-foreground font-medium resize-none";

function ReadonlyField({label, value}: { label: string; value: string }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground tracking-wide flex items-center gap-1">
                {label}
                <Lock size={10} className="text-muted-foreground/40"/>
            </label>
            <div
                className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-muted/40 text-muted-foreground border border-border/60 font-medium select-none">
                {value || <span className="text-muted-foreground/40 italic">미입력</span>}
            </div>
        </div>
    );
}

function SellerStatusBadge({status}: { status: CompanyDetail["sellerStatus"] }) {
    const map = {
        NONE: {label: "셀러 미신청", cls: "bg-muted text-muted-foreground border-border", icon: null},
        PENDING: {
            label: "심사 진행 중",
            cls: "bg-amber-50 text-amber-700 border-amber-200 animate-pulse",
            icon: <Clock size={12}/>
        },
        APPROVED: {
            label: "셀러 인증 완료",
            cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
            icon: <CheckCircle2 size={12}/>
        },
        REJECTED: {
            label: "심사 반려 (재신청 필요)",
            cls: "bg-rose-50 text-rose-700 border-rose-200",
            icon: <XCircle size={12}/>
        },
    };
    const {label, cls, icon} = map[status] ?? map.NONE;
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${cls}`}>
            {icon}{label}
        </span>
    );
}

// ── Logo Card ─────────────────────────────────────────────────────────────────

function LogoCard({
                      companyName, logoUrl, sellerStatus, onLogoChange, disabled,
                  }: {
    companyName: string;
    logoUrl: string | null;
    sellerStatus: CompanyDetail["sellerStatus"];
    onLogoChange: (file: File, preview: string) => void;
    disabled: boolean;
}) {
    const logoRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const initials = (companyName || "CO").slice(0, 2);
    const src = preview ?? logoUrl;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || disabled) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target?.result as string;
            setPreview(result);
            onLogoChange(file, result);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div
            className="flex flex-col items-center gap-4 p-6 bg-muted/30 border border-border/50 rounded-2xl text-center">
            <div className="relative group">
                <div
                    onClick={() => !disabled && logoRef.current?.click()}
                    className={`w-28 h-28 rounded-2xl bg-white text-primary font-black text-3xl flex items-center justify-center overflow-hidden border-2 border-border shadow-sm transition-all relative ${
                        disabled ? "cursor-not-allowed" : "cursor-pointer hover:border-primary/40"
                    }`}
                >
                    {src ? <img src={src} alt={companyName} className="w-full h-full object-cover"/> : initials}
                    {!disabled && (
                        <div
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera size={20} className="text-white"/>
                        </div>
                    )}
                </div>
                {!disabled && (
                    <div
                        onClick={() => logoRef.current?.click()}
                        className="absolute -bottom-1 -right-1 bg-white border border-border p-1.5 rounded-full shadow-md cursor-pointer hover:scale-110 transition-transform"
                    >
                        <Camera size={12} className="text-muted-foreground"/>
                    </div>
                )}
            </div>

            <input ref={logoRef} type="file" accept="image/*" className="hidden" disabled={disabled}
                   onChange={handleChange}/>

            <div className="space-y-1.5 flex flex-col items-center">
                <p className="text-sm font-bold text-foreground leading-tight">{companyName || "회사명"}</p>
                <SellerStatusBadge status={sellerStatus}/>
            </div>
        </div>
    );
}

// ── 모달 컴포넌트 추가 ─────────────────────────────────────────────────────────

function LicenseModal({url, onClose}: { url: string; onClose: () => void }) {
    const isPdf = url.endsWith(".pdf") || url.includes("application/pdf");

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <FileText size={14} className="text-primary"/>
                        사업자등록증
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <X size={16}/>
                    </button>
                </div>

                {/* 본문 */}
                <div className="flex-1 overflow-auto p-4">
                    {isPdf ? (
                        <iframe
                            src={url}
                            className="w-full h-[70vh] rounded-lg border border-border"
                        />
                    ) : (
                        <img
                            src={url}
                            alt="사업자등록증"
                            className="w-full object-contain rounded-lg"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CompanyTab() {
    const {user, setUser} = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [showLicenseModal, setShowLicenseModal] = useState(false);

    const [form, setForm] = useState<CompanyDetail>({
        companyName: "",
        businessNumber: "",
        representativeName: "",
        representativePhone: "",
        websiteUrl: "",
        description: "",
        address: "",
        addressDetail: "",
        logoUrl: null,
        businessLicenseUrl: null,
        sellerStatus: "NONE",
    });


    const [original, setOriginal] = useState<Pick<CompanyDetail, "websiteUrl" | "description" | "logoUrl">>({
        websiteUrl: "",
        description: "",
        logoUrl: null,
    });

    const set = (p: Partial<CompanyDetail>) => setForm((f) => ({...f, ...p}));


    useEffect(() => {
        if (!user?.companyId) {
            setLoading(false);
            return;
        }
        (async () => {
            try {
                setLoading(true);
                const data = await getCompanyDetail(user.companyId!);
                setForm(data);
                setOriginal({
                    websiteUrl: data.websiteUrl,
                    description: data.description,
                    logoUrl: data.logoUrl,
                });
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [user?.companyId]);

    const isDirty =
        form.websiteUrl !== original.websiteUrl ||
        (form.description || "") !== (original.description || "") ||
        logoFile !== null;

    const handleSave = async () => {
        if (!user?.companyId || form.sellerStatus === "PENDING") return;
        setSaving(true);
        try {
            let finalLogoUrl = form.logoUrl;
            if (logoFile) finalLogoUrl = await uploadFile(logoFile);

            await updateCompanyDetail(user.companyId, {
                ...form,
                logoUrl: finalLogoUrl,
                businessNumber: form.businessNumber.replace(/\D/g, "")
            });

            set({logoUrl: finalLogoUrl});

            if (user) setUser({...user, companyName: form.companyName, logoUrl: finalLogoUrl});
            setOriginal({
                websiteUrl: form.websiteUrl,
                description: form.description,
                logoUrl: finalLogoUrl,
            });

            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
            setLogoFile(null);
        }
    };

    const isPending = form.sellerStatus === "PENDING";
    const isApproved = form.sellerStatus === "APPROVED";
    const isNone = form.sellerStatus === "NONE";
    const isRejected = form.sellerStatus === "REJECTED";

    const saveLabel =
        saving ? "저장 중..." :
            saved ? "✓ 저장되었습니다" :
                isPending ? "심사 완료 후 수정 가능" :
                    "변경 사항 저장";

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
            <p className="text-xs text-muted-foreground">정보를 불러오는 중...</p>
        </div>
    );

    return (
        <>
            <div className="space-y-7 py-2 text-left">

                {/* ── 헤더 ── */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                        <span className="text-primary"><Building2 size={16}/></span>
                        회사 정보 관리
                    </h2>
                </div>

                {/* ── 상태 안내 배너 ── */}
                {isPending && (
                    <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <Clock size={15} className="text-amber-600 shrink-0 mt-0.5"/>
                        <p className="text-xs text-amber-700 leading-relaxed font-medium">
                            현재 관리자 심사가 진행 중입니다. 심사 중에는 정보를 수정할 수 없습니다.
                        </p>
                    </div>
                )}
                {isRejected && (
                    <div className="flex gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
                        <XCircle size={15} className="text-rose-600 shrink-0 mt-0.5"/>
                        <p className="text-xs text-rose-700 leading-relaxed font-medium">
                            심사가 반려되었습니다. 내용을 수정한 후 다시 신청해 주세요.
                        </p>
                </div>
                )}

                {/* ── 로고 + 고정 정보 ── */}
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                    <LogoCard
                        companyName={form.companyName}
                        logoUrl={form.logoUrl}
                        sellerStatus={form.sellerStatus}
                        disabled={isPending}
                        onLogoChange={(file) => setLogoFile(file)}
                    />

                    {/* 읽기 전용 섹션 */}
                    <div className="flex-1 space-y-3">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                            사업자 기본 정보 <span className="text-muted-foreground/40 font-normal">(변경 불가)</span>
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <ReadonlyField label="회사명" value={form.companyName}/>
                            <ReadonlyField label="사업자등록번호" value={formatBusinessNumber(form.businessNumber)}/>
                            <ReadonlyField label="대표자명" value={form.representativeName}/>
                            <ReadonlyField label="대표 연락처" value={form.representativePhone}/>
                    </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <ReadonlyField label="회사 주소" value={form.address}/>
                            <ReadonlyField label="상세 주소" value={form.addressDetail}/>
                        </div>
                    </div>
                </div>

                {/* ── 수정 가능 섹션 ── */}
                <div className="pt-5 border-t border-dashed border-border/70 space-y-5">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                        수정 가능 정보
                    </p>

                    {/* 웹사이트 */}
                    <div className="space-y-1.5">
                        <label
                            className="text-xs font-bold text-muted-foreground tracking-wide flex items-center gap-1.5">
                            <Globe size={11}/> 웹사이트 URL
                        </label>
                        <input
                            type="url"
                            value={form.websiteUrl || ""}
                            onChange={(e) => set({websiteUrl: e.target.value})}
                            placeholder="https://example.com"
                            disabled={isPending}
                            className={isPending ? "w-full rounded-xl px-3.5 py-2.5 text-sm bg-muted/40 text-muted-foreground border border-border/60 font-medium cursor-not-allowed" : inputCls}
                        />
                    </div>

                    {/* 사업자등록증 */}
                    <div className="space-y-1.5">
                        <label
                            className="text-xs font-bold text-muted-foreground tracking-wide flex items-center gap-1.5">
                            <FileText size={11}/> 사업자등록증
                            <Lock size={10} className="text-muted-foreground/40"/>
                        </label>

                        {form.businessLicenseUrl ? (
                            <button
                                onClick={() => setShowLicenseModal(true)}
                                className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors text-xs font-medium text-foreground/80">
                            <span className="flex items-center gap-2 truncate">
                                <FileText size={13} className="text-primary shrink-0"/>
                                사업자등록증 파일 등록됨
                            </span>
                                <ExternalLink size={12} className="text-muted-foreground/50 shrink-0"/>
                            </button>
                        ) : (
                            <div
                                className="w-full flex items-center justify-center gap-2 px-3.5 py-3.5 rounded-xl border border-dashed border-border text-xs text-muted-foreground/50 font-medium cursor-not-allowed">
                                <FileText size={13}/>
                                등록된 파일 없음
                        </div>
                        )}
                    </div>
                    {/* 회사 소개 */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground tracking-wide">
                            회사 소개
                        </label>
                        <textarea
                            value={form.description || ""}
                            onChange={(e) => set({description: e.target.value})}
                            placeholder="파트너 바이어에게 보여줄 회사 소개를 작성해 보세요."
                            rows={4}
                            maxLength={2000}
                            disabled={isPending}
                            className={isPending ? "w-full rounded-xl px-3.5 py-2.5 text-sm bg-muted/40 text-muted-foreground border border-border/60 font-medium cursor-not-allowed resize-none" : textareaCls}
                        />
                        <p className="text-[11px] text-muted-foreground text-right">
                            {form.description?.length || 0} / 2000
                        </p>
                    </div>
                </div>

                {/* ── 저장 버튼 ── */}
                <div className="pt-2 space-y-3">
                    {isApproved && (
                        <div className="flex gap-2 items-start p-3 bg-amber-50/60 border border-amber-100 rounded-xl">
                            <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5"/>
                            <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                                사업자 기본 정보(회사명, 대표자명 등) 수정이 필요하면 고객센터로 문의해 주세요.
                            </p>
                        </div>
                    )}
                <button
                    onClick={handleSave}
                    disabled={saving || isPending || !isDirty}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-[0.99]"
                >
                    {saving && <span
                        className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                    {saveLabel}
                </button>
                </div>
        </div>
            {showLicenseModal && form.businessLicenseUrl && (
                <LicenseModal
                    url={form.businessLicenseUrl}
                    onClose={() => setShowLicenseModal(false)}
                />
            )}
        </>
    );
}