import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, setDoc } from 'firebase/firestore'
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
export async function getUserOrders(uid) {
  const snap = await getDocs(query(ordersRef, where('uid', '==', uid), orderBy('createdAt', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
export async function getAllOrders() {
  const snap = await getDocs(query(ordersRef, orderBy('createdAt', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
export async function setUserProfile(user, extra = {}) {
  return setDoc(doc(db, 'users', user.uid), {
    uid: user.uid, name: user.displayName || '', email: user.email || '',
    photoURL: user.photoURL || '', role: 'customer', ...extra, updatedAt: serverTimestamp()
  }, { merge: true })
}
export async function getProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}
export async function getReviews(productId) {
  const snap = await getDocs(query(reviewsRef, where('productId', '==', productId), orderBy('createdAt', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
export async function addReview(data) {
  return addDoc(reviewsRef, { ...data, createdAt: serverTimestamp() })
}
