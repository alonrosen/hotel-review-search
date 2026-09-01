import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

interface HeaderProps {
  title?: string;
  icon?: string;
  children?: React.ReactNode;
  activePath?: string;
}

export default function Header({ 
  title = "Hotel Review Search", 
  icon = "🔍", 
  children,
  activePath = "/" 
}: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="header" style={children ? { paddingBottom: 0 } : undefined}>
      <div className="container header-inner" style={children ? { marginBottom: 16 } : undefined}>
        <div className="logo">
          <div className="logo-icon">{icon}</div>
          {title}
        </div>
        
        {user && user.status === 'active' && (
          <div className="nav-links" style={{ flex: 1, display: "flex", gap: 24, marginLeft: 32 }}>
            <Link href="/" className={`nav-link ${activePath === '/' ? 'active' : ''}`}>
              Search
            </Link>
            {user.role === 'admin' && (
              <Link href="/admin" className={`nav-link ${activePath === '/admin' ? 'active' : ''}`}>
                Admin
              </Link>
            )}
            {user.role !== 'admin' && (
              <Link href="/request-hotel" className={`nav-link ${activePath === '/request-hotel' ? 'active' : ''}`}>
                Request Hotel
              </Link>
            )}
          </div>
        )}

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginLeft: 'auto' }}>
            <Link href="/profile" style={{ color: "var(--text-secondary)", fontSize: 13, textDecoration: "none" }}>
              {user.name}
            </Link>
            <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginLeft: 'auto' }}>
            <Link href="/login" className="btn btn-primary btn-sm">Login</Link>
          </div>
        )}
      </div>
      {children}
    </header>
  );
}
