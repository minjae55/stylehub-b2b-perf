import React, { useState } from 'react';
import { 
  MessageSquare, 
  AlertTriangle, 
  Bell, 
  HelpCircle, 
  Search, 
  ChevronRight,
  CheckCircle,
  Clock
} from 'lucide-react';
import {Inquiry} from "@/pages/support/Inquiry";


export default function SupportManagement() {
  const [activeMenu, setActiveMenu] = useState('inquiry'); // inquiry: 1:1문의, notice: 공지사항, faq: FAQ
  const [searchTerm, setSearchTerm] = useState('');

  // 1:1 문의 가상 데이터
  const [inquiries, setInquiries] = useState([
    { id: 'IQ-102', user: '(주)에이비씨 (바이어)', title: '포트원 결제 중 에러가 발생합니다.', date: '2026.06.10', status: '대기' },
    { id: 'IQ-101', user: '김파트너 (공급사)', title: '정산 계좌 정보를 변경하고 싶습니다.', date: '2026.06.09', status: '완료' },
    { id: 'IQ-100', user: '하이픈무역 (바이어)', title: '소싱 요청서 수정이 안 됩니다.', date: '2026.06.08', status: '대기' },
  ]);

  return (
    // 💡 핵심: h-screen과 flex flex-col을 주어 전체 화면 높이를 완벽히 제어합니다.
    <div className="w-full h-screen bg-slate-50 text-foreground flex flex-col overflow-hidden">
      
      {/* 고정된 헤더 영역 (p-6 유지) */}
      <div className="p-6 pb-2 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">고객지원 및 운영 관리</h1>
        <p className="text-sm text-muted-foreground mt-1">사용자 문의 응대 및 서비스 공지사항을 관리합니다.</p>
      </div>

      {/* 💡 메인 본문 영역: 수직으로 남은 화면을 꽉 채우고 내부 스크롤을 지원합니다. */}
      <div className="flex-1 p-6 pt-2 grid grid-cols-4 gap-6 min-h-0">
        
        {/* 좌측 사이드 메뉴 (하단까지 늘어나도록 h-full 및 flex 구조 적용) */}
        <div className="col-span-1 bg-white rounded-xl border border-border shadow-sm p-2 h-full flex flex-col gap-1">
          <button 
            onClick={() => setActiveMenu('inquiry')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeMenu === 'inquiry' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <MessageSquare size={18} />
            1:1 문의 관리
          </button>
          <button 
            onClick={() => setActiveMenu('notice')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeMenu === 'notice' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Bell size={18} />
            공지사항 등록/관리
          </button>
          <button 
            onClick={() => setActiveMenu('faq')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeMenu === 'faq' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <HelpCircle size={18} />
            자주 묻는 질문 (FAQ)
          </button>
        </div>

        {/* 우측 컨텐츠 박스 (내용이 없어도 하단 바닥까지 하얗게 꽉 찹니다) */}
        <div className="col-span-3 bg-white rounded-xl border border-border shadow-sm flex flex-col h-full overflow-hidden">
          {/* 리스트 헤더 */}
          <div className="p-4 border-b border-border flex justify-between items-center bg-slate-50/50 shrink-0">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
              <input 
                type="text" 
                placeholder="제목 또는 작성자 검색" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 border border-border rounded-lg text-sm w-full focus:outline-none focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          {/* 리스트 본문 (flex-1과 overflow-y-auto를 주어 리스트가 많아져도 이 안에서만 스크롤됩니다) */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {activeMenu === 'inquiry' && <Inquiry embedded />}

            {activeMenu === 'notice' && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                📢 등록된 공지사항 목록이 이곳에 노출됩니다.
              </div>
            )}

            {activeMenu === 'faq' && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                💡 자주 묻는 질문 리스트 관리 화면이 노출됩니다.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}