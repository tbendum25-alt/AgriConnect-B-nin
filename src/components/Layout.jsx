import { useState } from 'react'
import { Link,NavLink,Outlet,useNavigate } from 'react-router-dom'
import { Sprout,Menu,X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { DemoBanner } from './common'
export default function Layout(){
 const {user,role,signOut}=useAuth(),[open,setOpen]=useState(false),nav=useNavigate()
 const home={farmer:'/dashboard/farmer',buyer:'/dashboard/buyer',admin:'/admin'}[role]||'/login'
 const L=[['/marketplace','Produits'],['/categories','Catégories'],['/how-it-works','Comment ça marche ?'],['/about','À propos'],['/contact','Contact']]
 return <><DemoBanner/><header className="top"><Link to="/" className="logo"><Sprout/> AgriConnect Bénin</Link>
  <button className="burger" aria-label="Menu" aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
  <nav className={open?'open':''} onClick={()=>setOpen(false)}>{L.map(([p,t])=><NavLink key={p} to={p}>{t}</NavLink>)}
   {user?<><Link className="btn small" to={home}>Mon espace</Link><button className="btn small ghost" onClick={async()=>{await signOut();nav('/')}}>Déconnexion</button></>:<><Link className="btn small ghost" to="/login">Connexion</Link><Link className="btn small" to="/register">Créer un compte</Link></>}</nav></header>
  <main><Outlet/></main>
  <footer><div><b>AgriConnect Bénin</b><p>Plateforme de mise en relation. Elle ne garantit ni la qualité des produits, ni les transactions.</p><p>Photos : <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer">Pexels</a></p></div>
  <div><Link to="/legal/terms">Conditions d'utilisation</Link><Link to="/legal/privacy">Confidentialité</Link><Link to="/legal/rules">Règles de publication</Link><Link to="/contact">Contact</Link></div></footer></>
}
