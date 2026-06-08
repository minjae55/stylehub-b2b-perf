import { Link } from "react-router";
import { Shield, FileText, Truck, DollarSign, Users, ShoppingBag, ArrowRight, Package } from "lucide-react";

export function AdminDashboard() {
  const adminMenus = [
    {
      title: "소싱 요청서 관리",
      description: "바이어가 제출한 제품 소싱 요청서를 조회하고 견적을 발송합니다",
      icon: <FileText size={32} />,
      path: "/admin/sourcing-requests",
      color: "from-blue-600 to-blue-700",
      stats: { label: "신규 요청", value: "3건" },
    },
    {
      title: "운임 견적 요청 관리",
      description: "바이어가 제출한 배송 운임 견적 요청을 조회하고 처리합니다",
      icon: <Truck size={32} />,
      path: "/admin/shipping-quotes",
      color: "from-green-600 to-green-700",
      stats: { label: "신규 요청", value: "2건" },
    },
    {
      title: "창고 검수 입력",
      description: "창고에 도착한 제품의 실제 수량과 상태를 검수하고 사진을 업로드합니다",
      icon: <Package size={32} />,
      path: "/admin/inspection?orderId=ORD-2024-001",
      color: "from-orange-600 to-orange-700",
      stats: { label: "검수 대기", value: "4건" },
    },
    {
      title: "결제 및 거래 현황",
      description: "플랫폼 전체 결제 내역, 바이어/셀러 통계를 확인합니다",
      icon: <DollarSign size={32} />,
      path: "/admin/analytics",
      color: "from-purple-600 to-purple-700",
      stats: { label: "이번 달 결제", value: "$142,500" },
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8 font-[Inter,sans-serif]">
      {/* Admin Header */}
      

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-border rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2.5 rounded">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground font-mono">5</div>
              <div className="text-xs text-muted-foreground">소싱 요청 (신규)</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-border rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-2.5 rounded">
              <Truck size={20} className="text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground font-mono">3</div>
              <div className="text-xs text-muted-foreground">운임 견적 (신규)</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-border rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 p-2.5 rounded">
              <Users size={20} className="text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground font-mono">284</div>
              <div className="text-xs text-muted-foreground">총 바이어</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-border rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 p-2.5 rounded">
              <ShoppingBag size={20} className="text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground font-mono">142</div>
              <div className="text-xs text-muted-foreground">총 셀러</div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-2 gap-6">
        {adminMenus.map((menu) => (
          <Link
            key={menu.path}
            to={menu.path}
            className="group bg-white border-2 border-border hover:border-primary rounded-lg overflow-hidden transition-all hover:shadow-lg"
          >
            <div className={`bg-gradient-to-r ${menu.color} text-white p-6`}>
              <div className="flex items-center justify-between mb-3">
                <div>{menu.icon}</div>
                <ArrowRight size={24} className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
              <h2 className="text-xl font-bold mb-2">{menu.title}</h2>
              <p className="text-sm text-white/80">{menu.description}</p>
            </div>
            <div className="p-5 flex items-center justify-between bg-muted/30">
              <span className="text-sm text-muted-foreground">{menu.stats.label}</span>
              <span className="text-lg font-bold text-primary font-mono">{menu.stats.value}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
