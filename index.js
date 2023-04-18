'use strict';

const express = require('express');
var cors = require('cors');
const axios = require('axios');
const { request } = require('express');
require('dotenv').config();
const { Client } = require('pg');
const app = express();
const bodyParser = require('body-parser');
const qureyString = require("querystring");

//environment variables
// IMPORTANT! create your .env file
const PORT = process.env.PORT;
const apikey = process.env.API_KEY;
const dataBaseUrl = process.env.DATABASE_URL;
const ingredients_table = process.env.INGREDIENT_TABLE; // = favorite_ingredient   *FROM SCHEMA.SQL*
const recipes_table = process.env.RECIPE_TABLE; //= favorite_recipe  *FROM SCHEMA.SQL*

const client = new Client(dataBaseUrl);
//app useages
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//---SQL Routes---
//GET Routes
app.get("/allRecipes", getAllRecipesHandler);
app.get('/allIngredients', getAllIngredientHandler); 

//POST Routs
app.post("/addRecipe", addNewRecipesHandler); 
app.post('/addIngredient', addNewIngredientHandler); 

//PUT Routs
app.put('/updateIngredient', updateHandler); 

//DELETE Routs

app.delete('/deleteRecipe', deleteRecipesHandler); 
app.delete('/deleteIngredient', deleteIngredientHandler); 

//---API Routes---
//GET Routes
app.get("/complexSearch", complexSearchHandler);

app.get("/findByIngredients", findByIngredientsHandler);

app.get('/recipeAnalyzedInstructions', analyzedInstructionsHandler);

app.get('/autoCompleteIngredient', autoCompleteHandler); 

app.get('/randomRecipes', randomRecipesHandler);

app.get('/searchIngredients', searchIngredientsHandler);

//Error Handler Routes
app.use("*", notFoundErrorHandler)// make sure to always make it the last route 


//---SQL Functions---


//GET Functions
function getAllRecipesHandler(req, res) {

    let { userID } = req.query;
    let values = [userID];
    let query = `select * from ${recipes_table} where userID=$1`;

    client.query(query, values, (error, sqlResult) => {
        if (error) {
            serverErrorHadnler(req, res, error);
        }
        else
            res.json(sqlResult.rows);
    })
}

function getAllIngredientHandler(req, res) {

    let { userID } = req.query;
    let values = [userID];
    let query = `select * from ${ingredients_table} where userID=$1;`

    client.query(query, values, (error, sqlResult) => {
        if (error) {
            serverErrorHadnler(req, res, error);
        }
        else
            res.json(sqlResult.rows);
    })
}

//DELETE Functions
function deleteRecipesHandler(req, res) {
    let { userID, id } = req.body;
    let query = `DELETE FROM ${recipes_table} WHERE id = $1 AND userID = $2 RETURNING *`;
    let values = [id, userID];

    client.query(query, values, (error, sqlResult) => {
        if (error) {
            serverErrorHadnler(req, res, error);
        }
        else
            res.status(204).json(sqlResult.rows);
    })
}

function deleteIngredientHandler(req, res) {
    let { userID, id } = req.body;
    let query = `DELETE FROM ${ingredients_table} WHERE id = $1 AND userID = $2 RETURNING *`;
    let values = [id, userID];

    client.query(query, values, (error, sqlResult) => {
        if (error) {
            serverErrorHadnler(req, res, error);
        }
        else
            res.status(204).json(sqlResult.rows);
    })
}

//POST Functions
function addNewRecipesHandler(req, res) {

    let { id, title, item_image, userID } = req.body;
    let values = [id, title, item_image, userID];
    let query = `INSERT INTO ${recipes_table} (id, title, item_image,userID)
        VALUES ($1,$2,$3,$4) returning *`;

    client.query(query, values, (error, sqlResult) => {
        if (error) {
            serverErrorHadnler(req, res, error);
        }
        else
            res.json(sqlResult.rows);
    })
}

