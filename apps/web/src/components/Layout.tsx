import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Layout() {
  const auth = useAuth();
  return <div className="app-shell"><header><Link className="brand" to="/"><span className="brand-mark">R</span><span>Referral</span></Link><span className="header-note">邀请，让价值自然流动</span>{auth.user && <div className="header-user"><span>{auth.user.name}</span><button className="ghost-button" onClick={auth.logout}>退出</button></div>}</header><Outlet /><footer>Referral Demo · Secure invitation flow</footer></div>;
}
