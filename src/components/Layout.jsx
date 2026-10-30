import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../context/AuthContext'
import Brand from './Brand'
import { ArrowUpRight, LogOut, ShieldCheck, ShoppingBag, UserRound } from 'lucide-react'

const nav = [{ label: 'Home', to: '/' }, { label: 'Shop', to: '/products' }]
const navClass = ({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`

export default function Layout() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  return <div className="min-h-screen flex flex-col overflow-x-clip">
    <div className="topline"><span>Tools for the work that matters</span><span className="hidden sm:inline">Dependable essentials · Straightforward service</span></div>
    <header className="site-header">
      <div className="header-main">
        <Brand />
        <nav className="desktop-nav" aria-label="Main navigation">
          {nav.map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navClass}>{item.label}</NavLink>)}
          {user && <NavLink to="/account" className={navClass}>My account</NavLink>}
          {isAdmin && <NavLink to="/admin" className={navClass}>Admin</NavLink>}
        </nav>
        <div className="header-actions">
          {user ? <>
            <button onClick={() => navigate('/account')} className="account-button"><UserRound size={16}/><span>{user.displayName?.split(' ')[0] || 'Account'}</span></button>
            <button aria-label="Sign out" title="Sign out" onClick={async () => { await signOut(auth); navigate('/') }} className="icon-button hidden sm:inline-flex"><LogOut size={17}/></button>
          </> : <Link to="/signin" className="signin-link">Sign in <ArrowUpRight size={15}/></Link>}
          <Link to="/products" aria-label="Shop products" className="shop-button"><ShoppingBag size={17}/><span className="hidden sm:inline">Shop</span></Link>
        </div>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <NavLink to="/" end className={navClass}>Home</NavLink>
        <NavLink to="/products" className={navClass}>Shop all</NavLink>
        {user ? <NavLink to="/account" className={navClass}>Account</NavLink> : <NavLink to="/signin" className={navClass}>Sign in</NavLink>}
        {isAdmin && <NavLink to="/admin" className={navClass}>Admin</NavLink>}
      </nav>
    </header>
    <main className="flex-1"><Outlet /></main>
    <footer className="site-footer"><div className="footer-inner">
      <div className="footer-brand"><Brand light/><p>Dependable tools for workshops, job sites and the people who make things happen.</p><div className="footer-proof"><ShieldCheck size={15}/> Selected for practical, everyday work</div></div>
      <div className="footer-column"><p className="footer-heading">Explore</p><Link to="/">Home</Link><Link to="/products">All products</Link><Link to="/account">My account</Link></div>
      <div className="footer-column footer-contact"><p className="footer-heading">Need a hand?</p><p>Questions about a product or an order? Our team is here to help.</p><Link to="/contact" className="footer-contact-link">Contact the team <ArrowUpRight size={15}/></Link></div>
    </div><div className="footer-bottom"><span>© {new Date().getFullYear()} HandyMan Tools</span><span>Built for the work that matters.</span></div></footer>
  </div>
}
