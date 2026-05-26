export function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>AdoptaLove</h1>
      </header>
      <main>{children}</main>
    </div>
  );
}
