"use client";

import React, { ReactElement, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router"
import {
  getNotifications,
  getUnreadCount,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
  type NotificationResponse,
} from "@/api/notification/notification.service";
import { useAuthStore } from "@/store/useAuthStore";
import { logout as apiLogout } from "@/api/auth/auth.service";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface Notification {
  id: string;
  message: string;
  time: string;
  read: boolean;
}

export interface AdminHeaderProps {
  logo?: React.ReactNode;
  brandName?: string;
  navItems?: NavItem[];
  user?: {
    name: string;
    initials: string;
    role: string;
  };
  notificationCount?: number;
  onSearch?: (query: string) => void;
  onSettingsClick?: () => void;
  onNotificationClick?: () => void;
  onUserMenuClick?: () => void;
}

const DEFAULT_NAV: NavItem[] = [
  { label: "홈", href: "/admin", icon: "home" },
  { label: "사용자", href: "/admin/users", icon: "users" },
  { label: "결제", href: "/admin/settlements", icon: "receipt" },
  { label: "통계", href: "/admin/analytics", icon: "chart-bar" },
];

const DEFAULT_USER = {
  name: "Admin",
  initials: "AM",
  role: "관리자",
};

// 백엔드 NotificationResponse → 헤더 표시용 Notification으로 변환
function toDisplayNotification(n: NotificationResponse): Notification {
  return {
    id: String(n.notificationId),
    message: n.message,
    time: formatRelativeTime(n.createdAt),
    read: n.isRead,
  };
}

function formatRelativeTime(isoStr: string): string {
  try {
    const diffMs = Date.now() - new Date(isoStr).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "방금 전";
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}시간 전`;
    return new Date(isoStr).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
  } catch {
    return isoStr;
  }
}

export default function AdminHeader({
                                      logo,
                                      brandName = "AdminHub",
                                      navItems = DEFAULT_NAV,
                                      user = DEFAULT_USER,
                                      notificationCount, // 더 이상 초기값으로만 쓰지 않고, 실제 API 조회로 덮어씀
                                      onSearch,
                                      onSettingsClick,
                                      onNotificationClick,
                                      onUserMenuClick,
                                    }: AdminHeaderProps) {
  const location = useLocation();
  const [activeHref, setActiveHref] = useState(navItems[0]?.href ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [notifCount, setNotifCount] = useState(notificationCount ?? 0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 무한 스크롤용 커서 페이지네이션 상태
  const [notifCursor, setNotifCursor] = useState<number | null>(null);
  const [notifHasNext, setNotifHasNext] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const navigate = useNavigate();
  const clearUser = useAuthStore((state) => state.clearUser);

  // 마운트 시 안읽음 개수 + 첫 페이지 목록 조회
  // (실시간 push는 AdminLayout의 useNotification 훅이 toast로 별도 처리하므로,
  //  여기선 자체 EventSource 없이 REST로만 최신 상태를 가져옴)
  useEffect(() => {
    getUnreadCount()
        .then(setNotifCount)
        .catch((e) => console.error("안읽음 개수 조회 실패:", e));

    getNotifications()
        .then((page) => {
          setNotifications(page.items.map(toDisplayNotification));
          setNotifCursor(page.nextCursor);
          setNotifHasNext(page.hasNext);
        })
        .catch((e) => console.error("알림 목록 조회 실패:", e));
  }, []);

  useEffect(() => {
    if (!notifOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-notif-panel]')) {
        setNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-user-menu]')) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('로그아웃 API 요청 실패:', error);
    } finally {
      clearUser();
      navigate('/auth/login', { replace: true });
      onUserMenuClick?.();
    }
  };

  // 알림 벨 클릭 → 드롭다운 열기/닫기만 수행 (읽음 처리는 별도 버튼)
  const handleBellClick = () => {
    setNotifOpen((prev) => !prev);
    onNotificationClick?.();
  };

  // 전체 읽음 버튼 클릭 → 화면 즉시 반영 + 서버 반영
  const handleMarkAllRead = async () => {
    if (notifCount === 0) return;
    setNotifCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await apiMarkAllAsRead();
    } catch (e) {
      console.error("알림 읽음 처리 실패:", e);
    }
  };

  // 개별 알림 클릭 → 그 알림만 읽음 처리
  const handleNotificationItemClick = async (n: Notification) => {
    if (n.read) return;
    setNotifications((prev) =>
        prev.map((item) => item.id === n.id ? { ...item, read: true } : item)
    );
    setNotifCount((prev) => Math.max(0, prev - 1));
    try {
      await apiMarkAsRead(Number(n.id));
    } catch (e) {
      console.error("알림 읽음 처리 실패:", e);
    }
  };

  // 다음 페이지 알림 로드 (무한 스크롤)
  const loadMoreNotifications = async () => {
    if (!notifHasNext || isLoadingMore || notifCursor == null) return;
    setIsLoadingMore(true);
    try {
      const page = await getNotifications(notifCursor);
      setNotifications((prev) => [...prev, ...page.items.map(toDisplayNotification)]);
      setNotifCursor(page.nextCursor);
      setNotifHasNext(page.hasNext);
    } catch (e) {
      console.error("추가 알림 조회 실패:", e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // 알림 드롭다운 스크롤이 바닥 근처에 닿으면 다음 페이지 로드
  const handleNotifScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
      loadMoreNotifications();
    }
  };

  return (
      <header style={styles.header}>
        {/* Left — Brand + Nav */}
        <div style={styles.left}>
          <div style={styles.brand}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              {logo ? logo : (
                  <>
                    <div style={styles.brandIcon}>

                    </div>
                    <span style={styles.brandName}>{brandName}</span>
                  </>
              )}
            </Link>
          </div>

          <nav style={styles.nav} aria-label="주 메뉴">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                  <Link
                      key={item.href}
                      to={item.href}
                      style={{
                        ...(isActive ? styles.navLinkActive : styles.navLinkInactive),
                        ...styles.navLink,
                      }}
                  >
                    <NavIcon name={item.icon} />
                    {item.label}
                  </Link>
              );
            })}
          </nav>
        </div>

        {/* Right — Search + Actions + User */}
        <div style={styles.right}>
          {/* Search */}
          <div style={styles.searchWrap}>
            <SearchIcon />
            <input
                type="search"
                placeholder="검색..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                style={styles.searchInput}
                aria-label="검색"
            />
          </div>

          {/* Notification */}
          <div style={{ position: 'relative' }} data-notif-panel>
            <button
                onClick={handleBellClick}
                aria-label={`알림 ${notifCount}개`}
                style={styles.iconBtn}
            >
              <BellIcon />
              {notifCount > 0 && <span style={styles.badge} aria-hidden="true" />}
            </button>

            {notifOpen && (
                <div style={styles.dropdown}>
                  <div style={styles.dropdownHeader}>
                    <span style={styles.dropdownTitle}>알림</span>
                    <button
                        onClick={handleMarkAllRead}
                        disabled={notifCount === 0}
                        style={{
                          ...styles.clearBtn,
                          color: notifCount === 0 ? 'var(--color-text-secondary)' : '#185FA5',
                          cursor: notifCount === 0 ? 'default' : 'pointer',
                        }}
                    >
                      전체 읽음
                    </button>
                  </div>

                  <div
                      style={{ maxHeight: 384, overflowY: 'auto' }}
                      onScroll={handleNotifScroll}
                  >
                    {notifications.length === 0 ? (
                        <p style={styles.empty}>알림이 없습니다.</p>
                    ) : (
                        <>
                          {notifications.map(n => (
                              <div
                                  key={n.id}
                                  onClick={() => handleNotificationItemClick(n)}
                                  style={{
                                    ...styles.notifItem,
                                    background: n.read ? 'transparent' : 'var(--color-background-secondary)',
                                    cursor: 'pointer',
                                  }}
                              >
                                {!n.read && <span style={styles.unreadDot} />}
                                <div style={{ flex: 1 }}>
                                  <p style={styles.notifMsg}>{n.message}</p>
                                  <p style={styles.notifTime}>{n.time}</p>
                                </div>
                              </div>
                          ))}
                          {isLoadingMore && (
                              <p style={{ ...styles.empty, padding: '10px 0' }}>불러오는 중...</p>
                          )}
                        </>
                    )}
                  </div>
                </div>
            )}
          </div>

          {/* Settings */}
          {/*<button
          onClick={onSettingsClick}
          aria-label="설정"
          style={styles.iconBtn}
        >
          <SettingsIcon />
        </button>

        <div style={styles.divider} aria-hidden="true" />
        */}

          {/* User menu */}
          <div style={{ position: 'relative' }} data-user-menu>
            <button
                onClick={() => setUserMenuOpen(prev => !prev)}
                aria-label="사용자 메뉴 열기"
                aria-haspopup="true"
                style={styles.userBtn}
            >
              <div style={styles.avatar}>
                <span style={styles.avatarText}>{user.initials}</span>
              </div>
              <div style={styles.userInfo}>
                <p style={styles.userName}>{user.name}</p>
                <p style={styles.userRole}>{user.role}</p>
              </div>
              <ChevronIcon />
            </button>

            {userMenuOpen && (
                <div style={styles.dropdown}>
                  <div style={styles.dropdownHeader}>
                    <p style={styles.userDropdownName}>{user.name}</p>
                    <p style={styles.userDropdownRole}>{user.role}</p>
                  </div>
                  <div style={styles.userDropdownDivider} />
                  <button
                      onClick={handleLogout}
                      style={styles.logoutBtn}
                  >
                    <LogoutIcon />
                    로그아웃
                  </button>
                </div>
            )}
          </div>
        </div>
      </header>
  );
}
function LogoutIcon() {
  return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
  );
}

function NavIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactElement> = {
    home: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    ),
    users: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    receipt: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
          <line x1="8" y1="10" x2="16" y2="10" />
          <line x1="8" y1="14" x2="16" y2="14" />
        </svg>
    ),
    "chart-bar": (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
          <line x1="2" y1="20" x2="22" y2="20" />
        </svg>
    ),
  };
  return icons[name] ?? null;
}

function SearchIcon() {
  return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 10, color: "var(--color-text-secondary)" }} aria-hidden="true">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
  );
}
function BellIcon() {
  return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
  );
}
function SettingsIcon() {
  return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
  );
}
function ChevronIcon() {
  return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-text-secondary)" }} aria-hidden="true">
        <polyline points="6 9 12 15 18 9" />
      </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 1.5rem",
    borderBottom: "0.5px solid var(--color-border-tertiary, #e5e7eb)",
    background: "var(--color-background-primary, #fff)",
    gap: 16,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif",
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: 24,
    flexShrink: 0,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
  },
  brandIcon: {
    width: 28,
    height: 28,
    background: "#185FA5",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  brandName: {
    fontSize: 14,
    fontWeight: 500,
    color: "var(--color-text-primary)",
    whiteSpace: "nowrap",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: 2,
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "6px 10px",
    borderRadius: 8,
    fontSize: 13,
    textDecoration: "none",
    whiteSpace: "nowrap",
    transition: "background .12s, color .12s",
  },
  navLinkActive: {
    background: "var(--color-background-secondary, #f3f4f6)",
    color: "var(--color-text-primary)",
  },
  navLinkInactive: {
    background: "transparent",
    color: "var(--color-text-secondary)",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  searchWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchInput: {
    padding: "6px 12px 6px 32px",
    fontSize: 13,
    borderRadius: 8,
    border: "0.5px solid var(--color-border-secondary, #d1d5db)",
    background: "var(--color-background-secondary, #f9fafb)",
    color: "var(--color-text-primary)",
    width: 200,
    outline: "none",
  },
  iconBtn: {
    position: "relative",
    width: 36,
    height: 36,
    borderRadius: 8,
    border: "0.5px solid var(--color-border-tertiary, #e5e7eb)",
    background: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--color-text-secondary)",
    flexShrink: 0,
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    background: "#E24B4A",
    borderRadius: "50%",
    border: "1.5px solid var(--color-background-primary, #fff)",
  },
  divider: {
    width: 0.5,
    height: 20,
    background: "var(--color-border-tertiary, #e5e7eb)",
    margin: "0 4px",
    flexShrink: 0,
  },
  userBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "4px 8px 4px 4px",
    borderRadius: 8,
    border: "0.5px solid var(--color-border-tertiary, #e5e7eb)",
    background: "transparent",
    cursor: "pointer",
    flexShrink: 0,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#E6F1FB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: 500,
    color: "#0C447C",
  },
  userInfo: {
    textAlign: "left",
  },
  userName: {
    fontSize: 12,
    fontWeight: 500,
    margin: 0,
    color: "var(--color-text-primary)",
    lineHeight: 1.3,
  },
  userRole: {
    fontSize: 11,
    margin: 0,
    color: "var(--color-text-secondary)",
    lineHeight: 1.3,
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: 320,
    background: '#ffffff',
    border: '0.5px solid var(--color-border-secondary)',
    borderRadius: 12,
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 12px 32px rgba(0,0,0,0.12)',  // 그림자 강화
    zIndex: 100,
    overflow: 'hidden',
  },
  dropdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '0.5px solid var(--color-border-tertiary)',
    position: 'relative',
    zIndex: 50,
  },
  dropdownTitle: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--color-text-primary)',
  },
  clearBtn: {
    fontSize: 12,
    color: 'var(--color-text-secondary)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  notifItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '12px 16px',
    borderBottom: '0.5px solid var(--color-border-tertiary)',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#E24B4A',
    flexShrink: 0,
    marginTop: 5,
  },
  notifMsg: {
    fontSize: 13,
    color: 'var(--color-text-primary)',
    margin: 0,
    lineHeight: 1.4,
  },
  notifTime: {
    fontSize: 11,
    color: 'var(--color-text-secondary)',
    margin: '3px 0 0',
  },
  empty: {
    fontSize: 13,
    color: 'var(--color-text-secondary)',
    textAlign: 'center',
    padding: '24px 0',
    margin: 0,
  },
  userDropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: 200,
    background: 'var(--color-background-primary)',
    border: '0.5px solid var(--color-border-secondary)',
    borderRadius: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
    zIndex: 100,
    overflow: 'hidden',
  },
  userDropdownInfo: {
    padding: '12px 16px',
  },
  userDropdownName: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--color-text-primary)',
    margin: 0,
  },
  userDropdownRole: {
    fontSize: 11,
    color: 'var(--color-text-secondary)',
    margin: '2px 0 0',
  },
  userDropdownDivider: {
    height: 0.5,
    background: 'var(--color-border-tertiary)',
  },
  logoutBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    fontSize: 13,
    color: '#E24B4A',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
};