import { Link, Outlet } from 'react-router-dom';

export function Layout() {
  return <><header><Link className="brand" to="/">Referral</Link><span>邀请返利演示</span></header><Outlet /></>;
}
