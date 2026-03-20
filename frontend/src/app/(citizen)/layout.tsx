export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  // Citizen layout is mostly full-screen public facing, no sidebar or strict Auth Guard
  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 relative">
      <header className="absolute top-0 left-0 right-0 p-4 z-50 flex justify-between items-center pointer-events-none">
        <h1 className="text-xl font-bold font-heading text-slate-100 drop-shadow-md pointer-events-auto">
          CivicTwin <span className="text-emerald-400">Public Portal</span>
        </h1>
        {/* User can login if they want */}
        <a href="/login" className="px-4 py-2 bg-slate-800/80 backdrop-blur-md rounded-xl text-sm font-semibold hover:bg-slate-700 pointer-events-auto transition-colors border border-slate-700/50 shadow-lg">
          Đăng Nhập
        </a>
      </header>
      <main className="w-full h-screen">
        {children}
      </main>
    </div>
  );
}
