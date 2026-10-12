import {
  IconHome, IconPlayerPlay, IconFingerprint, IconBuilding, IconTerminal2, IconLayoutSidebar, IconSparkles,
  IconChartDots, IconCode, IconEye, IconFileText, IconHistory, IconSearch, IconBrandGithub, IconPackage,
  IconCopy, IconCheck, IconArrowRight, IconArrowLeft, IconListCheck, IconLink, IconUser, IconUsers,
  IconLeaf, IconMapPin, IconWorld, IconMail, IconHash, IconId, IconDatabase, IconGitMerge, IconArrowsSplit,
  IconPlus, IconCircleDashed, IconScale, IconAlertTriangle, IconCircleCheck, IconCircleX, IconMenu2,
  IconExternalLink, IconAlignLeft, IconArrowBackUp, IconTimelineEvent, IconBook, IconChevronRight,
  IconAdjustmentsHorizontal, IconPhone, IconCake, IconBriefcase, IconGitBranch,
} from "@tabler/icons-react";
import type { ComponentType } from "react";

type TablerIcon = ComponentType<{ size?: number; stroke?: number; className?: string }>;

const ICONS: Record<string, TablerIcon> = {
  home: IconHome, "player-play": IconPlayerPlay, fingerprint: IconFingerprint, building: IconBuilding,
  "terminal-2": IconTerminal2, "layout-sidebar": IconLayoutSidebar, sparkles: IconSparkles,
  "chart-dots": IconChartDots, code: IconCode, eye: IconEye, "file-text": IconFileText, history: IconHistory,
  search: IconSearch, github: IconBrandGithub, package: IconPackage, copy: IconCopy, check: IconCheck,
  "arrow-right": IconArrowRight, "arrow-left": IconArrowLeft, "list-check": IconListCheck, link: IconLink,
  user: IconUser, users: IconUsers, leaf: IconLeaf, "map-pin": IconMapPin, world: IconWorld, mail: IconMail,
  hash: IconHash, id: IconId, database: IconDatabase, "git-merge": IconGitMerge, "arrows-split": IconArrowsSplit,
  plus: IconPlus, "circle-dashed": IconCircleDashed, scale: IconScale, "alert-triangle": IconAlertTriangle,
  "circle-check": IconCircleCheck, "circle-x": IconCircleX, menu: IconMenu2, "external-link": IconExternalLink,
  "align-left": IconAlignLeft, "arrow-back-up": IconArrowBackUp, "timeline-event": IconTimelineEvent,
  book: IconBook, "chevron-right": IconChevronRight, adjustments: IconAdjustmentsHorizontal, phone: IconPhone,
  cake: IconCake, briefcase: IconBriefcase, "git-branch": IconGitBranch,
};

export function Icon({ name, size = 16, stroke = 1.6, className = "" }: { name: string; size?: number; stroke?: number; className?: string }) {
  const C = ICONS[name] ?? IconCircleDashed;
  return <C size={size} stroke={stroke} className={`icon ${className}`} />;
}
