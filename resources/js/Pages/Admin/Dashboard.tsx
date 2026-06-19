import { useState, useMemo, type ReactNode } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Users, UserCheck, CalendarIcon, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatShortDate, formatDate, formatDateTime, toISODate } from '@/lib/dates';
import { format, subDays, startOfDay, startOfYear } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { type AuditLogEntry, type DashboardStats, type TrendPoint } from '@/types';

// `chart.jsx` is still untyped JS, so mirror the shadcn ChartConfig shape locally.
type ChartConfig = Record<string, { label?: ReactNode; color?: string }>;

const trendConfig = {
    count: { label: 'Users', color: 'var(--chart-1)' },
} satisfies ChartConfig;

interface TrendChartProps {
    data: TrendPoint[] | undefined;
    config: ChartConfig;
    gradientId: string;
    color: string;
}

function TrendChart({ data, config, gradientId, color }: TrendChartProps) {
    return (
        <ChartContainer config={config} className="h-[180px] sm:h-[220px] w-full">
            <AreaChart data={data || []} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={formatShortDate}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
                <ChartTooltip
                    content={
                        <ChartTooltipContent labelFormatter={(label) => formatDate(label as string)} />
                    }
                />
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                    </linearGradient>
                </defs>
                <Area
                    dataKey="count"
                    type="monotone"
                    fill={`url(#${gradientId})`}
                    stroke={color}
                    strokeWidth={2}
                />
            </AreaChart>
        </ChartContainer>
    );
}

interface DatePreset {
    label: string;
    range: () => DateRange;
}

const presets: DatePreset[] = [
    {
        label: 'Today',
        range: () => {
            const today = startOfDay(new Date());
            return { from: today, to: today };
        },
    },
    {
        label: 'Yesterday',
        range: () => {
            const yesterday = startOfDay(subDays(new Date(), 1));
            return { from: yesterday, to: yesterday };
        },
    },
    {
        label: 'Last 7 days',
        range: () => ({
            from: startOfDay(subDays(new Date(), 6)),
            to: startOfDay(new Date()),
        }),
    },
    {
        label: 'Last 30 days',
        range: () => ({
            from: startOfDay(subDays(new Date(), 29)),
            to: startOfDay(new Date()),
        }),
    },
    {
        label: 'Last 90 days',
        range: () => ({
            from: startOfDay(subDays(new Date(), 89)),
            to: startOfDay(new Date()),
        }),
    },
    {
        label: 'This Year',
        range: () => ({
            from: startOfYear(new Date()),
            to: startOfDay(new Date()),
        }),
    },
];

interface DashboardProps {
    stats: DashboardStats | undefined;
    usersTrend: TrendPoint[] | undefined;
    recentActivity: AuditLogEntry[] | undefined;
    filters?: {
        from?: string;
        to?: string;
    };
}

