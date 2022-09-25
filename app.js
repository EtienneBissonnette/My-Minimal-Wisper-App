const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
require('dotenv').config();
const mongoose = require('mongoose');
const { ifError } = require('assert');


// Configurating express app
const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

// MongoDB database configuration with Mongoose
const uri = process.env.uri

mongoose.connect(uri)

const userSchema = {
    username: String,
    password: String
}
const User = mongoose.model("User", userSchema)


// GET 
app.get("/", (req, res) => {
    res.render("home")
})

app.route("/login")
    .get((req, res) => {
        res.render("login")
    })
    .post((req, res) => {
        const username = req.body.username;
        const password = req.body.password;
        User.findOne({username:username}, (e,foundUser)=>{
            if(e){
                res.send(e);
            } else{
                if(foundUser){
                    if(foundUser.password === password){
                        res.render("secrets")
                    }
                }
            }
        })
    })


app.route("/register")
    .get((req, res) => {
        res.render("register")
    })

    .post((req, res) => {
        const newUser = new User({
            username: req.body.username,
            password: req.body.password
        })

        newUser.save((e) => {
            if (e) {
                res.send(e);
            } else {
                // res.send(`New user added: ${req.body.username}`)
                res.render("secrets")
            }
        })
    });

// Server Listening
app.listen(port, () => {
    console.log(`listening on port ${port}`)
});