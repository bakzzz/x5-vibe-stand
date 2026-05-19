import { createStyles } from 'antd-style';
import type { MenuProps } from 'antd';
import {
  Affix,
  Anchor,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  ConfigProvider,
  Divider,
  Drawer,
  Dropdown,
  Flex,
  Input,
  Layout,
  Menu,
  Progress,
  Row,
  Segmented,
  Switch,
  Table,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  IconBell,
  IconBriefcase,
  IconBuilding,
  IconCalendarEvent,
  IconChevronLeft,
  IconChevronRight,
  IconFolders,
  IconHelpCircle,
  IconHistory,
  IconListDetails,
  IconListSearch,
  IconMenu2,
  IconSearch,
  IconSettings,
  IconStar,
} from '@tabler/icons-react';
import {
  shellContentInnerBase,
  shellContentInnerEmbed,
  shellContentInnerEmbedMobile,
  shellContentInnerFluid,
  shellContentInnerMobile,
  shellContentInnerNarrow,
} from '@/shared/layout/shellContentLayout';
import logoMark from './x5-logo-mark.svg';
import logoText from './x5-logo-text.svg';
import storeLogoClover from './store-logo-clover.svg';
import storeLogoLeaf from './store-logo-leaf.svg';
import storeLogoPyaterochka from './store-logo-pyaterochka.svg';
import storeLogoRing from './store-logo-ring.svg';

const { Header, Sider, Content } = Layout;

/** Узкий свёрнутый Sider; должен совпадать с `theme.components.Menu.collapsedWidth`, иначе Ant Menu рисует ширину по умолчанию (~80px) и подложка пунктов обрезается. */
const SHELL_SIDER_COLLAPSED_WIDTH = 56;

