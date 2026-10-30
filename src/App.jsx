import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Toast from './components/Toast'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Auth from './pages/Auth'
import Account from './pages/Account'
import Admin from './pages/Admin'
import { Contact } from './pages/Info'
import PaymentResult from './pages/PaymentResult'

function Guard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="py-32 text-center text-muted">Loading your workspace…</div>
  return user ? children : <Navigate to="/signin" replace />
}

export default function App() {
  return <BrowserRouter><AuthProvider><Routes><Route element={<Layout />}>
    <Route index element={<Home />} />
    <Route path="products" element={<Products />} />
    <Route path="products/:id" element={<ProductDetail />} />
    <Route path="contact" element={<Contact />} />
    <Route path="signin" element={<Auth />} />
    <Route path="signup" element={<Auth signup />} />
    <Route path="account" element={<Guard><Account /></Guard>} />
    <Route path="admin" element={<Guard><Admin /></Guard>} />
    <Route path="payment/success" element={<PaymentResult />} />
    <Route path="payment/cancel" element={<PaymentResult />} />
    <Route path="*" element={<div className="py-32 px-5 text-center"><h1 className="font-display text-4xl font-bold">Page not found</h1><a href="/" className="text-safety font-bold mt-4 inline-block">Back home</a></div>} />
  </Route></Routes><Toast /></AuthProvider></BrowserRouter>
}
