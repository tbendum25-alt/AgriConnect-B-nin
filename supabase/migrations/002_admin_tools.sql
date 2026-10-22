-- Étape 1 : quand un compte producteur est suspendu, ses annonces publiées sont suspendues aussi.
create function public.suspend_seller_products() returns trigger language plpgsql security definer set search_path=public as $$ begin
 if new.account_status='suspended' and old.account_status<>'suspended' then
  update products set status='suspended' where seller_id=new.id and status='approved';
 end if; return new; end $$;
create trigger suspend_products after update of account_status on profiles for each row execute function suspend_seller_products();
