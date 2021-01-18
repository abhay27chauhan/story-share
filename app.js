require('dotenv').config({path: './config/config.env'})
const express = require("express")
const bodyParser = require("body-parser");
const connectDB = require('./config/db')
const session = require('express-session');
const passport = require('passport');

const app = express();

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

// session
app.use(session({
  secret: 'my little secret',
  resave: false,
  saveUninitialized: false
}))

// passport middleware
app.use(passport.initialize())
app.use(passport.session())

connectDB();

const PORT = process.env.PORT || 3000

app.get("/", function(req, res){
  res.render("login");
});

app.get("/dashboard", function(req, res){
  res.render("dashboard");
});

app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`)
})