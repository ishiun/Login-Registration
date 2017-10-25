var mongoClient = require('mongodb').MongoClient;

mongoClient.connect("mongodb://localhost:27017/challenge", function(error, db) {
  if (error) { return console.dir(error); }///
  db.createCollection('login', function(error, collection) {});
});


var express = require('express');
var app = express();
var session = require('express-session');
var bodyParser = require('body-parser');
var server = app.listen(8080, function() {} )

app.use(session({
  secret: 'web challenge',
  resave: false,
  saveUninitialized: false
}))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended:true }));

app.set('view-engine', 'pug');


app.get('/', function(request, response) {
  response.render('login.pug', {
    message: ""
  })
})

app.get('/registration', function(request, response) {
  response.render('registration.pug', {
    message: ""
  })
})

app.get('/studentHomepage', function(request, response) {
  if (request.session.views == 1){
      response.render('studentHomepage.pug', {
        student: request.session.user
      })
  } else {
      response.redirect('/loginError');
    }
})

app.get('/teacherHomepage', function(request, response) {
  if (request.session.views == 2) {
    response.render('teacherHomepage.pug', {
      teacher: request.session.user
    })
  } else {
      response.redirect('/loginError');
    }
})

app.get('/adminHomepage', function(request, response) {
  if (request.session.views == 3) {

    mongoClient.connect("mongodb://localhost:27017/challenge", function(error, db) {
      if (error) { return console.dir(error); }///
      db.createCollection('login', function(error, collection) {});
      var collection = db.collection('login');
      collection.find({}).toArray(function (err, result) {
      if (err) throw err;
      console.log(result);

      response.render('adminHomepage.pug', {
        admin: request.session.user,
        users: result
        })
      });
    })
  } else {
      response.redirect('/loginError');
    }
})

app.get('/loginError', function(request, response) {
  response.sendFile(__dirname + "/views/" + "error.html");
})

app.post('/', function(request, response) {
  var username = request.body.username;
  var password = request.body.password;
  var role = request.body.role;

  mongoClient.connect("mongodb://localhost:27017/challenge", function(error, db) {
    if (error) return console.dir(error);
    var collection = db.collection('login');
    var login = { "username":username, "password":password, "role":role };

    collection.findOne(login, function(error, result) {
      if (error) throw err;
      if (result == null) {
        console.log("Not a valid login");
        response.render('login.pug', {
          message: "Not a valid login"
        })
      } else {
        console.log("Logged in")
        request.session.user = username;
          if (role == "Student") {
            request.session.views = 1;
            response.redirect('studentHomepage');
          } else if (role == "Teacher") {
            request.session.views = 2;
            response.redirect('teacherHomepage');
          } else if (role == "Admin") {
            request.session.views = 3;
            response.redirect('adminHomepage');
          } else
            console.log("Not valid login")
          }
        })
      })
})

app.post('/registration', function(request, response) {
  var username = request.body.username;
  var password = request.body.password;
  var role = request.body.role;

  mongoClient.connect("mongodb://localhost:27017/challenge", function(error, db) {
    if (error) { return console.dir(error); }
    var collection = db.collection('login');

    var data = {"username":username, "password":password, "role":role };
    if (role == "Admin") {
      collection.findOne({"role":"Admin"}, function(err,result) {
        if (err) throw err;
        if (result == null) {
          collection.insertOne(data, function(error, result) {
            if (error) throw error;
              response.redirect('/');
          });
        } else {
          response.render('registration.pug', {
            message: "An Admin account already exists."
          });
        }
      })
    } else {
        collection.findOne({"username":username, "role":role}, function(err, result) {
          if (err) throw err;
          if (result == null) {
            collection.insertOne(data, function(error, result) {
            if (error) throw error;
              response.redirect('/');
            });
          } else {
              console.log("Username for this role is already taken");
              response.render('registration.pug', {
                message: "This username has been taken for this role"
              });
            }
        });
      }
  });
})

app.post('/logout', function(request, response) {
  request.session.destroy(function(err){})
  response.redirect('/');
})
