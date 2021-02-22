const express = require("express");
const hbs = require("hbs");
const wax = require("wax-on");
require("dotenv").config();
const mongoUrl = process.env.MONGO_URL;
const MongoUtil = require("./MongoUtil");
const ObjectId = require("mongodb").ObjectId;

// create an instance of express app
let app = express();

// set the view engine
app.set("view engine", "hbs");

// static folder
app.use(express.static("public"));

// setup wax-on
wax.on(hbs.handlebars);
wax.setLayoutPath("./views/layouts");

// enable forms
app.use(
    express.urlencoded({
        extended: false
    })
);

async function main() {
    let db = await MongoUtil.connect(mongoUrl, "recipes_app");

    // MongoDB is connected and alive

    // Show the form to create the ingredient
    app.get("/ingredients/create", (req, res) => {
        res.render("ingredients/create");
    });

    // Actually process the form to create the ingredient
    app.post("/ingredients/create", async (req, res) => {
        await db.collection("ingredients").insertOne({
            name: req.body.ingredientName
        });

        res.redirect('/ingredients')
    });

    // Show all ingredients in the system
    app.get("/ingredients", async (req, res) => {
        // find all the ingredients
        let ingredients = await db
            .collection("ingredients") //select the ingredients collection
            .find({}) // find all the ingredient with no criteria
            .toArray(); // convert to array

        res.render('ingredients/all', {
            'everything': ingredients
        })
    });

    // Delete ingredient from the system
    app.get('/ingredients/:ingredient_id/delete', async (req, res) => {
        let id = req.params.ingredient_id;
        let ingredient = await db.collection('ingredients').findOne({
            '_id': ObjectId(id)
        })
        // test to ensure it's working
        res.render('ingredients/delete', {
            'ingredient': ingredient
        })
    })

    // process is what sent via the form
    app.post('/ingredients/:ingredient_id/delete', async (req, res) => {
        await db.collection('ingredients').remove({
            '_id': ObjectId(req.params.ingredient_id)
        })
        res.redirect('/ingredients')
    })

    // update
    app.get('/ingredients/:ingredient_id/update', async (req, res) => {
        // we retrieve the ingredient information
        let ingredient_id = req.params.ingredient_id;
        let ingredient = await db.collection('ingredients').findOne({
            '_id': ObjectId(ingredient_id)
        });

        res.render('ingredients/update', {
            'ingredient': ingredient
        })
    })

    app.post('/ingredients/:ingredient_id/update', async (req, res) => {
        let newIngredientName = req.body.ingredientName;
        let ingredientId = req.params.ingredient_id;
        db.collection('ingredients').updateOne({
            '_id': ObjectId(ingredientId)
        }, {
            '$set': {
                'name': newIngredientName
            }
        });

        res.redirect('/ingredients')
    })

    app.get('/cuisines/create', (req, res) => {
        res.render('cuisines/create')


    })

    app.post('/cuisines/create', async (req, res) => {
        await db.collection('cuisines').insertOne({
            name: req.body.cuisineName
        })
        res.redirect('/cuisines')
    })

    app.get('/cuisines', async (req, res) => {
        let cuisines = await db.collection('cuisines').find({}).toArray()
        console.log(cuisines)
        res.render('cuisines/all', {             // cuisines/all is your own folders path
            'cuisines': cuisines                 //'cuisines' becomes the array of cuisines that you just got
        })                                      //#each of 'cuisines' will be rendered in the unordered list in all.hbs

    })

    app.get('/cuisines/delete/:cuisine_id', async (req, res) => {
        let id = req.params.cuisine_id  //retreiving id of cuisine that user typed into url
        let cuisine = await db.collection('cuisines').findOne({
            '_id': ObjectId(id)        //format of ids in mongo atlas
        })
        res.render('cuisines/delete', {  //cuisines/delete is your own folders path
            'cuisine': cuisine
        })

    })

    app.post('/cuisines/delete/:cuisine_id', async (req, res) => {
        let id = req.params.cuisine_id
        await db.collection('cuisines').remove({
            '_id': ObjectId(id)
        })
        res.redirect('/cuisines')
    })

    app.get('/cuisines/update/:cuisine_id', async (req, res) => {
        let id = req.params.cuisine_id
        let cuisine = await db.collection('cuisines').findOne({
            '_id': ObjectId(id)
        })
        res.render('cuisines/update', {
            'cuisine': cuisine
        })
    })

    app.post('/cuisines/update/:cuisine_id', (req, res) => {
        let id = req.params.cuisine_id
        let newCuisineName = req.body.cuisineName
        db.collection('cuisines').updateOne({
            '_id': ObjectId(id)
        }, {
            '$set': {
                'name': newCuisineName
            }
        })
        res.redirect('/cuisines')
    })

    app.get('/cuisines/comments/:cuisine_id/add', async (req, res) => {
        let id = req.params.cuisine_id
        let cuisine = await db.collection('cuisines').findOne({
            '_id': ObjectId(id)
        })

        res.render('cuisines/create_comment', {
            'cuisine': cuisine
        })
    })

    app.post('/cuisines/comments/:cuisine_id/add', async (req, res) => {
        let cuisine = req.params.cuisine_id

        await db.collection("cuisines").updateOne(
            {
                _id: ObjectId(cuisine)
            },
            {
                $push: {
                    comments: {
                        _id: ObjectId(), // ask Mongo to generate an ID for us
                        username: req.body.username,
                        comments: req.body.comments
                    }
                }
            }
        );
        res.redirect('/cuisines')
    })

    app.get('/cuisines/comments/:cuisine_id/all_comments', async(req,res)=> {
        let id = req.params.cuisine_id
        let cuisine = await db.collection('cuisines').findOne({
            '_id': ObjectId(id),
        })
        console.log(id);
        console.log(cuisine)
        res.render('cuisines/all_comments', {
            cuisine: cuisine
        })
    })

}

main();

app.listen(3000, () => {
    console.log("Server has started");
});
