insert into categories(name,slug,sort_order) values
('Céréales','cereales',1),('Tubercules et racines','tubercules',2),('Légumes','legumes',3),('Fruits','fruits',4),
('Légumineuses','legumineuses',5),('Épices et condiments','epices',6),('Produits transformés','transformes',7),('Autres produits agricoles','autres',8) on conflict do nothing;