function addNewIngredientHandler(req, res) {

    let { item_name, item_image, quantity, id } = req.body;

    let query = `INSERT INTO ${ingredients_table} (item_name,item_image,quantity,id) VALUES($1,$2,$3,$4) RETURNING *`;
    let values = [item_name, item_image, quantity, id];

    client.query(query, values, (error, sqlResult) => {
        if (error) {
            serverErrorHadnler(req, res, error);
        }
        else
            res.json(sqlResult.rows);
    })

}

//PUT Functions
function updateHandler(req, res) {
    let { quantity, id, userID } = req.body;
    let query = `UPDATE ${ingredients_table} SET quantity=$1  WHERE id=$2 and userID=$3 RETURNING *`;
    let values = [quantity, id, userID];

    client.query(query, values, (error, sqlResult) => {
        if (error) {
            serverErrorHadnler(req, res, error);
        }
        else
            res.json(sqlResult.rows);
    })
}


//---SQL Functions---


//---API Functions---


//GET Functions
function analyzedInstructionsHandler(req, res) {
    let url = `https://api.spoonacular.com/recipes/${req.query.id}/analyzedInstructions?apiKey=${apikey}`;
    axios.get(url)
        .then((result) => {
            let response = result.data;
            res.json(response);
        })
        .catch((error) => {
            serverErrorHadnler(req, res, error);
        })
}

function autoCompleteHandler(req, res) {

    let url = `https://api.spoonacular.com/food/ingredients/autocomplete?${qureyString.stringify(req.query)}&apiKey=${apikey}`
    axios.get(url)
        .then((result) => {
            let response = result.data;
            res.json(response);
        })
        .catch((error) => {
            serverErrorHadnler(req, res, error);
        })
}

function findByIngredientsHandler(req, res) {

    // req.body = [{"items": ["cheese", "flour", "tomato"], "number": 3}];
    let url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${formatDataToPattern(req.query)}&apiKey=${apikey}`;

    axios.get(url)

        .then((result) => {
            res.json(result.data);
        })
        .catch((error) => {
            serverErrorHadnler(req, res, error);
        })
}

function complexSearchHandler(req, res) {
    let url = `https://api.spoonacular.com/recipes/complexSearch?${qureyString.stringify(req.query)}&apiKey=${apikey}`

    axios.get(url)
        .then((result) => {

            res.json(result.data.results);
        })
        .catch((error) => {
            serverErrorHadnler(req, res, error);
        })
}

function randomRecipesHandler(req,res){
    let url = `https://api.spoonacular.com/recipes/random?number=10&apiKey=${apikey}`

    axios.get(url)
    .then((result) => {

        res.json(result.data);
    })
    .catch((error) => {
        serverErrorHadnler(req, res, error);
    })


}

function searchIngredientsHandler (req,res){
let url = `https://api.spoonacular.com/food/ingredients/search?query=${item}&apiKey=${apikey}`

    axios.get(url)
    .then((result) => {

        res.json(result.data);
        console.log(result.data);
    })
    .catch((error) => {
        serverErrorHadnler(req, res, error);
    })

}

//---API Functions---


//Error Handlers
function serverErrorHadnler(req, res, error = "Sorry, something went wrong") {
    res.status(500).send({
        "status": 500,
        "response": error
    });
    console.log(error);
}

function notFoundErrorHandler(req, res) {
    res.status(404).send("Rout not found")
}

//Helper
function formatDataToPattern(data) {

    const items = data[0].items.map((item, index) => {
        return index === 0 ? item : `+${item}`;
    }).join(",");
    const number = data[0].number;
    return `${items}&number=${number}`;
}

//server start section

// client.connect().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is listening ${PORT}`);
    // })

// }).catch((error) => {

    // console.log(error);
}) //ayman 6:27
//ibraheem added the random recipe 1:22
//ibraheem added the search ingradaint route
