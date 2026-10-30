import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase'
import { setUserProfile } from '../lib/data'
import Brand from '../components/Brand'
import { ArrowUpRight, Eye, EyeOff, Wrench } from 'lucide-react'
import { toast } from '../lib/toast'
export default function Auth({signup=false}){
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[show,setShow]=useState(false),[busy,setBusy]=useState(false)
 const navigate=useNavigate(),location=useLocation()
 const finish=()=>navigate(location.state?.from||'/account',{replace:true})
 const submit=async e=>{e.preventDefault();setBusy(true);try{
  if(signup){const cred=await createUserWithEmailAndPassword(auth,email,password);if(name)await updateProfile(cred.user,{displayName:name});await setUserProfile({...cred.user,displayName:name||cred.user.displayName})}
  else await signInWithEmailAndPassword(auth,email,password)
  finish()
 }catch(err){toast(err.message.replace('Firebase:','').replace('(auth/','('))}finally{setBusy(false)}}
 const google=async()=>{setBusy(true);try{const result=await signInWithPopup(auth,new GoogleAuthProvider());await setUserProfile(result.user);finish()}catch(e){toast(e.message)}finally{setBusy(false)}}
 const reset=async()=>{if(!email)return toast('Enter your email address first');try{await sendPasswordResetEmail(auth,email);toast('Password reset email sent')}catch(e){toast(e.message)}}
 return <div className="min-h-[78vh] grid lg:grid-cols-2">
  <div className="bg-ink text-white p-8 md:p-14 lg:p-20 flex flex-col justify-between min-h-[360px]"><Brand light/><div className="max-w-lg py-12"><p className="text-safety text-xs tracking-[.22em] font-bold uppercase">The workshop starts here</p><h1 className="font-display text-5xl md:text-6xl font-bold leading-[1.02] tracking-tight mt-5">{signup?'Make room for better work.':'Good to have you back.'}</h1><p className="text-white/55 leading-7 mt-6 max-w-sm">Your tools, your orders and everything you need to keep the work moving.</p></div><div className="flex items-center gap-3 text-xs text-white/40"><Wrench size={16}/> EQUIPPED FOR THE EVERYDAY EXPERT</div></div>
  <div className="flex items-center justify-center p-6 md:p-12"><div className="w-full max-w-md"><p className="eyebrow">{signup?'CREATE YOUR ACCOUNT':'MEMBER ACCESS'}</p><h2 className="font-display text-4xl font-bold mt-3">{signup?'Join HandyMan':'Sign in'}</h2><p className="text-muted text-sm mt-3">{signup?'A better-equipped workshop begins with an account.':'Pick up where you left off.'}</p>
   <form onSubmit={submit} className="mt-9 grid gap-4">{signup&&<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" className="field"/>}<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" className="field"/><div className="relative"><input required minLength={6} type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="field pr-12"/><button type="button" onClick={()=>setShow(!show)} className="absolute right-4 top-4 text-muted">{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>
    {!signup&&<button type="button" onClick={reset} className="text-xs text-right text-muted hover:text-safety">Forgot password?</button>}
    <button disabled={busy} className="bg-safety text-white rounded-full py-4 font-bold flex justify-center items-center gap-2">{busy?'Please wait…':signup?'Create account':'Sign in'} <ArrowUpRight size={17}/></button>
   </form>
   <div className="flex items-center gap-4 my-6 text-xs text-muted"><span className="h-px bg-line flex-1"/><span>OR CONTINUE WITH</span><span className="h-px bg-line flex-1"/></div>
   <button onClick={google} disabled={busy} className="w-full rounded-full border border-line py-3 text-sm font-bold hover:bg-white">Continue with Google</button>
   <p className="text-sm text-muted text-center mt-7">{signup?'Already have an account?':'New to HandyMan?'} <Link className="text-safety font-bold" to={signup?'/signin':'/signup'}>{signup?'Sign in':'Create an account'}</Link></p>
  </div></div>
 </div>
}