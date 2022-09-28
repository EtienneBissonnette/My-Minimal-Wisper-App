require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session')
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')


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
    password: String,
    googleId: String
})

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = mongoose.model("User", userSchema)

passport.serializeUser((user, cb) => {
    process.nextTick(() => {
        cb(null, {
            id: user.id,
            username: user.username,
            name: user.name
        });
    });
});

passport.deserializeUser((user, cb) => {
    process.nextTick(() => {
        return cb(null, user);
    });
});

//Using authentication strategies with passport
passport.use(User.createStrategy());

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        passReqToCallback: true
    },
    function (request, accessToken, refreshToken, profile, done) {
        User.findOrCreate({
            googleId: profile.id
        }, function (e, user) {
            return done(e, user);
        });
    }
));


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

app.get("/auth/google",
    passport.authenticate('google', {
        scope: ['email', 'profile']
    }));

app.get("/auth/google/secrets",
    passport.authenticate("google", {
        successRedirect: "/secrets",
        failureRedirect: "/login"
    }));


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
            res.redirect("/")
        }
    });
})


// Server Listening
app.listen(port, () => {
    console.log(`listening on port ${port}`)
});