var express = require("express");
var session = require('express-session');
var app = express();
var path = require("path");
var bcrypt = require("bcrypt");
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));
function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
};

app.use(session({
    secret: 'get it right get it tight',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 60000
    }
}))
const flash = require('express-flash');
app.use(flash());
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/message_board');

var UserSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: "Please enter your first name",
        minlength: 3
    },
    lname: {
        type: String,
        required: "Please enter your last name",
        minlength: 3
    },
    
    email: {
        type: String,
        unique: true,
        minlength: [3, 'not long enough'],
        required: 'Email address is required',
        validate: [validateEmail, 'Please fill a valid email address'],
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    birthday: {
        type: Date
    },
    password: {
        type: String,
        required: true,
        minlength: 7
    }
}, {
    timestamps: true
});

mongoose.model('User', UserSchema);
var User = mongoose.model('User');
mongoose.Promise = global.Promise;


app.use(express.static(path.join(__dirname, "./static")));
app.set('views', path.join(__dirname, "./views"));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
    res.render('index')
})

app.post('/create', function (req, res) {
    console.log("POST DATA", req.body);
    var user = new User();
    user.fname = req.body.fn;
    user.lname = req.body.ln;
    user.email = req.body.email;
    user.birthday = req.body.birthday;
    console.log(req.body.password.length)
    if (req.body.password.length < 6){
        req.flash('registration', "Password must be at least 7 characters long.");
    }
    if (req.body.password === req.body.password_confirm) {
        bcrypt.hash(req.body.password, 10)
            .then(hashed_password => {
                user.password = hashed_password;
                user.save(function (err) {
                    if (err) {
                        for (var key in err.errors) {
                            req.flash('registration', err.errors[key].message);
                        }
                        // redirect the user to an appropriate route
                        console.log("something not working");
                        res.redirect('/')
                    } else {
                        req.session.email = user.email;
                        console.log(req.session.email);
                        console.log("successfully added!")
                        res.redirect('/show')
                    }
                })

            })
    } else {
        req.flash('registration', "Passwords do not match!");
        res.redirect('/')
    }
})


app.get('/show', function (req, res) {
    if(req.session.email){
        console.log(req.session.email);
        User.findOne({email: req.session.email}, function (err, user) {
            console.log(user)
            res.render("show", {
                user
            })
        })
    } else{
        req.flash('registration', "Please log in!");
        res.redirect('/')
    }
})

app.post('/login', function(req,res){
    if (req.body.password.length < 1){
        req.flash('registration', "Invalid credentials");
        res.redirect('/')
    }
    console.log("POST DATA", req.body);
    User.countDocuments({email: req.body.email}, function(err,user){
        if(user === 0){
            req.flash('registration', "User does not exist.");
            res.redirect('/')
        } else {
            User.findOne({email: req.body.email}, function(err,user){
                bcrypt.compare(req.body.password, user.password)
                .then(result => {
                    console.log(result)
                    if(result == true){
                        req.session.email = user.email;
                        res.redirect('/show')
                    } else {
                        req.flash('registration', "Invalid credentials");
                        res.redirect('/')
                    }
                })
            })
        }
    })
})


app.listen(8000, function () {
    console.log("listening on port 8000");
})

// app.post('/login', function(req,res){
//     console.log("POST DATA", req.body);
//     User.findOne({email: req.body.email}, function(err,user){
//         if(err){
//             for (var key in err.errors) {
//                 req.flash('login', "user does not exist");
//             }
//             res.redirect('/')
//         } else {
//             bcrypt.compare(req.body.password, user.password)
//             .then(result => {
//                 if(result == true){
//                     req.session.email = user.email;
//                     res.redirect('/show')
//                 }
//             })
//         }
//     })
// })