const useStyles = createStyles(({ token }) => ({
  root: {
    position: 'fixed',
    inset: 0,
    background: token.colorBgLayout,
    display: 'flex',
    flexDirection: 'column',
    '@media (max-width: 768px)': { overflowX: 'hidden' },
  },
  /** Эталон разметки: `proto/_standard_template_v1_snapshot` — два блока + space-between, левый с headerLeft (flex:1) прижимает действия вправо. */
  header: {
    height: token.controlHeightLG + token.paddingSM,
    paddingInline: token.padding,
    background: token.colorBgContainer,
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
    /** Иначе при отрицательном margin у бургера обрезается hover-подложка Ant Button */
    overflow: 'visible',
    '@media (max-width: 768px)': { paddingInline: token.paddingSM },
  },
  headerContent: { height: '100%', width: '100%', minWidth: 0 },
  /** Три колонки (CDE + headerCenter): сетка надёжнее трёх Flex-колонок с пустым центром. */
  headerGrid: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr) auto',
    alignItems: 'center',
    columnGap: token.marginXS,
    width: '100%',
    height: '100%',
    minWidth: 0,
  },
  headerCenterSlot: { minWidth: 0, overflow: 'hidden' },
  headerActions: { flexShrink: 0 },
  /** Не hidden — иначе бургер с отрицательным margin обрезает подложку; усечение длинного лого — на logoLink/logoWrap при необходимости */
  headerLeft: { minWidth: 0, flex: 1, overflow: 'visible' },
  /** Первая колонка шапки (бургер + лого): не клиповать hover кнопки */
  headerBurgerCluster: { overflow: 'visible' },
  burgerButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: token.controlHeight,
    height: token.controlHeight,
    minWidth: token.controlHeight,
    paddingInline: token.paddingXXS,
  },
  /** Сайдбар свёрнут: чуть влево (−2px). Раскрыт: выровнять с иконками колонки (+4px). */
  burgerButtonNavCollapsed: { marginInlineStart: -4 },
  burgerButtonNavExpanded: { marginInlineStart: 4 },
  shell: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    minWidth: 0,
    '@media (max-width: 768px)': { overflowX: 'hidden' },
  },
  sider: { background: token.colorBgContainer, borderInlineEnd: `1px solid ${token.colorBorderSecondary}` },
  siderInner: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    '@media (max-width: 768px)': { overflow: 'auto' },
  },
  topSection: {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    '@media (max-width: 768px)': { flex: 'none', overflow: 'visible' },
  },
  bottomSection: { marginTop: 'auto', flexShrink: 0, '@media (max-width: 768px)': { marginTop: 0 } },
  sectionTitle: {
    display: 'block',
    color: token.colorTextSecondary,
    fontSize: token.fontSize,
    paddingInlineStart: token.padding,
    marginTop: token.marginSM,
    marginBottom: token.margin,
  },
  menu: {
    background: 'transparent',
    borderInlineEnd: 0,
    '& .ant-menu-item .ant-menu-title-content': { flex: '1 1 auto', minWidth: 0, alignItems: 'center' },
    '& .ant-menu-item, & .ant-menu-submenu > .ant-menu-submenu-title': {
      height: 40,
      lineHeight: '40px',
      marginBlock: 0,
      paddingBlock: 0,
    },
    '& .ant-menu-sub.ant-menu-inline > .ant-menu-item': {
      height: 40,
      lineHeight: '40px',
      marginBlock: 0,
      paddingBlock: 0,
    },
  },
  /** Первый пункт «Проекты»: место под extra-кнопку каталога без вылезания за край (без отрицательных margin) */
  projectMenu: {
    '& .ant-menu-item:first-of-type': {
      paddingInlineEnd: token.paddingSM,
    },
  },
  splitLine: { margin: 0 },
  content: { background: token.colorBgLayout, overflow: 'auto', minWidth: 0 },
  contentInner: {
    ...shellContentInnerBase(token),
    '@media (max-width: 768px)': shellContentInnerMobile(token),
  },
  contentInnerFluid: shellContentInnerFluid(),
  contentInnerNarrow: shellContentInnerNarrow(token),
  /** Встроенные приложения (CDE): см. hub-shell-content-layout */
  contentInnerEmbed: {
    ...shellContentInnerEmbed(token),
    '@media (max-width: 768px)': shellContentInnerEmbedMobile(token),
  },
  contentTitle: { marginBottom: token.marginLG },
  contentSubtitle: { display: 'block', marginBottom: token.marginLG, color: token.colorTextSecondary },
  contentSection: { marginBottom: token.marginLG },
  articleSection: { marginBottom: token.margin, scrollMarginTop: token.controlHeightLG + token.margin },
  articleList: { marginTop: token.marginSM, paddingInlineStart: token.padding },
  articleTocCard: { '& .ant-card-body': { padding: token.padding } },
  /** Триггер Dropdown — только название; «шеврон» в слоте Menu `extra` (класс ant-menu-item-extra) */
  projectPickerTrigger: {
    width: '100%',
    minWidth: 0,
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    minHeight: 40,
  },
  projectPickerTitle: { flex: 1, minWidth: 0, margin: 0, lineHeight: `${token.lineHeight * token.fontSize}px` },
  /** Кнопка в extra: та же высота строки, что у пункта меню и у левой иконки */
  projectPickerExtraBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    minWidth: 40,
    padding: 0,
    color: token.colorTextSecondary,
  },
  projectDropdown: {
    width: 471,
    maxWidth: 'calc(100vw - 24px)',
    height: 'calc(100vh - 140px)',
    maxHeight: 'calc(100vh - 140px)',
    background: token.colorBgContainer,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadius,
    boxShadow: token.boxShadowSecondary,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  /** Панель списка проектов внутри полноэкранного Drawer (мобильный выбор проекта). */
  projectDropdownInDrawer: {
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    maxHeight: 'none',
    flex: 1,
    minHeight: 0,
    border: 'none',
    borderRadius: 0,
    boxShadow: 'none',
  },
  projectDropdownSearchRow: { padding: token.padding },
  projectSearchInput: { height: 36 },
  projectDropdownResults: { flex: 1, overflow: 'auto', minHeight: 0 },
  projectResultItem: {
    display: 'flex',
    gap: token.marginSM,
    alignItems: 'flex-start',
    paddingInline: token.padding,
    paddingBlock: token.paddingSM,
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
    cursor: 'pointer',
    '&:hover': { background: token.colorBgTextHover },
  },
  projectResultTitle: { fontSize: token.fontSizeLG },
  projectResultBody: { minWidth: 0 },
  projectResultMeta: { gap: token.marginXS, color: token.colorTextSecondary, fontSize: token.fontSize },
  projectLogo: { width: 40, height: 40, borderRadius: token.borderRadiusLG, flexShrink: 0, overflow: 'hidden' },
  projectLogoImage: { width: '100%', height: '100%', objectFit: 'cover' },
  projectEmptyState: { padding: token.paddingLG, color: token.colorTextSecondary, textAlign: 'center' },
  projectDrawerBody: { padding: 0, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, height: '100%' },
  projectDrawerFooter: { padding: token.padding, borderTop: `1px solid ${token.colorBorderSecondary}`, flexShrink: 0 },
  projectDrawerCloseButton: { width: '100%' },
  projectDrawer: {
    '& .ant-drawer-body': { padding: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
  },
  mobileMenuDrawer: {
    '& .ant-drawer-body': { padding: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
  },
  mobileMenuCloseButton: {
    width: '100%',
    borderRadius: 0,
    borderTop: `1px solid ${token.colorBorderSecondary}`,
  },
  pageSettingsTrigger: {
    position: 'fixed',
    right: token.margin,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: token.zIndexPopupBase,
    width: token.controlHeightLG,
    height: token.controlHeightLG,
    minWidth: token.controlHeightLG,
    borderRadius: token.borderRadiusLG,
    boxShadow: token.boxShadowSecondary,
    '@media (max-width: 768px)': { right: token.marginSM, top: 'auto', bottom: token.marginLG, transform: 'none' },
  },
  pageSettingsBody: { display: 'grid', gap: token.margin },
  pageSettingsHint: { color: token.colorTextSecondary },
  pageSettingsSwitchRow: { justifyContent: 'space-between', gap: token.marginSM },
  logoLink: {
    display: 'inline-flex',
    alignItems: 'center',
    color: 'inherit',
    textDecoration: 'none',
    outline: 'none',
    borderRadius: token.borderRadiusSM,
    transition: `background-color ${token.motionDurationFast}`,
    '&:hover': { backgroundColor: token.colorFillSecondary },
    '&:focus-visible': {
      outline: `2px solid ${token.colorPrimary}`,
      outlineOffset: 1,
    },
  },
  logoWrap: { display: 'flex', alignItems: 'center', marginInlineStart: token.marginXS, gap: token.marginXS },
  logoMark: { width: 35.739, height: 24, display: 'block', transform: 'translateY(-5px)' },
  logoText: { width: 94.5783, height: 13.519, display: 'block', '@media (max-width: 768px)': { width: 82, height: 11.718 } },
}));

