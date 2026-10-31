import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp, runTransaction } from 'firebase/firestore'
import { db } from '../firebase'

export const productsRef = collection(db, 'products')
export const ordersRef = collection(db, 'orders')
export const usersRef = collection(db, 'users')
export const reviewsRef = collection(db, 'reviews')

export async function getProducts() {
  const snap = await getDocs(query(productsRef, orderBy('createdAt', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
export async function getProduct(id) {
  const snap = await getDoc(doc(db, 'products', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}
export async function saveProduct(data, id) {
  const payload = { ...data, updatedAt: serverTimestamp() }
  if (id) return updateDoc(doc(db, 'products', id), payload)
  return addDoc(productsRef, { ...payload, createdAt: serverTimestamp() })
}
export async function removeProduct(id) { return deleteDoc(doc(db, 'products', id)) }
export async function createOrder(data) {
  return addDoc(ordersRef, { ...data, status: 'pending', paymentStatus: 'unpaid', createdAt: serverTimestamp() })
}
// Avoid a composite index dependency; sort after fetching the user's own orders.
export async function getUserOrders(uid) {
  const snap = await getDocs(query(ordersRef, where('uid', '==', uid)))
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => {
    const at = a.createdAt?.toMillis?.() ?? (Date.parse(a.createdAt || 0) || 0)
const bt = b.createdAt?.toMillis?.() ?? (Date.parse(b.createdAt || 0) || 0)
    return bt - at
  })
}
export async function getAllOrders() {
  const snap = await getDocs(query(ordersRef, orderBy('createdAt', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
// Never overwrite an existing profile's role during sign-in/profile initialization.
export async function setUserProfile(user, extra = {}) {
  const userRef = doc(db, 'users', user.uid)
  return runTransaction(db, async transaction => {
    const existing = await transaction.get(userRef)
    if (existing.exists()) return existing.data()
    const profile = { uid: user.uid, name: user.displayName || '', email: user.email || '', photoURL: user.photoURL || '', role: 'customer', ...extra, updatedAt: serverTimestamp() }
    transaction.set(userRef, profile)
    return profile
  })
}
export async function getProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}
// Load a bounded first page so a product with a large review history does not
// delay its detail page. Filtering by productId alone uses Firestore's automatic index.
export async function getReviews(productId, pageSize = 20) {
  const safePageSize = Math.min(50, Math.max(1, Number(pageSize) || 20))
  const snap = await getDocs(query(reviewsRef, where('productId', '==', productId), limit(safePageSize)))
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => {
    const at = a.createdAt?.toMillis?.() ?? (Date.parse(a.createdAt || 0) || 0)
    const bt = b.createdAt?.toMillis?.() ?? (Date.parse(b.createdAt || 0) || 0)
    return bt - at
  })
}
// Review creation is handled by the Worker, which verifies a paid order server-side.
export async function addReview(data, idToken) {
  const workerUrl = import.meta.env.VITE_PAYMENT_WORKER_URL?.replace(/\/+$/, '')

  if (!workerUrl) {
    throw new Error('Review service URL is not configured.')
  }

  const response = await fetch(`${workerUrl}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify(data)
  })

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(result.error || 'Could not submit review.')
  }

  return result
}
