import { Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Users,
    LogOut,
    Menu,
    PanelLeftClose,
    PanelLeft,
    Globe,
    Settings,
    Package,
    FileText,
    Inbox,
    Calculator,
    Boxes,
    Contact,
    type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { type Breadcrumb as BreadcrumbType } from '@/types';

interface NavItemData {
    name: string;
    href: string;
    icon: LucideIcon;
}

interface NavGroup {
    label: string;
    color: string;
    textColor: string;
    items: NavItemData[];
}

const navGroups: NavGroup[] = [
    {
        label: 'Overview',
        color: 'bg-emerald-500',
        textColor: 'text-emerald-600',
        items: [
            { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        ],
    },
    // ──────────────────────────────────────────────
    // Add your nav groups here, e.g.:
    // {
    //     label: 'Manage',
    //     color: 'bg-blue-500',
    //     textColor: 'text-blue-600',
    //     items: [
    //         { name: 'Posts', href: '/admin/posts', icon: FileText },
    //     ],
    // },
    // ──────────────────────────────────────────────
    {
        label: 'Content',
        color: 'bg-pink-500',
        textColor: 'text-pink-600',
        items: [
            { name: 'Brands', href: '/admin/brands', icon: Package },
            { name: 'Products', href: '/admin/products', icon: Boxes },
            { name: 'Catalogues', href: '/admin/catalogues', icon: FileText },
            { name: 'Customers', href: '/admin/customers', icon: Contact },
            { name: 'Enquiries', href: '/admin/enquiries', icon: Inbox },
            { name: 'BOM', href: '/admin/bom', icon: Calculator },
        ],
    },
    {
        label: 'System',
        color: 'bg-blue-500',
        textColor: 'text-blue-600',
        items: [
            { name: 'Users', href: '/admin/users', icon: Users },
            { name: 'SEO', href: '/admin/seo', icon: Globe },
            { name: 'Site Settings', href: '/admin/settings', icon: Settings },
        ],
    },
];

const SIDEBAR_W = 240;
const SIDEBAR_COLLAPSED_W = 52;

interface NavItemProps {
    item: NavItemData;
    groupColor: string;
    isActive: boolean;
    renderCollapsed: boolean;
    onNavigate: () => void;
}

function NavItem({ item, groupColor, isActive, renderCollapsed, onNavigate }: NavItemProps) {
    const Icon = item.icon;
    const link = (
        <Link
            href={item.href}
            onClick={onNavigate}
            className={cn(
                'relative flex items-center rounded-md text-[13px]',
                isActive
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground',
                renderCollapsed
                    ? 'justify-center p-2'
                    : 'gap-2.5 px-3 py-1'
            )}
        >
            {renderCollapsed ? (
                <Icon className="h-4 w-4 shrink-0" />
            ) : (
                <>
                    <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', isActive ? groupColor : 'bg-muted-foreground/40')} />
                    <span className="whitespace-nowrap">{item.name}</span>
                </>
            )}
        </Link>
    );

    if (renderCollapsed) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.name}</TooltipContent>
            </Tooltip>
        );
    }
    return link;
}

interface AdminLayoutProps {
    children: React.ReactNode;
    title?: string;
    breadcrumbs?: BreadcrumbType[];
}