export default function Dashboard({ stats, usersTrend, recentActivity, filters }: DashboardProps) {
    const { props } = usePage();
    const adminName = props.admin?.name || 'Admin';

    const initialRange = useMemo<DateRange>(() => {
        if (filters?.from && filters?.to) {
            return {
                from: new Date(filters.from + 'T00:00:00'),
                to: new Date(filters.to + 'T00:00:00'),
            };
        }
        return {
            from: startOfDay(subDays(new Date(), 29)),
            to: startOfDay(new Date()),
        };
    }, [filters?.from, filters?.to]);

    const [dateRange, setDateRange] = useState<DateRange | undefined>(initialRange);
    const [popoverOpen, setPopoverOpen] = useState(false);

    function applyDateRange(range: DateRange | undefined) {
        if (!range?.from) return;
        setDateRange(range);
        setPopoverOpen(false);

        const from = toISODate(range.from);
        const to = range.to ? toISODate(range.to) : from;

        router.get('/admin', { from, to }, { preserveState: true, replace: true });
    }

    function handlePreset(preset: DatePreset) {
        applyDateRange(preset.range());
    }

    function handleCalendarSelect(range: DateRange | undefined) {
        if (!range) return;
        setDateRange(range);
        if (range.from && range.to) {
            applyDateRange(range);
        }
    }

    const dateRangeLabel = useMemo(() => {
        if (!dateRange?.from) return 'Pick a date range';
        if (!dateRange.to || dateRange.from.getTime() === dateRange.to.getTime()) {
            return format(dateRange.from, 'MMMM d, yyyy');
        }
        const sameYear = dateRange.from.getFullYear() === dateRange.to.getFullYear();
        if (sameYear) {
            return `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
        }
        return `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
    }, [dateRange]);

    const statCards: { title: string; value: number; sub: string; icon: LucideIcon }[] = [
        { title: 'Total Users', value: stats?.total_users ?? 0, sub: 'Registered accounts', icon: Users },
        { title: 'Active Users', value: stats?.active_users ?? 0, sub: 'Currently active', icon: UserCheck },
    ];

    return (
        <AdminLayout breadcrumbs={[{ label: 'Dashboard' }]}>
            <Head title={`Dashboard - ${adminName}`} />
            <div className="space-y-6">
                {/* Toolbar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'justify-start text-left font-normal w-full sm:w-auto sm:min-w-[240px]',
                                    !dateRange?.from && 'text-muted-foreground'
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRangeLabel}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <div className="flex flex-col sm:flex-row">
                                <div className="flex flex-col gap-1 border-b p-3 sm:border-b-0 sm:border-r">
                                    <p className="mb-1 text-xs font-medium text-muted-foreground px-1">Presets</p>
                                    {presets.map((preset) => (
                                        <Button
                                            key={preset.label}
                                            variant="ghost"
                                            size="sm"
                                            className="justify-start text-xs h-8"
                                            onClick={() => handlePreset(preset)}
                                        >
                                            {preset.label}
                                        </Button>
                                    ))}
                                </div>
                                <div className="p-3">
                                    <Calendar
                                        mode="range"
                                        selected={dateRange}
                                        onSelect={handleCalendarSelect}
                                        numberOfMonths={typeof window !== 'undefined' && window.innerWidth < 640 ? 1 : 2}
                                        defaultMonth={dateRange?.from}
                                        disabled={{ after: new Date() }}
                                    />
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {statCards.map((stat) => (
                        <Card key={stat.title}>
                            <CardContent className="p-3">
                                <div className="flex items-start justify-between gap-1">
                                    <div className="space-y-0.5 min-w-0">
                                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">{stat.title}</p>
                                        <span className="text-xl font-bold tabular-nums tracking-tight block">{stat.value}</span>
                                        <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
                                    </div>
                                    <div className="flex size-7 items-center justify-center rounded-md bg-muted shrink-0">
                                        <stat.icon className="size-3.5 text-muted-foreground" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* User Registration Trend */}
                <Card>
                    <CardHeader className="p-4 pb-0">
                        <CardTitle className="text-sm font-medium">User Registrations</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-3">
                        <TrendChart
                            data={usersTrend}
                            config={trendConfig}
                            gradientId="fillUsers"
                            color="var(--color-count)"
                        />
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader className="p-4 pb-0">
                        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-3 overflow-auto">
                        {(!recentActivity || recentActivity.length === 0) ? (
                            <p className="text-center text-xs text-muted-foreground py-6">No activity yet</p>
                        ) : (
                            <>
                                <div className="space-y-2 sm:hidden">
                                    {recentActivity.map((log) => (
                                        <div key={log.id} className="rounded-md border p-3 space-y-1">
                                            <p className="text-xs font-medium">{log.user}</p>
                                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                                <span>{log.action} {log.model}</span>
                                                <span>{formatDate(log.created_at)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Table className="hidden sm:table">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-xs">User</TableHead>
                                            <TableHead className="text-xs">Action</TableHead>
                                            <TableHead className="text-xs">Model</TableHead>
                                            <TableHead className="text-xs">Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentActivity.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="text-xs font-medium">{log.user}</TableCell>
                                                <TableCell className="text-xs capitalize">{log.action}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{log.model}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{formatDateTime(log.created_at)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
