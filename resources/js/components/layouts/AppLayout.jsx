import Sidebar from '../ui/Sidebar';

export default function AppLayout({ children }) {
    return (
        <div className="flex h-screen overflow-hidden bg-[var(--bg-secondary)] relative">
            <Sidebar />
            <main className="flex-1 overflow-y-auto h-screen relative z-0 bg-[var(--bg-primary)]">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-in relative z-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
