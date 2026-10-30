import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../context/AuthContext'
import Brand from './Brand'
import { ShoppingBag, UserRound, Menu, LogOut, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'
export default function Layout() {
  const { user, isAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const nav = [['Shop','/products'],['About','/about'],['Contact','/contact']]
  return <div className="min-h-screen flex flex-col">
    <div className="bg-ink text-white/80 text-[11px] tracking-[.12em] text-center py-2 uppercase">Built for makers · Trusted for the long run</div>
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-5 h-[78px] flex items-center justify-between gap-5">
        <Brand />
        <nav className="hidden md:flex items-center gap-9 text-sm font-semibold">
          {nav.map(([label,path]) => <NavLink key={path} to={path} className={({isActive}) => isActive ? 'text-safety' : 'text-ink/70 hover:text-ink'}>{label}</NavLink>)}
        </nav>
        <div className="flex items-center gap-2">
          {user ? <><button onClick={() => navigate('/account')} className="hidden sm:flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold"><UserRound size={16}/>{user.displayName?.split(' ')[0] || 'Account'}</button>
            {isAdmin && <Link to="/admin" className="hidden lg:flex items-center gap-2 text-sm font-semibold"><LayoutDashboard size={16}/> Admin</Link>}
            <button aria-label="Sign out" onClick={async()=>{await signOut(auth);navigate('/')}} className="p-2"><LogOut size={18}/></button>
          </> : <Link to="/signin" className="hidden sm:inline-flex rounded-full bg-ink text-white px-5 py-3 text-sm font-semibold">Sign in</Link>}
          <Link to="/products" aria-label="Shop products" className="rounded-full bg-safety text-white p-3"><ShoppingBag size={18}/></Link>
          <button onClick={()=>setOpen(!open)} className="md:hidden p-2" aria-label="Toggle menu"><Menu/></button>
        </div>
      </div>
      {open && <div className="md:hidden border-t border-line p-5 grid gap-4">{nav.map(([l,p])=><Link onClick={()=>setOpen(false)} key={p} to={p}>{l}</Link>)}<Link to={user?'/account':'/signin'} onClick={()=>setOpen(false)}>{user?'My account':'Sign in'}</Link></div>}
    </header>
    <main className="flex-1"><Outlet/></main>
    <footer className="bg-ink text-white mt-20">
      <div className="max-w-7xl mx-auto px-5 py-14 grid md:grid-cols-3 gap-10">
        <div><Brand light/><p className="text-white/55 text-sm mt-5 max-w-xs leading-7">Dependable tools for workshops, job sites and the people who make things happen.</p></div>
        <div><p className="font-display font-semibold mb-4">Explore</p><div className="grid gap-3 text-sm text-white/60"><Link to="/products">All products</Link><Link to="/about">Our story</Link><Link to="/contact">Contact</Link></div></div>
        <div><p className="font-display font-semibold mb-4">Need a hand?</p><p className="text-sm text-white/60 leading-7">Questions about a product or an order? Reach out through our contact page.</p><Link to="/contact" className="inline-block mt-4 text-safety text-sm font-bold">Get in touch ↗</Link></div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/40">© {new Date().getFullYear()} HandyMan Tools. Built for the work that matters.</div>
    </footer>
  </div>
}