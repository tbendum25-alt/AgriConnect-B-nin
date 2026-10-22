export const fcfa=n=>Math.round(n).toLocaleString('fr-FR')+' FCFA'
export const dateFr=s=>new Date(s).toLocaleDateString('fr-FR')
// Hypothèse à vérifier : numéro béninois = 229 + 8 chiffres, ou 229 + 01 + 8 chiffres.
export const validPhone=p=>/^229(\d{8}|01\d{8})$/.test(String(p||'').replace(/[\s+().-]/g,''))
export const whatsappLink=(phone,name)=>validPhone(phone)?`https://wa.me/${String(phone).replace(/\D/g,'')}?text=${encodeURIComponent(`Bonjour, je vous contacte au sujet de votre annonce ${name}. Le produit est-il toujours disponible ?`)}`:null
