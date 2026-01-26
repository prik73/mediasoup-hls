import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ThemeToggle';
import { Input } from '../components/ui/Input';

export default function Home() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleStartStreaming = async () => {
        if (!password) {
            setError('Please enter a password');
            return;
        }

        try {
            setIsLoading(true);
            setError('');

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (data.valid) {
                navigate('/stream', { state: { password } });
            } else {
                setError('Invalid password');
            }
        } catch (err) {
            console.error('Auth verification failed:', err);
            setError('Failed to verify password. Server might be down.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 animate-page-enter flex flex-col">
            {/* Header */}
            <header className="border-b border-border">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">

                        <h1 className="text-lg font-semibold tracking-tight text-foreground">MediaSoup Streaming</h1>
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            <main className="flex-1">
                {/* Minimal Hero Section */}
                <div className="container mx-auto px-4 py-24 md:py-32">
                    <div className="max-w-3xl mx-auto text-center space-y-8">
                        <div className="space-y-4">
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-primary">
                                Stream Simply.
                            </h1>
                            <p className="text-xl md:text-2xl text-muted-foreground font-light leading-relaxed">
                                WebRTC to HLS streaming. Ultra-low latency. <br className="hidden md:block" />
                                No clutter, just content.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 items-end">
                            <div className="w-full sm:w-auto flex flex-col gap-2">
                                <Input
                                    type="password"
                                    placeholder="Admin Password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (error) setError('');
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleStartStreaming()}
                                    className="h-12 w-full sm:w-64 bg-background border-input text-foreground"
                                    error={error}
                                />
                                <Button
                                    variant="primary"
                                    size="lg"
                                    className="h-12 px-8 w-full"
                                    onClick={handleStartStreaming}
                                    isLoading={isLoading}
                                >
                                    Start Streaming
                                </Button>
                            </div>
                            <Link to="/watch">
                                <Button variant="secondary" size="lg" className="h-11 px-6 w-full sm:w-auto bg-background border border-input hover:bg-accent hover:text-accent-foreground text-foreground">
                                    Watch Live
                                </Button>
                            </Link>
                        </div>

                        <div className="pt-8 text-center text-sm text-muted-foreground animate-fade-in opacity-100">
                            To run the setup locally in high quality, explore <a href="https://github.com/prik73/mediasoup-docker-setup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline underline-offset-4 font-medium">this</a>.<br />
                            Check <a href="https://github.com/prik73/mediasoup-hls" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline underline-offset-4 font-medium">this</a> to see the whole architecture.<br />
                            Read <a href="https://mediasoup.org/documentation/v3/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline underline-offset-4 font-medium">this</a> to read the mediasoup docs.
                        </div>
                    </div>
                </div>

                {/* Feature Grid - Clean & Minimal
                <div className="border-t border-border bg-muted/30">
                    <div className="container mx-auto px-4 py-16">
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="text-3xl font-bold tracking-tight">useless stuff to fill up the space</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Everything you need to broadcast high-quality video with minimal latency.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
                            <div className="space-y-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-foreground">Low Latency</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Optimized WebRTC ingestion with HLS delivery ensures your content reaches viewers instantly.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-foreground">Scalable</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Built to handle multiple inputs and scale effortlessly with your audience growth.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-foreground">Production Ready</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Professional grade transcoding with adaptive bitrate support for reliable playback.
                                </p>
                            </div>
                        </div>
                    </div>
                </div> */}
            </main>

            {/* Minimal Footer */}
            <footer className="border-t border-border py-6 text-center text-muted-foreground text-sm">
                <p>&copy; {new Date().getFullYear()} - 20__ till the time I am able to pay aws bill. :) for this deployment </p>
            </footer>
        </div>
    );
}
