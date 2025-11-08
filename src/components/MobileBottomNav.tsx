import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Plus,
  Users,
  Settings
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { usePermissions } from '@/hooks/use-permissions';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, resource: 'Complaints' },
  { title: 'Complaints', url: '/complaints', icon: FileText, resource: 'Complaints' },
  { title: 'New', url: '/complaints/new', icon: Plus, isCenter: true, resource: 'Complaints' },
  { title: 'Users', url: '/users', icon: Users, resource: 'Users' },
  { title: 'Settings', url: '/settings', icon: Settings, resource: 'Settings' }
];

export function MobileBottomNav() {
  const { user } = useAuth();
  const { canView } = usePermissions();

  const visibleNavItems = navItems.filter(item => canView(item.resource));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden shadow-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full gap-1.5 transition-all ${
                item.isCenter
                  ? 'relative'
                  : ''
              } ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            {item.isCenter ? (
              <>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/20">
                  <item.icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium">{item.title}</span>
              </>
            ) : (
              <>
                <item.icon className="h-6 w-6" />
                <span className="text-xs font-medium">{item.title}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
