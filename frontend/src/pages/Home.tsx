import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export default function Home() {
    return (
        <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-50">
            {/* Minimal Hero Section */}
            <div className="container mx-auto px-4 py-24 md:py-32">
                <div className="max-w-3xl mx-auto text-center space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            Stream Simply.
                        </h1>
                        <p className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 font-light leading-relaxed">
                            WebRTC to HLS streaming. Ultra-low latency. <br className="hidden md:block" />
                            No clutter, just content.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <Link to="/stream">
                            <Button variant="primary" size="lg" className="h-12 px-8 w-full sm:w-auto">
                                Start Streaming
                            </Button>
                        </Link>
                        <Link to="/watch">
                            <Button variant="secondary" size="lg" className="h-12 px-8 w-full sm:w-auto">
                                Watch Live
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Feature Grid - Clean & Minimal */}
            <div className="border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/30">
                <div className="container mx-auto px-4 py-24">
                    <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
                        <div className="space-y-4">
                            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                                <svg className="w-5 h-5 text-zinc-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold">Low Latency</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                Optimized WebRTC ingestion with HLS delivery ensures your content reaches viewers instantly.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                                <svg className="w-5 h-5 text-zinc-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold">Scalable</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                Built to handle multiple inputs and scale effortlessly with your audience growth.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                                <svg className="w-5 h-5 text-zinc-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold">Production Ready</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                Professional grade transcoding with adaptive bitrate support for reliable playback.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Minimal Footer */}
            <footer className="border-t border-zinc-100 dark:border-zinc-900 py-12 text-center text-zinc-500 dark:text-zinc-500 text-sm">
                <p>&copy; {new Date().getFullYear()} MediaSoup Streaming. Minimal by Design.</p>
            </footer>
        </div>
    );
}
