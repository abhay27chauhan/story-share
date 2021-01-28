require('dotenv').config({path: './config/config.env'})
const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const methodOverride = require('method-override')
const connectDB = require('./config/db')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const passport = require('passport')
const Story = require('./models/Story')

// passport config
require('./config/passport')(passport)

const app = express();

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

// method-override
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    let method = req.body._method
    delete req.body._method
    return method
  }
}))

// express-session
app.use(session({
  secret: 'my little secret',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
}))

// passport middleware (passport-configure)
app.use(passport.initialize())
app.use(passport.session())

connectDB();

const PORT = process.env.PORT || 3000

app.get("/", function(req, res){
  if (!req.isAuthenticated()){
    res.render("login");
  } else {
    res.redirect("/dashboard");
  }
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/callback",
  passport.authenticate('google', { failureRedirect: "/" }),
  function(req, res) {
    // Successful authentication, redirect to dashboard.
    res.redirect("/dashboard");
});

app.get("/dashboard", function(req, res){
  Story.find({ user: req.user.id}, function (err, stories) { 
    if (err){ 
        console.log(err)
        res.render('500')
    }else{ 
        if (req.isAuthenticated()){
          res.render("dashboard", {name: req.user.firstName, stories});
        } else {
          res.redirect("/");
        }
    } 
});
});

app.get("/stories/add", function(req, res){
  if(req.isAuthenticated()){
    res.render("add");
  } else {
    res.redirect("/");
  }
})

app.get("/auth/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.get("/stories", function(req, res){
  Story.find({status: 'public'}).
  populate('user').
  sort({ createdAt: 'desc' }).
  exec(function (err, stories) {
    if(err){
      console.log(err)
      res.render('500')
    }else{
      if (req.isAuthenticated()){
        res.render("index", { stories, user: req.user});
      } else {
        res.redirect("/");
      }
    }
  });
})

app.get("/stories/edit/:id", function(req, res){
  Story.findOne({_id: req.params.id}, function (err, story) { 
      if (err){ 
        console.log(err)
        res.render('500') 
      }else{ 
        if (!story) {
          return res.render('404')
        }else if(story.user != req.user.id){
          if (req.isAuthenticated()){
            res.redirect('/stories')
          } else {
            res.redirect("/");
          }
        }else{
          if (req.isAuthenticated()){
            res.render("edit", { story });
          } else {
            res.redirect("/");
          }
        }
      } 
  }); 
})

app.get("/stories/:id", function(req, res){
  Story.findById(req.params.id).
  populate('user').
  exec(function(err, story){
    if(err){
      console.log(err)
      res.render("500")
    }else{
      if (!story) {
        res.render('404')
      }else if(story.user != req.user.id && story.status == 'private'){
        if (req.isAuthenticated()){
          res.redirect('/stories')
        } else {
          res.redirect("/");
        }
      }else{
        if (req.isAuthenticated()){
          res.render("show", { story, user: req.user})
        } else {
          res.redirect("/");
        }
      }
    }
  })
  
})

app.post("/stories", function(req, res){
  if(req.isAuthenticated()){
    req.body.user = req.user._id;
    Story.create(req.body, function(err){
      if(err){
        console.log(err)
        res.render("500")
      }else{
        res.redirect("/dashboard")
      }
    })
  } else {
    res.redirect("/");
  }
})

app.put("/stories/:id", function(req, res){
  Story.findOne({_id: req.params.id}, function (err, story) { 
      if (err){ 
        console.log(err)
        res.render('500') 
      }else{ 
        if (!story) {
          res.render('404')
        }else if(story.user != req.user.id){
          if (req.isAuthenticated()){
            res.redirect('/stories')
          } else {
            res.redirect("/");
          }
        }else{
          Story.findOneAndUpdate({_id: req.params.id}, req.body, { new: true,runValidators: true },function (err, story) { 
            if (req.isAuthenticated()){
              res.redirect('/dashboard')
            } else {
              res.redirect("/");
            }
          })
        }
      } 
  });
})

app.delete("/stories/:id", function(req, res){
  Story.findById(req.params.id, function(err, story){
    if (err){ 
      console.log(err)
      res.render('500') 
    }else{ 
      if (!story) {
        res.render('404')
      }else if(story.user != req.user.id){
        if (req.isAuthenticated()){
          res.redirect('/stories')
        } else {
          res.redirect("/");
        }
      }else{
        Story.remove({_id: req.params.id}, function (err, story) { 
          if(!err){
            if (req.isAuthenticated()){
              res.redirect('/dashboard')
            } else {
              res.redirect("/");
            }
          }
        })
      }
    } 
  })
})

app.get("/stories/user/:id", function(req, res){
  Story.find({user: req.params.id, status: 'public'}).
  populate('user').
  exec(function(err, stories){
    if(err){
      console.log(err)
      res.render('500')
    }else{
      if (req.isAuthenticated()){
        res.render("index", { stories, user: req.user })
      } else {
        res.redirect("/");
      }
    }
  })
})

app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`)
})