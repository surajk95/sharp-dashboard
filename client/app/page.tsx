import Dashboard from './components/dashboard';

export default function Home() {
  return (
    <div className="min-h-screen p-4">
      <header className="flex items-center h-14 border-b">
        <h1 className="text-xl font-bold">Sharp Dashboard</h1>
      </header>
      <main className="max-w-7xl mx-auto py-6 min-h-screen">
        <Dashboard />
      </main>
      <footer className="flex items-center h-14 border-t">
        <a href="https://fvrtrp.com" target="_blank" className="text-sm text-gray-500 hover:text-green-500 hover:underline">
          fvrtrp.com
        </a>
      </footer>
    </div>
  );
}
