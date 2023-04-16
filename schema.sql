create table favorite_ingredient(
id int PRIMARY KEY,
item_name varchar(500),
item_image varchar(500),
quantity int DEFAULT 1,
userID int DEFAULT 1
);

create table favorite_recipe(
id int PRIMARY KEY,
title varchar(500),
item_image varchar(500),
userID int DEFAULT 1
);