export default function AdminLayout({ children, title, breadcrumbs }: AdminLayoutProps) {
    const { props } = usePage();
    const auth = props.auth || {};
    const admin = props.admin || {};
    const flash = props.flash || {};
    const [collapsed, setCollapsed] = useState(false);
    const [renderCollapsed, setRenderCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const isActive = (href: string) => {
        if (href === '/admin') return currentPath === '/admin' || currentPath === '/admin/';
        return currentPath.startsWith(href);
    };

    const handleLogout = () => {
        router.post('/admin/logout');
    };

    const toggleSidebar = () => {
        const next = !collapsed;
        setCollapsed(next);
        setRenderCollapsed(next);
    };

    const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;
    const showCollapsed = renderCollapsed && !mobileOpen;

    const sidebarContent = (
        <>
            {/* Sidebar header */}
            <div className="flex h-12 items-center border-b border-border shrink-0 px-3 gap-2">
                {!showCollapsed && (
                    <span className="text-sm font-bold tracking-tight text-foreground flex-1 whitespace-nowrap">
                        {admin.name || 'Admin'}
                    </span>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        'h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground hidden lg:flex',
                        showCollapsed && 'mx-auto',
                    )}
                    onClick={toggleSidebar}
                >
                    {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </Button>
            </div>

            {/* Nav */}
            <ScrollArea className="flex-1 py-2">
                <div className={cn('px-2', showCollapsed ? 'space-y-1' : 'space-y-3')}>
                    {navGroups.map((group) => (
                        <div key={group.label}>
                            {!showCollapsed && (
                                <p className={cn(
                                    'mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap',
                                    group.textColor,
                                )}>
                                    {group.label}
                                </p>
                            )}
                            <nav className="flex flex-col gap-0.5">
                                {group.items.map((item) => (
                                    <NavItem key={item.href} item={item} groupColor={group.color} isActive={isActive(item.href)} renderCollapsed={showCollapsed} onNavigate={() => setMobileOpen(false)} />
                                ))}
                            </nav>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* User footer */}
            <div className="border-t border-border p-2 shrink-0">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className={cn(
                                'flex w-full items-center rounded-md py-1.5 text-left text-sm hover:bg-muted',
                                showCollapsed ? 'justify-center px-0' : 'gap-2 px-2'
                            )}
                        >
                            <Avatar className="h-6 w-6 shrink-0">
                                <AvatarFallback className="text-[10px] bg-foreground text-primary-foreground">
                                    {auth.user?.name?.charAt(0)?.toUpperCase() || 'A'}
                                </AvatarFallback>
                            </Avatar>
                            {!showCollapsed && (
                                <div className="flex-1 truncate">
                                    <p className="truncate text-xs font-medium text-foreground">{auth.user?.name || 'Admin'}</p>
                                    <p className="truncate text-[10px] text-muted-foreground">{auth.user?.email || ''}</p>
                                </div>
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side={showCollapsed ? 'right' : 'top'} align="start" className="w-48">
                        <div className="px-2 py-1.5">
                            <p className="text-sm font-medium">{auth.user?.name || 'Admin'}</p>
                            <p className="text-xs text-muted-foreground">{auth.user?.email || ''}</p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                            <LogOut className="h-4 w-4 mr-2" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-background">

            {/* Mobile overlay */}
            <div
                className={cn(
                    'fixed inset-0 z-40 bg-foreground/40 lg:hidden transition-opacity duration-300 ease-out',
                    mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={() => setMobileOpen(false)}
            />

            {/* Sidebar spacer */}
            <div
                className="hidden lg:block shrink-0"
                style={{
                    width: sidebarWidth,
                    transition: 'width 280ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            />

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-background overflow-hidden',
                    mobileOpen
                        ? 'translate-x-0'
                        : '-translate-x-full lg:translate-x-0',
                )}
                style={{
                    width: mobileOpen ? SIDEBAR_W : sidebarWidth,
                    transition: 'width 280ms cubic-bezier(0.4, 0, 0.2, 1), transform 300ms ease-out',
                }}
            >
                {sidebarContent}
            </aside>

            {/* Main */}
            <div className="flex flex-1 flex-col overflow-hidden min-w-0 min-h-0">
                {/* Header */}
                <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
                    <Button variant="ghost" size="icon" className="h-7 w-7 lg:hidden" onClick={() => setMobileOpen(true)}>
                        <Menu className="h-4 w-4" />
                    </Button>

                    {breadcrumbs && breadcrumbs.length > 0 ? (
                        <Breadcrumb className="min-w-0">
                            <BreadcrumbList className="flex-nowrap">
                                {/* Desktop: show all items */}
                                <BreadcrumbItem className="hidden sm:inline-flex">
                                    <BreadcrumbLink asChild>
                                        <Link href="/admin" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                {breadcrumbs.map((crumb, i) => (
                                    <span key={i} className="contents hidden sm:contents">
                                        <BreadcrumbSeparator className="hidden sm:block" />
                                        <BreadcrumbItem>
                                            {crumb.href ? (
                                                <BreadcrumbLink asChild>
                                                    <Link href={crumb.href} className="text-muted-foreground hover:text-foreground">{crumb.label}</Link>
                                                </BreadcrumbLink>
                                            ) : (
                                                <BreadcrumbPage className="text-foreground truncate max-w-[160px]">{crumb.label}</BreadcrumbPage>
                                            )}
                                        </BreadcrumbItem>
                                    </span>
                                ))}

                                {/* Mobile: ellipsis dropdown + last item only */}
                                {breadcrumbs.length > 1 && (
                                    <BreadcrumbItem className="sm:hidden">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="flex items-center gap-1">
                                                <BreadcrumbEllipsis />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start">
                                                <DropdownMenuItem asChild>
                                                    <Link href="/admin">Dashboard</Link>
                                                </DropdownMenuItem>
                                                {breadcrumbs.slice(0, -1).map((crumb, i) => (
                                                    <DropdownMenuItem key={i} asChild>
                                                        <Link href={crumb.href || '#'}>{crumb.label}</Link>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </BreadcrumbItem>
                                )}
                                {breadcrumbs.length === 1 && (
                                    <BreadcrumbItem className="sm:hidden">
                                        <BreadcrumbLink asChild>
                                            <Link href="/admin" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                )}
                                <BreadcrumbSeparator className="sm:hidden" />
                                <BreadcrumbItem className="sm:hidden min-w-0">
                                    <BreadcrumbPage className="text-foreground truncate">
                                        {breadcrumbs[breadcrumbs.length - 1].label}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    ) : (
                        title && <h1 className="text-sm font-medium text-foreground">{title}</h1>
                    )}

                    {admin.logo ? (
                        <Link href="/admin" className="ml-auto flex items-center shrink-0">
                            <img src={admin.logo} alt={admin.name || 'Logo'} className="w-auto object-contain h-7 max-w-[120px]" />
                        </Link>
                    ) : (
                        <span className="ml-auto text-xs font-medium text-muted-foreground">{admin.name || ''}</span>
                    )}
                </header>

                {/* Content (relative = positioning context so absolutely-positioned
                    descendants stay contained and never extend the document height) */}
                <main className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-background p-4 sm:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
