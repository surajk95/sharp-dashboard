import Dashboard from './components/dashboard';

export default function Home() {
  return (
    <div className="min-h-screen p-4">
      <header className="flex items-center h-14 border-b">
        <h1 className="text-xl font-semibold">
          <span className="text-blue-500">Sharp</span>
        </h1>
      </header>
      <main className="max-w-7xl mx-auto py-6">
        <Dashboard />
      </main>
    </div>
  );
}
