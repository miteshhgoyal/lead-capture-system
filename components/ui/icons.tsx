import {
  BadgeCheck,
  BookOpen,
  Brain,
  CalendarDays,
  ChartCandlestick,
  ChartColumn,
  Clock,
  GraduationCap,
  Gift,
  Lock,
  MessageCircle,
  Send,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  Video,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { IconKey } from "@/lib/page-builder/types";

/** Content stores icon *names*; this is the only place that maps them to lucide components. */
export const ICON_MAP: Record<IconKey, LucideIcon> = {
  trend: TrendingUp,
  shield: ShieldCheck,
  candles: ChartCandlestick,
  brain: Brain,
  video: Video,
  zap: Zap,
  users: Users,
  target: Target,
  send: Send,
  lock: Lock,
  clock: Clock,
  gift: Gift,
  badge: BadgeCheck,
  graduation: GraduationCap,
  chart: ChartColumn,
  message: MessageCircle,
  book: BookOpen,
  calendar: CalendarDays,
};

export function Icon({ name, className = "size-5", strokeWidth = 2 }: { name: IconKey; className?: string; strokeWidth?: number }) {
  const Cmp = ICON_MAP[name] ?? Zap;
  return <Cmp className={className} strokeWidth={strokeWidth} aria-hidden />;
}
