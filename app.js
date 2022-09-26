require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const md5 = require('md5');
// const encrypt = require("mongoose-encryption");


// Configurating express app
const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

// MongoDB database configuration with Mongoose
const uri = process.env.URI

mongoose.connect(uri)

const userSchema = new mongoose.Schema({
    username: String,
    password: String
})

// userSchema.plugin(encrypt, {
//     secret: process.env.SECRET,
//     encryptedFields: ["password"]
// }) // encrypting userSchema

const User = mongoose.model("User", userSchema)


// Home requests
app.get("/", (req, res) => {
    res.render("home")
})

// Register requests
app.route("/register")
    .get((req, res) => {
        res.render("register")
    })

    .post((req, res) => {
        const newUser = new User({
            username: req.body.username,
            password: md5(req.body.password) // md5 hash of password
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


// Login requests
app.route("/login")
    .get((req, res) => {
        res.render("login")
    })

    .post((req, res) => {
        const username = req.body.username;
        const password = md5(req.body.password);
        User.findOne({
            username: username
        }, (e, foundUser) => {
            if (e) {
                res.send(e);
            } else {
                if (foundUser) {
                    if (foundUser.password === password) {
                        res.render("secrets")
                    } else {
                        res.send("Wrong password!")
                    }
                }
            }
        })
    })


// Server Listening
app.listen(port, () => {
    console.log(`listening on port ${port}`)
});