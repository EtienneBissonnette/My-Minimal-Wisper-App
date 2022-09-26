require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;


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

        bcrypt.hash(req.body.password, saltRounds, function (e, hash) { // bcrypt hashing of inputed password

            if (e) {
                res.send(e);
            } else {

                const newUser = new User({
                    username: req.body.username,
                    password: hash
                })

                newUser.save((e) => {
                    if (e) {
                        res.send(e);
                    } else {
                        // res.send(`New user added: ${req.body.username}`)
                        res.render("secrets")
                    }
                })
            }
        });
    });


// Login requests
app.route("/login")

    .get((req, res) => {
        res.render("login")
    })

    .post((req, res) => {

        const username = req.body.username;
        const password = req.body.password;

        User.findOne({
            username: username
        }, (e, foundUser) => {
            if (e) {
                res.send(e);
            } else {
                if (foundUser) {
                    bcrypt.compare(password, foundUser.password, function (e, result) {
                        if (result === true) {
                            res.render("secrets")
                        } else {
                            if (e) {
                                res.send(e)
                            } else {
                                res.send("Wrong Password!")
                            }
                        }
                    });
                }
            }
        })
    })


// Server Listening
app.listen(port, () => {
    console.log(`listening on port ${port}`)
});