type ProjectItem = {
  id: string;
  title: string;
  menuTitle: string;
  date: string;
  type: string;
  ownerShortName: string;
  logo: string;
  logoAlt: string;
};

export interface ShellLayoutFrameProps {
  /**
   * Режим встраивания (CDE): вместо демо-контента — `children`.
   * По умолчанию скрывает FAB «настройки страницы»; включите `embeddedPageSettings`, чтобы открывать Drawer только с боковой иконки (как у полноэкранного shell).
   */
  embed?: boolean;
  /** При `embed: true` — показать FAB настроек справа по центру экрана и Drawer */
  embeddedPageSettings?: boolean;
  /** Содержимое Drawer настроек; если не задано при `embeddedPageSettings`, в drawer попадёт стандартный блок (режим контейнера + TOC) */
  pageSettingsPanel?: ReactNode;
  /** Центр верхней панели (например горизонтальное меню вкладок) */
  headerCenter?: ReactNode;
  children?: ReactNode;
}

export function ShellLayoutFrame({
  embed = false,
  embeddedPageSettings = false,
  pageSettingsPanel,
  headerCenter,
  children: embedChildren,
}: ShellLayoutFrameProps) {
  const { styles } = useStyles();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [recentOpenKeys, setRecentOpenKeys] = useState<string[]>([]);
  const [sectionsOpenKeys, setSectionsOpenKeys] = useState<string[]>([]);
  const [projectNavOpenKeys, setProjectNavOpenKeys] = useState<string[]>([]);
  const [isProjectDirectoryOpen, setIsProjectDirectoryOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>('p1');
  const [isProjectNavExpanded, setIsProjectNavExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPageSettingsOpen, setIsPageSettingsOpen] = useState(false);
  const [contentMode, setContentMode] = useState<'fluid' | 'narrow'>('fluid');
  const [showArticleToc, setShowArticleToc] = useState(false);
  const contentScrollRef = useRef<HTMLElement | null>(null);
  const projectPickerTriggerRef = useRef<HTMLDivElement | null>(null);
  const projectPickerExtraRef = useRef<HTMLButtonElement | null>(null);
  const projectDropdownContentRef = useRef<HTMLDivElement | null>(null);
  const isNavCollapsed = !isMobile && collapsed;

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const sync = (matches: boolean) => {
      setIsMobile(matches);
      setCollapsed(matches);
    };
    sync(media.matches);
    const handler = (event: MediaQueryListEvent) => sync(event.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (isMobile || !isProjectDirectoryOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (projectPickerTriggerRef.current?.contains(target)) return;
      if (projectPickerExtraRef.current?.contains(target)) return;
      if (projectDropdownContentRef.current?.contains(target)) return;
      setIsProjectDirectoryOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [isMobile, isProjectDirectoryOpen]);

  const sectionsMenuItems: MenuProps['items'] = [
    { key: 'my-tasks', icon: <IconListDetails size={18} stroke={1.5} />, label: 'Мои задачи' },
    {
      key: 'sections-projects',
      icon: <IconFolders size={18} stroke={1.5} />,
      label: 'Проекты',
      children: [
        { key: 'sections-projects-all', label: 'Все проекты' },
        { key: 'sections-projects-favorites', label: 'Избранные' },
        { key: 'sections-projects-mine', label: 'Мои' },
      ],
    },
    { key: 'requests', icon: <IconBuilding size={18} stroke={1.5} />, label: 'Запросы' },
    { key: 'favorites', icon: <IconStar size={18} stroke={1.5} />, label: 'Избранное' },
    {
      key: 'reports',
      icon: <IconCalendarEvent size={18} stroke={1.5} />,
      label: 'Отчетность',
      children: [{ key: 'reports-all', label: 'Все отчеты' }],
    },
    { key: 'help', icon: <IconHelpCircle size={18} stroke={1.5} />, label: 'Помощь' },
  ];

  const projectNavigationItems: MenuProps['items'] = [
    { key: 'project-passport', label: 'Паспорт проекта' },
    { key: 'project-team', label: 'Команда' },
    { key: 'project-schedule', label: 'График проекта (КСП)' },
    { key: 'project-risks', label: 'Реестр рисков' },
    {
      key: 'project-analytics',
      label: 'Аналитика',
      children: [{ key: 'project-analytics-reports', label: 'Отчеты' }],
    },
    {
      key: 'project-docflow',
      label: 'Документооборот',
      children: [
        {
          key: 'project-docflow-commerce',
          label: 'Коммерция',
          children: [
            { key: 'project-docflow-finance', label: 'Финансовые документы' },
            { key: 'project-docflow-budget', label: 'Бюджеты и оценки' },
            { key: 'project-docflow-claims', label: 'Претензии и штрафы' },
            { key: 'project-docflow-milestones', label: 'Договорные вехи' },
          ],
        },
      ],
    },
    {
      key: 'project-planning',
      label: 'Планирование',
      children: [
        { key: 'project-planning-week', label: 'Суточно-недельное планирование' },
        { key: 'project-planning-current', label: 'Текущие задачи' },
      ],
    },
    {
      key: 'project-control',
      label: 'Стройконтроль',
      children: [
        {
          key: 'project-control-inspections',
          label: 'Инспекции и Качество',
          children: [
            { key: 'project-control-remarks', label: 'Замечания' },
            { key: 'project-control-people', label: 'Техники и люди' },
          ],
        },
      ],
    },
    {
      key: 'project-journal',
      label: 'Журнал работ',
      children: [
        { key: 'project-journal-daily', label: 'Ежедневный отчет' },
        { key: 'project-journal-volumes', label: 'Физические объемы' },
        { key: 'project-journal-photo', label: 'Фото-мониторинг' },
      ],
    },
    { key: 'project-chat', label: 'Чат' },
  ];

  const recentMenuItems: MenuProps['items'] = [
    {
      key: 'recent-section',
      label: 'Последние',
      icon: <IconHistory size={18} stroke={1.5} />,
      children: [
        { key: 'r-1', label: '№435-СМ Смета на земляные работы...' },
        { key: 'r-2', label: '№89-АКТ Акт освидетельствования...' },
      ],
    },
  ];

  const projects = useMemo<ProjectItem[]>(() => {
    const cities = ['Владивосток', 'Хабаровск', 'Краснодар', 'Казань', 'Екатеринбург', 'Новосибирск'];
    const districts = ['Центр', 'Север', 'Юг', 'Запад', 'Восток'];
    const directions = ['ТС5', 'Перекресток', 'Чижик', 'DarkStore', 'X5 Digital'];
    const statuses = ['Инициация', 'Проектирование', 'Стройка', 'Согласование', 'Запуск'];
    const owners = ['И.И. Иванов', 'П.П. Петров', 'С.С. Сидоров', 'А.А. Смирнов', 'Н.Н. Кузнецов'];
    const logos = [
      { logo: storeLogoPyaterochka, logoAlt: 'Пятерочка' },
      { logo: storeLogoLeaf, logoAlt: 'Перекресток' },
      { logo: storeLogoRing, logoAlt: 'Проектное кольцо' },
      { logo: storeLogoClover, logoAlt: 'Сервисный кластер' },
    ];
    return Array.from({ length: 250 }, (_, idx) => {
      const city = cities[idx % cities.length];
      const district = districts[Math.floor(idx / cities.length) % districts.length];
      const direction = directions[Math.floor(idx / (cities.length * districts.length)) % directions.length];
      const status = statuses[idx % statuses.length];
      const ownerShortName = owners[idx % owners.length];
      const { logo, logoAlt } = logos[idx % logos.length];
      return {
        id: `p${idx + 1}`,
        title: `${direction} ${city} ${district} ${String(idx + 1).padStart(3, '0')}`,
        menuTitle: `${direction} ${city} ${district}`,
        date: `${(idx % 28) + 1} мая, 2026`,
        type: status,
        ownerShortName,
        logo,
        logoAlt,
      };
    });
  }, []);

  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  /** Один активный пункт в блоке «Разделы»: при контексте проекта не подсвечиваем «Проекты → Все проекты». */
  const sectionsSelectedKeys = selectedProjectId ? [] : ['sections-projects-all'];
  const filteredProjects = useMemo(() => {
    const query = projectSearch.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) => `${project.title} ${project.date} ${project.type} ${project.ownerShortName}`.toLowerCase().includes(query));
  }, [projectSearch, projects]);

  const renderProjectDropdown = (panelClassName: string) => (
    <div ref={projectDropdownContentRef} className={panelClassName}>
      <div className={styles.projectDropdownSearchRow}>
        <Input
          value={projectSearch}
          onChange={(event) => setProjectSearch(event.target.value)}
          placeholder="Начните вводить название, статус или ответственного"
          className={styles.projectSearchInput}
          prefix={<IconSearch size={16} stroke={1.5} />}
        />
      </div>
      <div className={styles.projectDropdownResults}>
        {filteredProjects.length > 0 ? filteredProjects.map((project) => (
          <div
            key={project.id}
            className={styles.projectResultItem}
            onClick={() => {
              setSelectedProjectId(project.id);
              setIsProjectDirectoryOpen(false);
            }}
          >
            <Flex align="center" justify="center" className={styles.projectLogo}>
              <img src={project.logo} alt={project.logoAlt} className={styles.projectLogoImage} />
            </Flex>
            <div className={styles.projectResultBody}>
              <Typography.Text className={styles.projectResultTitle}>{project.title}</Typography.Text>
              <Flex align="center" wrap="wrap" className={styles.projectResultMeta}>
                <span>{project.date}</span>
                <Tag>{project.type}</Tag>
                <Tag>{project.ownerShortName}</Tag>
              </Flex>
            </div>
          </div>
        )) : <div className={styles.projectEmptyState}>Проекты не найдены</div>}
      </div>
    </div>
  );

  const projectMenuItems: MenuProps['items'] = [
    {
      key: 'project-picker',
      icon: <IconBriefcase size={20} stroke={1.5} />,
      label: isNavCollapsed ? '' : (
        <Dropdown
          open={!isMobile && isProjectDirectoryOpen}
          trigger={[]}
          placement="bottomLeft"
          getPopupContainer={(triggerNode) => triggerNode.closest('.ant-layout-sider') as HTMLElement}
          dropdownRender={() => renderProjectDropdown(styles.projectDropdown)}
          onOpenChange={(open) => {
            setIsProjectDirectoryOpen(open);
            if (open) setProjectSearch('');
          }}
        >
          <div ref={projectPickerTriggerRef} className={styles.projectPickerTrigger}>
            <Typography.Text ellipsis={{ tooltip: selectedProject?.menuTitle ?? 'Выберите проект' }} className={styles.projectPickerTitle}>
              {selectedProject?.menuTitle ?? 'Выберите проект'}
            </Typography.Text>
          </div>
        </Dropdown>
      ),
      extra:
        isNavCollapsed ? undefined : (
          <Button
            ref={projectPickerExtraRef}
            type="text"
            icon={<IconListSearch size={20} stroke={1.5} />}
            className={styles.projectPickerExtraBtn}
            aria-label="Каталог проектов"
            onClick={(event) => {
              event.stopPropagation();
              setProjectSearch('');
              setIsProjectDirectoryOpen(true);
            }}
          />
        ),
    },
  ];

  const tocItems = [
    { key: 'article-overview', href: '#article-overview', title: 'Обзор' },
    { key: 'article-structure', href: '#article-structure', title: 'Структура страницы' },
    { key: 'article-patterns', href: '#article-patterns', title: 'UI‑паттерны' },
    { key: 'article-roles', href: '#article-roles', title: 'Роли пользователей' },
    { key: 'article-adaptive', href: '#article-adaptive', title: 'Адаптив' },
  ];

  type DemoProjectRow = {
    key: string;
    project: string;
    stage: string;
    owner: string;
    readiness: number;
    status: 'В графике' | 'Требует внимания' | 'Риск срыва';
  };

  const demoProjectRows: DemoProjectRow[] = [
    { key: 'r1', project: 'ТС5 Владивосток Центр 001-1A', stage: 'Стройка', owner: 'И.И. Иванов', readiness: 78, status: 'В графике' },
    { key: 'r2', project: 'ТС5 Хабаровск Центр 002-2B', stage: 'Проектирование', owner: 'П.П. Петров', readiness: 56, status: 'Требует внимания' },
    { key: 'r3', project: 'ТС5 Краснодар Центр 003-3C', stage: 'Стройка', owner: 'С.С. Сидоров', readiness: 42, status: 'Риск срыва' },
  ];

  const innerWidthClass = embed
    ? styles.contentInnerFluid
    : contentMode === 'narrow'
      ? styles.contentInnerNarrow
      : styles.contentInnerFluid;

  const statusColorMap: Record<DemoProjectRow['status'], string> = {
    'В графике': 'green',
    'Требует внимания': 'gold',
    'Риск срыва': 'red',
  };

  const demoProjectColumns = [
    { title: 'Проект', dataIndex: 'project', key: 'project' },
    { title: 'Этап', dataIndex: 'stage', key: 'stage' },
    { title: 'Ответственный', dataIndex: 'owner', key: 'owner' },
    { title: 'Готовность', dataIndex: 'readiness', key: 'readiness', render: (v: number) => <Progress percent={v} size="small" showInfo={false} /> },
    { title: 'Статус', dataIndex: 'status', key: 'status', render: (s: DemoProjectRow['status']) => <Tag color={statusColorMap[s]}>{s}</Tag> },
  ];

  return (
    <ConfigProvider
      theme={{
        components: {
          Menu: { collapsedWidth: SHELL_SIDER_COLLAPSED_WIDTH },
        },
      }}
    >
    <Layout className={styles.root}>
      <Header className={styles.header}>
        {headerCenter != null ? (
          <div className={styles.headerGrid}>
            <Flex align="center" gap={4} flex="none" className={styles.headerBurgerCluster}>
              <Button
                type="text"
                icon={<IconMenu2 size={20} stroke={1.5} />}
                className={`${styles.burgerButton} ${collapsed ? styles.burgerButtonNavCollapsed : styles.burgerButtonNavExpanded}`}
                onClick={() => {
                  if (isMobile) {
                    setIsMobileMenuOpen(true);
                    return;
                  }
                  setCollapsed((v) => !v);
                }}
              />
              <Link
                to="/tasks"
                className={styles.logoLink}
                aria-label="На главную хаба"
              >
                <span className={styles.logoWrap}>
                  <img src={logoMark} alt="X5" className={styles.logoMark} />
                  <img src={logoText} alt="Real Estate" className={styles.logoText} />
                </span>
              </Link>
            </Flex>
            <Flex className={styles.headerCenterSlot} justify="center" align="center">
              {headerCenter}
            </Flex>
            <Flex align="center" gap={8} className={styles.headerActions}>
              <Avatar size={22}>AM</Avatar>
              <Badge count="99+" size="small">
                <Button type="text" icon={<IconBell size={20} stroke={1.5} />} />
              </Badge>
            </Flex>
          </div>
        ) : (
          <Flex align="center" justify="space-between" className={styles.headerContent} style={{ width: '100%' }} gap={8}>
            <Flex align="center" className={`${styles.headerLeft} ${styles.headerBurgerCluster}`} gap={4}>
              <Button
                type="text"
                icon={<IconMenu2 size={20} stroke={1.5} />}
                className={`${styles.burgerButton} ${collapsed ? styles.burgerButtonNavCollapsed : styles.burgerButtonNavExpanded}`}
                onClick={() => {
                  if (isMobile) {
                    setIsMobileMenuOpen(true);
                    return;
                  }
                  setCollapsed((v) => !v);
                }}
              />
              <Link
                to="/tasks"
                className={styles.logoLink}
                aria-label="На главную хаба"
              >
                <span className={styles.logoWrap}>
                  <img src={logoMark} alt="X5" className={styles.logoMark} />
                  <img src={logoText} alt="Real Estate" className={styles.logoText} />
                </span>
              </Link>
            </Flex>
            <Flex align="center" gap={8}>
              <Avatar size={22}>AM</Avatar>
              <Badge count="99+" size="small">
                <Button type="text" icon={<IconBell size={20} stroke={1.5} />} />
              </Badge>
            </Flex>
          </Flex>
        )}
      </Header>

      <Layout className={styles.shell} hasSider>
        <Sider
          width={isMobile ? 260 : 280}
          collapsedWidth={isMobile ? 0 : SHELL_SIDER_COLLAPSED_WIDTH}
          breakpoint="md"
          collapsible
          trigger={null}
          collapsed={isMobile ? true : collapsed}
          onBreakpoint={(broken) => {
            setIsMobile(broken);
            setCollapsed(broken);
            if (!broken) setIsMobileMenuOpen(false);
          }}
          className={styles.sider}
          theme="light"
        >
          <div className={styles.siderInner}>
            <div className={styles.topSection}>
              {!collapsed && <Typography.Text className={styles.sectionTitle}>Проекты</Typography.Text>}
              <Menu
                mode="inline"
                className={`${styles.menu} ${styles.projectMenu}`}
                items={projectMenuItems}
                selectedKeys={['project-picker']}
                inlineCollapsed={isNavCollapsed}
                onClick={({ key }) => {
                  if (key !== 'project-picker') return;
                  if (!selectedProjectId) {
                    setProjectSearch('');
                    setIsProjectDirectoryOpen(true);
                    return;
                  }
                  setIsProjectNavExpanded((v) => !v);
                }}
              />
              {!isNavCollapsed && selectedProjectId && isProjectNavExpanded && (
                <Menu
                  mode="inline"
                  className={styles.menu}
                  items={projectNavigationItems}
                  selectedKeys={['project-passport']}
                  openKeys={projectNavOpenKeys}
                  onOpenChange={(keys) => setProjectNavOpenKeys(keys as string[])}
                />
              )}
              <Divider className={styles.splitLine} />
              {!collapsed && <Typography.Text className={styles.sectionTitle}>Разделы</Typography.Text>}
              <Menu
                mode="inline"
                className={styles.menu}
                items={sectionsMenuItems}
                selectedKeys={sectionsSelectedKeys}
                openKeys={sectionsOpenKeys}
                onOpenChange={(keys) => setSectionsOpenKeys(keys as string[])}
                inlineCollapsed={isNavCollapsed}
              />
            </div>
            <div className={styles.bottomSection}>
              <Divider className={styles.splitLine} />
              <Menu
                mode="inline"
                className={styles.menu}
                items={recentMenuItems}
                selectable={false}
                openKeys={recentOpenKeys}
                onOpenChange={(keys) => setRecentOpenKeys(keys as string[])}
                inlineCollapsed={isNavCollapsed}
              />
              <Divider className={styles.splitLine} />
              <Menu
                mode="inline"
                className={styles.menu}
                items={[{ key: 'collapse-panel', icon: collapsed ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />, label: 'Свернуть панель' }]}
                selectable={false}
                inlineCollapsed={isNavCollapsed}
                onClick={() => setCollapsed((v) => !v)}
              />
            </div>
          </div>
        </Sider>

        <Content ref={contentScrollRef} className={styles.content}>
          <div
            className={
              embed ? styles.contentInnerEmbed : `${styles.contentInner} ${innerWidthClass}`
            }
          >
            {embed && embedChildren ? (
              embedChildren
            ) : (
              <>
            <Typography.Title level={3} className={styles.contentTitle}>Демонстрационный контент</Typography.Title>
            <Typography.Text className={styles.contentSubtitle}>
              Каноничный контент Ant Design: расширенная статья, структурированные блоки и навигация по заголовкам.
            </Typography.Text>
            <div className={styles.contentSection}>
              <Card title="Статус проектов">
                <Table columns={demoProjectColumns as any} dataSource={demoProjectRows} pagination={false} size="small" scroll={{ x: 'max-content' }} />
              </Card>
            </div>
            <Row gutter={[16, 16]} className={styles.contentSection}>
              <Col xs={24} lg={showArticleToc && !isMobile ? 18 : 24}>
                <Card title="Статья: как устроен этот шаблон контента">
                  <div id="article-overview" className={styles.articleSection}>
                    <Typography.Title level={5}>Обзор</Typography.Title>
                    <Typography.Paragraph>
                      Сначала пользователь получает сводку, затем углубляется в детали без резкого переключения контекста.
                    </Typography.Paragraph>
                  </div>
                  <div id="article-structure" className={styles.articleSection}>
                    <Typography.Title level={5}>Структура страницы</Typography.Title>
                    <ul className={styles.articleList}>
                      <li>KPI и статусная сводка в верхней части.</li>
                      <li>Рабочие блоки и данные в средней части.</li>
                      <li>Контекстные события и риски внизу.</li>
                    </ul>
                  </div>
                  <div id="article-patterns" className={styles.articleSection}>
                    <Typography.Title level={5}>UI‑паттерны</Typography.Title>
                    <ul className={styles.articleList}>
                      <li>Слева — контекст (проекты/разделы), справа — рабочая зона.</li>
                      <li>Мобильное меню открывается оверлеем и не двигает контент.</li>
                      <li>TOC справа — только на desktop.</li>
                    </ul>
                  </div>
                  <div id="article-roles" className={styles.articleSection}>
                    <Typography.Title level={5}>Роли пользователей</Typography.Title>
                    <Typography.Paragraph>
                      Руководителю важны тренды и отклонения, исполнителю — рабочие задачи, статусы и документы.
                    </Typography.Paragraph>
                  </div>
                  <div id="article-adaptive" className={styles.articleSection}>
                    <Typography.Title level={5}>Адаптив</Typography.Title>
                    <Typography.Paragraph>
                      В мобильном режиме вторичная навигация скрывается, основной поток контента остаётся читаемым.
                    </Typography.Paragraph>
                  </div>
                </Card>
              </Col>
              {showArticleToc && !isMobile && (
                <Col xs={24} lg={6}>
                  <Affix offsetTop={96} target={() => contentScrollRef.current ?? window}>
                    <Card className={styles.articleTocCard} title="На этой странице">
                      <Anchor items={tocItems} getContainer={() => contentScrollRef.current ?? window} targetOffset={96} />
                    </Card>
                  </Affix>
                </Col>
              )}
            </Row>
            <Card title="Лента активности">
              <Timeline items={[
                { color: 'green', children: '09:30 — Утвержден акт КС-2 по блоку A' },
                { color: 'blue', children: '11:10 — Обновлен график подрядчика по фасадам' },
                { color: 'red', children: '13:45 — Критическое замечание по срокам поставки' },
              ]} />
            </Card>
              </>
            )}
          </div>
        </Content>
      </Layout>

      {(!embed || embeddedPageSettings) && (
        <>
          <Button
            type="primary"
            icon={<IconSettings size={18} stroke={1.5} />}
            className={styles.pageSettingsTrigger}
            aria-label="Настройки страницы"
            onClick={() => setIsPageSettingsOpen(true)}
          />

          <Drawer open={isPageSettingsOpen} title="Настройки страницы" placement="right" onClose={() => setIsPageSettingsOpen(false)}>
            <div className={styles.pageSettingsBody}>
              {pageSettingsPanel ?? (
                <>
                  <Typography.Text className={styles.pageSettingsHint}>Режим контейнера контента:</Typography.Text>
                  <Segmented
                    block
                    value={contentMode}
                    options={[{ label: 'Fluid (таблица)', value: 'fluid' }, { label: 'Narrow (форма/статья)', value: 'narrow' }]}
                    onChange={(value) => setContentMode(value as 'fluid' | 'narrow')}
                  />
                  <Typography.Text className={styles.pageSettingsHint}>`Fluid` — на всю ширину. `Narrow` — ограничение до 1152px.</Typography.Text>
                  <Flex align="center" className={styles.pageSettingsSwitchRow}>
                    <Typography.Text>Навигация по заголовкам (Article TOC)</Typography.Text>
                    <Switch checked={showArticleToc} onChange={setShowArticleToc} />
                  </Flex>
                </>
              )}
            </div>
          </Drawer>
        </>
      )}

      <Drawer
        open={isMobile && isMobileMenuOpen}
        placement="left"
        width="100%"
        closable={false}
        onClose={() => setIsMobileMenuOpen(false)}
        rootClassName={styles.mobileMenuDrawer}
      >
        <div className={styles.siderInner}>
          <div className={styles.topSection}>
            <Typography.Text className={styles.sectionTitle}>Проекты</Typography.Text>
            <Menu
              mode="inline"
              className={`${styles.menu} ${styles.projectMenu}`}
              items={projectMenuItems}
              selectedKeys={['project-picker']}
              onClick={({ key }) => {
                if (key !== 'project-picker') return;
                if (!selectedProjectId) {
                  setProjectSearch('');
                  setIsMobileMenuOpen(false);
                  setIsProjectDirectoryOpen(true);
                  return;
                }
                setIsProjectNavExpanded((v) => !v);
              }}
            />
            {selectedProjectId && isProjectNavExpanded && (
              <Menu
                mode="inline"
                className={styles.menu}
                items={projectNavigationItems}
                selectedKeys={['project-passport']}
                openKeys={projectNavOpenKeys}
                onOpenChange={(keys) => setProjectNavOpenKeys(keys as string[])}
              />
            )}
            <Divider className={styles.splitLine} />
            <Typography.Text className={styles.sectionTitle}>Разделы</Typography.Text>
            <Menu
              mode="inline"
              className={styles.menu}
              items={sectionsMenuItems}
              selectedKeys={sectionsSelectedKeys}
              openKeys={sectionsOpenKeys}
              onOpenChange={(keys) => setSectionsOpenKeys(keys as string[])}
            />
          </div>
          <div className={styles.bottomSection}>
            <Divider className={styles.splitLine} />
            <Menu
              mode="inline"
              className={styles.menu}
              items={recentMenuItems}
              selectable={false}
              openKeys={recentOpenKeys}
              onOpenChange={(keys) => setRecentOpenKeys(keys as string[])}
            />
            <Button type="text" className={styles.mobileMenuCloseButton} onClick={() => setIsMobileMenuOpen(false)}>Закрыть меню</Button>
          </div>
        </div>
      </Drawer>

      <Drawer
        open={isProjectDirectoryOpen && isMobile}
        placement="left"
        width="100%"
        closable={false}
        onClose={() => setIsProjectDirectoryOpen(false)}
        rootClassName={styles.projectDrawer}
      >
        <div className={styles.projectDrawerBody}>
          {renderProjectDropdown(`${styles.projectDropdown} ${styles.projectDropdownInDrawer}`)}
          <div className={styles.projectDrawerFooter}>
            <Button className={styles.projectDrawerCloseButton} onClick={() => setIsProjectDirectoryOpen(false)}>
              Закрыть выбор проекта
            </Button>
          </div>
        </div>
      </Drawer>
    </Layout>
    </ConfigProvider>
  );
}

