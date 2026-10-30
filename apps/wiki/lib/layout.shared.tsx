import { defineTranslations } from 'fumadocs-core/i18n';
import { uiTranslations } from 'fumadocs-ui/i18n';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { ThemeToggle } from '@/shared/components/theme/theme-toggle';
import { appName } from './shared';

export const translations = defineTranslations().extend(uiTranslations()).add({
  'Search(search trigger)': 'Поиск',
  'Search(search dialog)': 'Поиск по документации',
  'Search failed(search dialog)': 'Не удалось выполнить поиск',
  'Search failed, showing results for {query}(search dialog)':
    'Поиск не удался, показаны результаты для «{query}»',
  'No results found(search dialog)': 'Ничего не найдено',
  'On this page(table of contents)': 'На этой странице',
  'No Headings(table of contents)': 'Нет заголовков',
  'Table of Contents(inline table of contents)': 'Содержание',
  'Copy Markdown(page actions)': 'Скопировать Markdown',
  'Copied Markdown(page actions)': 'Markdown скопирован',
  'View as Markdown(page actions)': 'Открыть как Markdown',
  'Open(page actions)': 'Открыть',
  'Open in GitHub(page actions)': 'Открыть на GitHub',
  'Next Page(pagination)': 'Следующая страница',
  'Previous Page(pagination)': 'Предыдущая страница',
  'Collapse Sidebar(sidebar)(aria-label)': 'Свернуть боковую панель',
  'Open Sidebar(sidebar)(aria-label)': 'Открыть боковую панель',
  'Close Sidebar(sidebar)(aria-label)': 'Закрыть боковую панель',
  'Hide Sidebar(sidebar)': 'Скрыть панель',
  'Show Sidebar(sidebar)': 'Показать панель',
  'Toggle Theme(theme switcher)(aria-label)': 'Сменить тему',
  'Light(theme switcher)(aria-label)': 'Светлая тема',
  'Dark(theme switcher)(aria-label)': 'Тёмная тема',
  'System(theme switcher)(aria-label)': 'Системная тема',
  'Theme(site menu)': 'Тема',
  'Copy Anchor Link(heading anchor)(aria-label)': 'Скопировать ссылку на заголовок',
  'Copied Anchor Link(heading anchor)(aria-label)': 'Ссылка на заголовок скопирована',
  'Copy Text(code block)(aria-label)': 'Скопировать код',
  'Copied Text(code block)(aria-label)': 'Код скопирован',
  'Copy Link(accordion)(aria-label)': 'Скопировать ссылку',
  'Copied Link(accordion)(aria-label)': 'Ссылка скопирована',
  'Close(image zoom)(aria-label)': 'Закрыть',
  'Image Viewer(image zoom)(aria-label)': 'Просмотр изображения',
  'Next Image(image zoom)(aria-label)': 'Следующее изображение',
  'Previous Image(image zoom)(aria-label)': 'Предыдущее изображение',
  'Page Not Found(404 not found page)': 'Страница не найдена',
  'Back to Home(404 not found page)': 'На главную',
  'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.(404 not found page)':
    'Страница могла быть удалена, переименована или временно недоступна.',
  'Toggle Menu(home layout header)(aria-label)': 'Открыть меню',
  'Choose a language(language switcher)': 'Выбрать язык',
  'Choose a language(language switcher)(aria-label)': 'Выбрать язык',
});

export function baseOptions(): BaseLayoutProps {
  return {
    slots: {
      themeSwitch: ThemeToggle,
    },
    nav: {
      title: (
        <span className="flex h-14 items-center gap-2">
          <img
            src="/favicon-full.png"
            alt={appName}
            width={40}
            height={40}
            className="size-10 shrink-0 object-contain"
          />
          <span className="flex items-baseline gap-1.5 self-end">
            <span className="font-[PIXY] font-normal text-3xl">Fasberry</span>
            <span className="relative top-[0.16em] font-[PIXY] font-normal text-base text-fd-muted-foreground">
              wiki
            </span>
          </span>
        </span>
      ),
    },
  };
}
