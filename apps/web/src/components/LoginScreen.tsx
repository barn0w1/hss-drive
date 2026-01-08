import { useState, useEffect } from 'react';
import { useDriveStore } from '@/store';
import { Loader2, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export function LoginScreen() {
    const login = useDriveStore(s => s.login);
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(username);
        } catch (err) {
            setError('Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-white font-sans overflow-hidden">
             {/* Left Art Side */}
             <div className="hidden lg:flex w-[60%] bg-[#0A0F1C] relative overflow-hidden items-center justify-center p-12">
                 {/* Mesh Gradient Background */}
                 <div className="absolute inset-0 opacity-40">
                     <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-purple-900/40 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{animationDuration: '10s'}}/>
                     <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[80%] bg-blue-900/40 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{animationDuration: '15s'}}/>
                     <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] bg-indigo-900/30 rounded-full blur-[80px] mix-blend-screen" />
                 </div>
                 
                 {/* Content */}
                 <div className={clsx(
                     "relative z-10 text-white max-w-2xl transition-all duration-1000 ease-out transform",
                     mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                 )}>
                    <div className="mb-6 w-16 h-16 border border-white/20 rounded-2xl flex items-center justify-center bg-white/5 backdrop-blur-md">
                        <div className="w-8 h-8 bg-gradient-to-tr from-blue-400 to-purple-500 rounded-full" /> 
                    </div>
                    <h1 className="text-6xl font-extrabold tracking-tight leading-tight mb-4">
                        HSS Drive
                    </h1>
                    <p className="text-xl text-gray-400 font-light tracking-wide max-w-lg leading-relaxed">
                        Immutable Storage Architecture <br/>
                        <span className="text-gray-500 text-base">Secure. Decentralized. Content-Addressable.</span>
                    </p>
                 </div>

                 {/* Grain overlay */}
                 <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`}} />
             </div>

             {/* Right Interaction Side */}
             <div className="flex-1 w-full bg-white flex flex-col items-center justify-center p-8 lg:p-12 relative">
                 <div className={clsx(
                     "w-full max-w-md transition-all duration-1000 delay-100 ease-out transform",
                     mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                 )}>
                     <div className="mb-8">
                         <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                         <p className="text-gray-500">Enter your developer credentials to access the node.</p>
                     </div>

                     <form onSubmit={handleSubmit} className="space-y-6">
                         <div className="space-y-2">
                             <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">Username</label>
                             <div className="group relative">
                                 <input 
                                    type="text" 
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="block w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-100 focus:bg-gray-50 outline-none transition-all"
                                    placeholder="Enter your username"
                                    required
                                 />
                             </div>
                         </div>

                         {error && (
                             <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2">
                                 <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                 {error}
                             </div>
                         )}

                         <div className="space-y-4 pt-2">
                             {/* Primary Button */}
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-[#0F172A] text-white h-12 rounded-xl font-medium tracking-wide hover:bg-[#1E293B] hover:shadow-lg hover:translate-y-[-1px] active:translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                                {!loading && <ArrowRight className="w-4 h-4 opacity-50" />}
                            </button>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-gray-100"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-300 text-xs font-medium uppercase tracking-widest">Or</span>
                                <div className="flex-grow border-t border-gray-100"></div>
                            </div>

                            {/* Secondary Button */}
                            <a 
                                href="/api/auth/discord"
                                className="w-full bg-white border border-gray-200 text-gray-600 h-12 rounded-xl font-medium tracking-wide hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 transition-all duration-200 flex items-center justify-center gap-3 relative overflow-hidden group no-underline"
                            >
                                <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z"/>
                                </svg>
                                <span>Continue with Discord</span>
                            </a>
                         </div>
                     </form>

                     <p className="mt-12 text-center text-xs text-gray-400">
                         © 2026 HSS Storage network. All rights reserved.
                     </p>
                 </div>
             </div>
        </div>
    );
}

