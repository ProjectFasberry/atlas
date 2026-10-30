import type { Icon } from '@tabler/icons-react';
import {
  IconBriefcase,
  IconBug,
  IconCoin,
  IconDeviceGamepad2,
  IconDots,
  IconFileText,
  IconFlag,
  IconFolder,
  IconHome,
  IconInfoCircle,
  IconListCheck,
  IconLock,
  IconMap,
  IconPaw,
  IconRocket,
  IconShield,
  IconShirt,
  IconSparkles,
  IconStar,
  IconTool,
  IconTrain,
  IconUser,
  IconUserShield,
  IconUsersGroup,
} from '@tabler/icons-react';

const PAGE_ICONS: Record<string, Icon> = {
  '': IconHome,
  general: IconInfoCircle,
  armor: IconShield,
  boosts: IconRocket,
  economic: IconCoin,
  jobs: IconBriefcase,
  regions: IconMap,
  metro: IconTrain,
  mobs: IconBug,
  pets: IconPaw,
  profile: IconUser,
  quests: IconListCheck,
  referals: IconUsersGroup,
  reputation: IconStar,
  skills: IconSparkles,
  skin: IconShirt,
  reports: IconFlag,
  safety: IconLock,
  problems: IconTool,
};

const SECTION_ICONS: Record<string, Icon> = {
  'С чего начать': IconInfoCircle,
  'Аспекты игры': IconDeviceGamepad2,
  Аккаунт: IconUserShield,
  Прочее: IconDots,
};

function render(Component: Icon, size = 16) {
  return <Component size={size} stroke={1.75} aria-hidden />;
}

export function pageIcon(slug: string) {
  return render(PAGE_ICONS[slug] ?? IconFileText);
}

export function sectionIcon(name?: string) {
  return render((name && SECTION_ICONS[name]) || IconFolder, 14);
}
