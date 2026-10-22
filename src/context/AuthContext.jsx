import { createContext,useContext,useEffect,useState } from 'react'
import { supabase } from '../lib/supabase'
const Ctx=createContext(null)
export const useAuth=()=>useContext(Ctx)
export function AuthProvider({children}){
 const [session,setSession]=useState(null),[profile,setProfile]=useState(null),[loading,setLoading]=useState(!!supabase)
 useEffect(()=>{
  if(!supabase) return
  supabase.auth.getSession().then(({data})=>{setSession(data.session);if(!data.session)setLoading(false)})
  const {data:sub}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s))
  return ()=>sub.subscription.unsubscribe()
 },[])
 useEffect(()=>{
  if(!supabase) return
  if(!session){setProfile(null);return}
  supabase.from('profiles').select('*').eq('id',session.user.id).maybeSingle().then(({data})=>{setProfile(data);setLoading(false)})
 },[session])
 const api={configured:!!supabase,user:session?.user||null,profile,role:profile?.role||null,loading,
  signIn:(email,password)=>supabase.auth.signInWithPassword({email,password}),
  signUp:(email,password,full_name,role)=>supabase.auth.signUp({email,password,options:{data:{full_name,role}}}),
  signOut:()=>supabase.auth.signOut(),
  forgot:email=>supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/reset-password'}),
  updatePassword:password=>supabase.auth.updateUser({password})}
 return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
