"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { motion, useScroll, useSpring } from "framer-motion";
import LoginDialog from "@/components/auth/LoginDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Map, FileText, Bell, UserCircle, LayoutDashboard, LogOut, ChevronDown, AlertTriangle, ShieldAlert, Info, ChevronRight, MapPin } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

// Demo notifications data
const notifications = [
  {
    id: 1,
    title: "Tai nạn nghiêm trọng — Cầu Sài Gòn",
    area: "Q.2 ↔ Q.Bình Thạnh",
    severity: "critical" as const,
    time: "5 phút trước",
    read: false,
  },
  {
    id: 2,
    title: "Ngập nước — Nguyễn Hữu Cảnh",
    area: "Q.Bình Thạnh",
    severity: "warning" as const,
    time: "30 phút trước",
    read: false,
  },
  {
    id: 3,
    title: "Thi công đường — Lê Lợi",
    area: "Q.1",
    severity: "info" as const,
    time: "2 giờ trước",
    read: true,
  },
];

const sevIcon = {
  critical: <ShieldAlert className="w-4 h-4 !text-rose-500" />,
  warning: <AlertTriangle className="w-4 h-4 !text-amber-500" />,
  info: <Info className="w-4 h-4 !text-blue-500" />,
};

const sevDot = {
  critical: "bg-rose-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
};

export default function Navbar({ showScrollProgress = false }: { showScrollProgress?: boolean }) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const isOperatorOrAdmin = user?.roles?.some((r: string) =>
    ["traffic_operator", "city_admin", "super_admin"].includes(r)
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <>
      {/* Scroll Progress Bar — only on landing */}
      {showScrollProgress && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 z-[60] origin-left"
          style={{ scaleX }}
        />
      )}
      <nav className="sticky top-0 z-50 w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl transition-all">
      <Link href="/">
        <div className="flex items-center gap-4 group cursor-pointer mr-2">
          <div className="relative transition-transform duration-500 group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="CivicTwin AI Logo"
              width={56}
              height={56}
              className="object-contain w-14 h-14 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
              unoptimized
              priority
            />
          </div>
          <span className="text-3xl font-bold tracking-tight text-foreground font-heading">
            CivicTwin
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              AI
            </span>
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-6 mr-3 text-sm font-medium text-muted-foreground">
          <Link href="/map" className="hover:text-blue-400 cursor-pointer transition-colors">
            {t('navbar.liveMap')}
          </Link>
          <Link href="/#features" className="hover:text-blue-400 cursor-pointer transition-colors">
            {t('navbar.technology')}
          </Link>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* 🔔 Notification Bell Dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="relative p-2.5 rounded-full bg-secondary/50 hover:bg-secondary border border-border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer">
              <Bell className="w-4.5 h-4.5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full ring-2 ring-background animate-pulse">
                  {unreadCount}
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="relative w-80 !bg-popover !border-border shadow-2xl shadow-foreground/10 rounded-xl p-0 overflow-hidden"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-4 py-3 flex items-center justify-between !text-foreground">
                  <span className="text-sm font-bold !text-foreground">{t('navbar.notifications')}</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full !bg-rose-500/10 !text-rose-400 !border !border-rose-500/20">
                      {t('navbar.newCount', { n: String(unreadCount) })}
                    </span>
                  )}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="!bg-secondary m-0" />

              <div className="relative max-h-[320px] overflow-y-auto">
                {notifications.map((n, i) => (
                  <DropdownMenuGroup key={n.id}>
                    <DropdownMenuItem
                      onClick={() => router.push("/alerts")}
                      className={`px-4 py-3.5 gap-3 rounded-none cursor-pointer focus:!bg-secondary/80 hover:!bg-secondary/80 transition-colors ${n.read ? "!opacity-60" : ""}`}
                    >
                      <div className="shrink-0 mt-0.5">{sevIcon[n.severity]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold truncate ${n.read ? "!text-muted-foreground" : "!text-foreground"}`}>{n.title}</p>
                          {!n.read && <div className={`w-2 h-2 rounded-full shrink-0 ${sevDot[n.severity]}`} />}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] flex items-center gap-1 !text-muted-foreground">
                            <MapPin className="w-3 h-3 !text-muted-foreground" />{n.area}
                          </span>
                          <span className="text-[11px] !text-muted-foreground">·</span>
                          <span className="text-[11px] !text-muted-foreground">{n.time}</span>
                        </div>
                      </div>
                    </DropdownMenuItem>
                    {i < notifications.length - 1 && (
                      <DropdownMenuSeparator className="!bg-secondary m-0" />
                    )}
                  </DropdownMenuGroup>
                ))}
              </div>

              <DropdownMenuSeparator className="!bg-secondary m-0" />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => router.push("/alerts")}
                  className="px-4 py-2.5 rounded-none cursor-pointer justify-center gap-1.5 text-xs font-semibold !text-blue-400 focus:!bg-secondary/80 hover:!bg-secondary/80"
                >
                  {t('navbar.viewAllAlerts')}
                  <ChevronRight className="w-3.5 h-3.5 !text-blue-400" />
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* 👤 Avatar Dropdown */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2.5 bg-secondary/50 hover:bg-secondary border border-border rounded-full pl-1.5 pr-3.5 py-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer group">
              <Avatar className="w-8 h-8 border border-border/60">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-foreground text-xs font-bold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold text-foreground hidden sm:block max-w-[120px] truncate">
                {user.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="relative w-56 !bg-popover !border-border shadow-2xl shadow-foreground/10 rounded-xl p-1.5"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-3 py-2.5 !text-foreground">
                  <p className="text-sm font-bold truncate !text-foreground">{user.name}</p>
                  <p className="text-xs truncate !text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="!bg-secondary" />

              <DropdownMenuGroup>
                {[
                  { icon: <Map className="w-4 h-4 !text-blue-400" />, label: t('navbar.liveMap'), href: "/map" },
                  { icon: <FileText className="w-4 h-4 !text-emerald-400" />, label: t('navbar.myReports'), href: "/my-reports" },
                  { icon: <UserCircle className="w-4 h-4 !text-indigo-400" />, label: t('navbar.profile'), href: "/profile" },
                ].map((item) => (
                  <DropdownMenuItem
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className="px-3 py-2.5 rounded-lg cursor-pointer gap-3 focus:!bg-secondary/80 hover:!bg-secondary/80 !text-foreground transition-colors"
                  >
                    {item.icon}
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>

              {isOperatorOrAdmin && (
                <>
                  <DropdownMenuSeparator className="!bg-secondary" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => router.push("/dashboard")}
                      className="px-3 py-2.5 rounded-lg cursor-pointer gap-3 focus:!bg-secondary/80 hover:!bg-secondary/80 !text-foreground transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 !text-cyan-400" />
                      {t('navbar.operatorDashboard')}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </>
              )}

              <DropdownMenuSeparator className="!bg-secondary" />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="px-3 py-2.5 rounded-lg cursor-pointer gap-3 focus:!bg-rose-500/10 hover:!bg-rose-500/10 !text-rose-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('navbar.signOut')}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <LoginDialog />
        )}
      </div>
    </nav>
    </>
  );
}
