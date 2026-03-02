import Sidebar from '../ui/Sidebar';

export default function AppLayout({ children }) {
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main
                className="flex-1 overflow-y-auto h-screen"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
