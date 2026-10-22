import { useState } from 'react'
import { Link,Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fcfa } from '../utils/format'
export const Img=({src,alt,className})=>{const [s,setS]=useState(src||'/images/placeholder.svg');return <img className={className} src={s} alt={alt} loading="lazy" onError={()=>setS('/images/placeholder.svg')}/>}
export const Loading=()=><p className="state" role="status">Chargement…</p>
export const Empty=({children})=><p className="state">{children}</p>
export const ErrorMsg=({children})=><p className="state err" role="alert">{children}</p>
export const DemoBanner=()=>{const {configured}=useAuth();return configured?null:<p className="demo">Mode démonstration : Supabase n'est pas configuré. Les produits affichés sont fictifs et la connexion est désactivée.</p>}
export function ProductCard({p}){
 return <article className="pcard"><Link to={`/products/${p.id}`}><Img src={p.images?.[0]} alt={p.alt||`Photo : ${p.name}`}/></Link>
  <div><span className="tag">{p.categories?.name}</span>{p.demo&&<span className="tag warn">Fictif</span>}<h3>{p.name}</h3>
  <p><b>{fcfa(p.price)}</b> / {p.unit}</p><p className="muted">{p.commune}</p><Link className="btn small" to={`/products/${p.id}`}>Voir l'annonce</Link></div></article>
}
// Confort de navigation uniquement : la vraie protection est assurée par les politiques RLS Supabase.
export function Protected({roles,children}){
 const {user,role,loading,configured}=useAuth()
 if(!configured) return <ErrorMsg>Connexion indisponible : Supabase n'est pas configuré.</ErrorMsg>
 if(loading) return <Loading/>
 if(!user) return <Navigate to="/login" replace/>
 if(roles&&!roles.includes(role)) return <ErrorMsg>Accès refusé pour votre rôle.</ErrorMsg>
 return children
}
