import { useState } from 'react'
import { Link,useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
const frErr=m=>{
 const t=String(m||'')
 if(/Invalid login credentials/i.test(t)) return 'E-mail ou mot de passe incorrect.'
 if(/Email not confirmed/i.test(t)) return "E-mail non confirmé : cliquez sur le lien reçu par e-mail, puis reconnectez-vous."
 if(/already registered|already been registered/i.test(t)) return 'Un compte existe déjà avec cet e-mail. Connectez-vous.'
 if(/rate limit|too many/i.test(t)) return "Trop de tentatives ou d'e-mails envoyés. Patientez une heure ou désactivez la confirmation par e-mail dans Supabase (Authentication > Providers > Email)."
 if(/Database error saving new user/i.test(t)) return "Base de données non initialisée : exécutez supabase/migrations/001_schema.sql dans Supabase."
 if(/Signups not allowed/i.test(t)) return "Les inscriptions sont désactivées dans Supabase (Authentication > Providers > Email)."
 if(/Failed to fetch|NetworkError/i.test(t)) return "Connexion à Supabase impossible : vérifiez Internet et l'URL dans .env."
 if(/Invalid API key|apikey/i.test(t)) return "Clé Supabase invalide : vérifiez VITE_SUPABASE_ANON_KEY dans .env (clé « anon »)."
 return t
}
export default function Auth({mode}){
 const a=useAuth(),nav=useNavigate(),[f,setF]=useState({email:'',password:'',name:'',role:'buyer'}),[err,setErr]=useState(''),[ok,setOk]=useState(''),[busy,setBusy]=useState(false)
 const set=k=>e=>setF({...f,[k]:e.target.value})
 if(!a.configured) return <div className="form narrow"><h1>Connexion indisponible</h1><p className="demo">Supabase n'est pas configuré : le site est en mode démonstration et ne peut ni créer de compte ni connecter.</p>
  <ol><li>Créez un projet gratuit sur supabase.com.</li><li>Exécutez les fichiers SQL du dossier <code>supabase/</code> (voir README).</li><li>Copiez <code>.env.example</code> en <b>.env</b> (nom exact, sans .txt) à la racine du projet.</li><li>Renseignez <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code>.</li><li><b>Arrêtez puis relancez</b> <code>npm run dev</code> : Vite ne relit pas .env à chaud.</li></ol></div>
 const submit=async e=>{e.preventDefault();setErr('');setOk('')
  if(mode!=='reset'&&!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Adresse e-mail invalide.')
  if(mode!=='forgot'&&f.password.length<8) return setErr('Mot de passe : 8 caractères minimum.')
  if(mode==='register'&&!f.name.trim()) return setErr('Nom obligatoire.')
  setBusy(true)
  const r=mode==='login'?await a.signIn(f.email,f.password):mode==='register'?await a.signUp(f.email,f.password,f.name,f.role):mode==='forgot'?await a.forgot(f.email):await a.updatePassword(f.password)
  setBusy(false)
  if(r.error) return setErr(frErr(r.error.message))
  if(mode==='login'||(mode==='register'&&r.data?.session)) nav('/'); else setOk(mode==='register'?'Compte créé. Un e-mail de confirmation vous a été envoyé : cliquez sur le lien, puis connectez-vous.':mode==='forgot'?'Si ce compte existe, un e-mail de réinitialisation a été envoyé.':'Mot de passe modifié.')}
 const title={login:'Connexion',register:'Créer un compte',forgot:'Mot de passe oublié',reset:'Nouveau mot de passe'}[mode]
 return <form className="form narrow" onSubmit={submit}><h1>{title}</h1>
  {mode==='register'&&<><label>Nom complet<input value={f.name} onChange={set('name')}/></label><label>Je suis<select value={f.role} onChange={set('role')}><option value="buyer">Acheteur</option><option value="farmer">Producteur</option></select></label></>}
  {mode!=='reset'&&<label>E-mail<input type="email" value={f.email} onChange={set('email')} autoComplete="email"/></label>}
  {mode!=='forgot'&&<label>Mot de passe<input type="password" value={f.password} onChange={set('password')} autoComplete={mode==='login'?'current-password':'new-password'}/></label>}
  <button className="btn" disabled={busy}>{busy?'Veuillez patienter…':title}</button>{err&&<p className="err" role="alert">{err}</p>}{ok&&<p className="okmsg">{ok}</p>}
  {mode==='login'&&<p><Link to="/forgot-password">Mot de passe oublié ?</Link> · <Link to="/register">Créer un compte</Link></p>}</form>
}
