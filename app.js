require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session')
const passportLocalMongoose = require('passport-local-mongoose');


// Configurating express app
const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));
app.use(session({ //configurating cookie session
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
}))

app.use(passport.initialize());
app.use(passport.session()); //initializing a cookie session using passport

// MongoDB database configuration with Mongoose
const uri = process.env.URI

mongoose.connect(uri)

const userSchema = new mongoose.Schema({
    username: String,
    password: String
})

userSchema.plugin(passportLocalMongoose)

const User = mongoose.model("User", userSchema)

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// Home requests
app.get("/", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.render("home")
    }
})

// Register requests
app.route("/register")

    .get((req, res) => {
        res.render("register")
    })

    .post((req, res) => {
        const username = req.body.username;
        const password = req.body.password;

        User.register({
            username: username
        }, password, (e, newUser) => {
            if (e) {
                console.log(e);
                res.redirect("/login");
            } else {
                const authentication = passport.authenticate("local") // defining middleware authentication function
                authentication(req, res, () => {
                    res.redirect("/secrets");
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

        const user = new User({
            username: username,
            password: password
        });

        req.login(user, (e) => {
            if (e) {
                res.send(e);
            } else {
                const authentication = passport.authenticate("local") // defining middleware authentication function
                authentication(req, res, () => {
                    res.redirect("/secrets");
                })
            }
        });
    })

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login")
    }
})

app.get("/logout", (req, res) => {
    req.logout((e) => {
        if (e) {
            res.send(e)
        } else {
            res.redirect("/login")
        }
    });
})


// Server Listening
app.listen(port, () => {
    console.log(`listening on port ${port}`)
});