import { LogOut, Plus, ReceiptText } from 'lucide-react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '../lib/api';

const navItem = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  );

export function Layout() {
  const navigate = useNavigate();

  async function logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => null);
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
              <span className="flex size-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                <ReceiptText className="size-4" />
              </span>
              Order CRM
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <NavLink to="/" end className={navItem}>
                Orders
              </NavLink>
              <NavLink to="/orders/new" className={navItem}>
                New order
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to="/orders/new">
                <Plus className="size-4" />
                Create order
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="text-slate-600">
              <LogOut className="size-4" />
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
