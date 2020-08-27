const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const flash = require('connect-flash')
const markdown = require('marked')
const csrf = require('csurf')
const app = express()
const sanitizeHTML = require('sanitize-html')

//test: images
app.use(express.static( "public" ))

// tells express to add user-submitted data to our request object (req.body)
app.use(express.urlencoded({extended: false}))
app.use(express.json())

// API routes - none of the app.use properties listed below this line will apply to this. so it's lighter
app.use('/api', require('./router-api'))

// setting up sessions
let sessionOptions = session({
    secret: "dave flew a porta john into the sky",
    store: new MongoStore({client: require('./db')}),
    resave: false,
    saveUninitialized: false,
    // cookies are measured in miliseconds, so 1000 for one second, 60 for a minute * hour * hours in a day etc
    cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true}
})

app.use(sessionOptions)
app.use(flash())

// this pulls in each users info to use in all of the screens looged-in members have access to
app.use(function(req , res, next){
    // make our markdown function available in ejs templates
    res.locals.filterUserHTML = function(content){
        return sanitizeHTML(markdown(content),{allowedTags: ['p','br', 'ul', 'ol', 'li', 'strong','b','bold','i', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strike'], allowedAttributes: {}})
    }
    
    // make all flash messages available for all screen templates
    res.locals.errors = req.flash("errors")
    res.locals.success = req.flash("success")

    // make current user id available on the req object
    if(req.session.user){req.visitorID = req.session.user._id} 
    else {req.visitorID = 0}

    // make user session data available from within 'view' templates    
    res.locals.user = req.session.user
    next()
})


// ./ looks in the current folder or directory
//require means th ENTIRE file will immediately get executed
const router = require('./router')
const db = require('./db')





app.use(express.static('public'))
//sets views config, second argument is the name of the folder we are using
app.set('views', 'views')
//second argument lets express know what template engine we are using
//need to use npm install ejs to use this
app.set('view engine', 'ejs')

//this will require anything that modifies state (post/put/delete) to have a valid matching csurf token to go through
app.use(csrf())

// middleware to make the csurf thing work
app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken()
    next()
})

// tell overall express application to use our own router
app.use('/', router)

app.use(function(err, req, res, next) {
    if(err) {
        if(err.code == "EBADCSRFTOKEN"){
            req.flash('errors', "Hmmm something fishy going on here - must be a space seal attemting cross-site forgery or something.")
            req.sesion.save(() => res.redirect('/'))
        } else {
            res.render("404")
        }
    }
})

// this creates a server that uses express as it's handler
const server = require('http').createServer(app)
// add socket functionality 
const io = require('socket.io')(server)

// integrating express session package data available with socket.io - vid 104
io.use(function(socket, next){
    sessionOptions(socket.request, socket.request.res, next)
})

// socket represents a connection between server and browser
io.on('connection', function(socket) {
    // only if user is logged in
    if(socket.request.session.user){
        let user = socket.request.session.user

        socket.emit('welcome', {
            username: user.username,
            avatar: user.avatar,
            avatarbgcolor: user.avatarbgcolor
        })
        // 1st arguments is the event type
        // 2nd argument is a function we want to run in response
        socket.on('chatMessageFromBrowser', function(data) {
            // message is the label we chose in 
            // chat.js>sendMessageToServer()>this.socket.emit('chatMessageFromBrowser', {message: this.chatField.value}) 
            // for the data we are passing to the server
            // socket.emit would send that message to just the browser that sent the request, but io.emit will send to ALL connected users INCLUDING the user that sent the message            
            // socket.broadcast.emit will send the data to all browsers EXCEPT the one who wrote the message. more efficient
            socket.broadcast.emit('chatMessageFromServer', {
                message: sanitizeHTML(data.message, {allowedTags: ['strong'], allowedAttributes: {}}),
                chatPunctuation: sanitizeHTML(data.chatPunctuation, {allowedTags: [], allowedAttributes: {}}),
                chatTextColor: sanitizeHTML(data.chatTextColor, {allowedTags: [], allowedAttributes: {}}),
                username: user.username,
                avatar: user.avatar,
                avatarbgcolor: user.avatarbgcolor
            })
        })
    }
})

module.exports = server