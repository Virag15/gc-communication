import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
    const { admin } = usePage().props;
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors } = useForm<{
        email: string;
        password: string;
        remember: boolean;
    }>({
        email: '',
        password: '',
        remember: false,
    });

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post('/admin/login');
    }

    return (
        <>
            <Head title="Sign in" />
            <div className="relative grid min-h-svh lg:grid-cols-2">
                {/* Left branded panel */}
                <div className="relative hidden flex-col p-10 text-primary lg:flex dark:border-r">
                    <div className="absolute inset-0 bg-primary/5" />
                    <div className="relative z-20 flex items-center">
                        {admin.logo ? (
                            <img src={admin.logo} alt={admin.name || 'GC Communication'} className="h-9 w-auto" />
                        ) : (
                            <span className="text-lg font-bold">{admin.name || 'GC Communication'}</span>
                        )}
                    </div>
                    <div className="relative z-20 mt-auto">
                        <blockquote className="space-y-2">
                            <p className="text-xl font-semibold leading-snug text-balance">
                                Your control center for catalogue, brands, and customers.
                            </p>
                            <footer className="text-sm text-muted-foreground">
                                {admin.name || 'GC Communication'} — Admin
                            </footer>
                        </blockquote>
                    </div>
                </div>

                {/* Right form panel */}
                <div className="flex items-center justify-center p-6 md:p-10">
                    <div className="mx-auto flex w-full flex-col justify-center gap-6 sm:w-[350px]">
                        <div className="flex flex-col gap-2 text-center">
                            {admin.logo ? (
                                <img src={admin.logo} alt={admin.name || 'GC Communication'} className="mx-auto h-10 w-auto lg:hidden" />
                            ) : (
                                <span className="text-lg font-bold lg:hidden">{admin.name || 'GC Communication'}</span>
                            )}
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Welcome back
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Enter your credentials to access the admin panel
                            </p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="you@gccommunication.in"
                                    autoComplete="email"
                                    autoFocus
                                    required
                                />
                                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        required
                                        className="pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="remember"
                                    checked={data.remember}
                                    onCheckedChange={(v) => setData('remember', !!v)}
                                />
                                <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
                                    Remember me
                                </Label>
                            </div>

                            <Button type="submit" className="w-full" disabled={processing}>
                                {processing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign in'
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
