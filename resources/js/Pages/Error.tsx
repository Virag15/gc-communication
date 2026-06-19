import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ShieldAlert, FileQuestion, Clock, ServerCrash, Construction, Ban, ArrowLeft, RefreshCw, Home, type LucideIcon } from 'lucide-react';

const DEFAULT_RATE_LIMIT_SECONDS = 60;

interface ErrorDefinition {
    title: string;
    description: string;
    icon: LucideIcon;
    color: string;
    bg: string;
}

const errors: Record<number, ErrorDefinition> = {
    403: {
        title: 'Access Denied',
        description: 'You don\'t have permission to access this page. Please contact your administrator if you believe this is a mistake.',
        icon: ShieldAlert,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
    },
    404: {
        title: 'Page Not Found',
        description: 'The page you\'re looking for doesn\'t exist or has been moved. Check the URL or head back to the dashboard.',
        icon: FileQuestion,
        color: 'text-muted-foreground',
        bg: 'bg-muted',
    },
    419: {
        title: 'Session Expired',
        description: 'Your session has expired due to inactivity. Please refresh the page and try again.',
        icon: Clock,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
    },
    429: {
        title: 'Too Many Requests',
        description: 'You\'ve made too many requests in a short period. Please wait for the timer to finish before retrying.',
        icon: Ban,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
    },
    500: {
        title: 'Server Error',
        description: 'Something went wrong on our end. Our team has been notified. Please try again in a few moments.',
        icon: ServerCrash,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
    },
    503: {
        title: 'Under Maintenance',
        description: 'We\'re performing scheduled maintenance. Please check back shortly - we\'ll be up and running soon.',
        icon: Construction,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
    },
};

interface CountdownTimerProps {
    seconds: number;
    onComplete?: () => void;
}

function CountdownTimer({ seconds, onComplete }: CountdownTimerProps) {
    const [remaining, setRemaining] = useState(seconds);
    const finished = remaining <= 0;
    const progress = ((seconds - remaining) / seconds) * 100;

    useEffect(() => {
        if (finished) {
            onComplete?.();
            return;
        }
        const interval = setInterval(() => {
            setRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [finished]);

    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const display = mins > 0
        ? `${mins}:${secs.toString().padStart(2, '0')}`
        : `${secs}s`;

    return (
        <div className="w-full space-y-3">
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                    {finished ? 'You can retry now' : 'Retry available in'}
                </span>
                <span className={`font-mono font-semibold tabular-nums ${finished ? 'text-emerald-600' : 'text-red-500'}`}>
                    {finished ? 'Ready' : display}
                </span>
            </div>
            <Progress value={progress} className="h-2" />
        </div>
    );
}

interface ErrorProps {
    status: number;
    retryAfter?: number;
}

export default function Error({ status, retryAfter }: ErrorProps) {
    const error = errors[status] || errors[500];
    const Icon = error.icon;
    const [canRetry, setCanRetry] = useState(status !== 429);

    return (
        <>
            <Head title={`${status} - ${error.title}`} />
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md border-border/50 shadow-lg">
                    <CardContent className="flex flex-col items-center text-center p-8 space-y-6">
                        <div className={`flex size-16 items-center justify-center rounded-full ${error.bg}`}>
                            <Icon className={`size-8 ${error.color}`} />
                        </div>

                        <div className="space-y-2">
                            <p className="text-5xl font-bold tabular-nums tracking-tight text-foreground">
                                {status}
                            </p>
                            <h1 className="text-lg font-semibold text-foreground">
                                {error.title}
                            </h1>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {error.description}
                            </p>
                        </div>

                        {status === 429 && (
                            <CountdownTimer
                                seconds={retryAfter || DEFAULT_RATE_LIMIT_SECONDS}
                                onComplete={() => setCanRetry(true)}
                            />
                        )}

                        <div className="flex flex-col gap-2 w-full sm:flex-row sm:justify-center">
                            <Button
                                variant="default"
                                onClick={() => window.history.back()}
                                className="gap-2"
                            >
                                <ArrowLeft className="size-4" />
                                Go Back
                            </Button>
                            {status === 419 || status === 429 ? (
                                <Button
                                    variant="outline"
                                    onClick={() => router.reload()}
                                    disabled={!canRetry}
                                    className="gap-2"
                                >
                                    <RefreshCw className="size-4" />
                                    {status === 429 && !canRetry ? 'Please wait…' : 'Retry'}
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    asChild
                                    className="gap-2"
                                >
                                    <Link href="/admin">
                                        <Home className="size-4" />
                                        Dashboard
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
