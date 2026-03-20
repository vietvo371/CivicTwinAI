export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  // Citizen layout is mostly full-screen public facing, no sidebar or strict Auth Guard
  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <header className="absolute top-0 left-0 right-0 p-4 z-50 flex justify-between items-center pointer-events-none">
        <h1 className="text-xl font-bold font-heading text-foreground drop-shadow-md pointer-events-auto">
          CivicTwin <span className="text-primary">Public Portal</span>
        </h1>
        {/* User can login if they want */}
        <a href="/login" className="px-4 py-2 bg-card/80 backdrop-blur-md rounded-xl text-sm font-semibold hover:bg-accent hover:text-accent-foreground pointer-events-auto transition-colors border border-border shadow-lg">
          Sign In
        </a>
      </header>
      <main>
        {children}
      </main>
    </div>
  );
}
