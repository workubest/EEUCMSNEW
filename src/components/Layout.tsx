import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import logo from '@/assets/eeu-logo.png';
import NotificationCenter from './NotificationCenter';
import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { Footer } from './Footer';
import { Header } from './Header';

function LayoutContent() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toggleSidebar } = useSidebar();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />

      <div className="flex-1 flex flex-col w-full">
        <Header onMenuClick={toggleSidebar} />

        {/* Main Content */}
        <main className={`flex-1 overflow-auto p-6 lg:p-8 ${isMobile ? 'pb-20' : ''}`}>
          <Outlet />
        </main>

        <Footer />
      </div>

      {isMobile && <MobileBottomNav />}
    </div>
  );
}

export default function Layout() {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
}
