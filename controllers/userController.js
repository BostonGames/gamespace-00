const User = require('../models/User')
const Post = require('../models/Post')
const Follow = require('../models/Follow')
const { request, post } = require('../app')
const jwt = require('jsonwebtoken')
const { response } = require('express')

exports.apiGetPostsByUsername = async function(req, res) {
    try{
        let creatorDoc = await User.findByUsername(req.params.username)
        //stores an array of posts in the posts var
        let posts = await Post.findByCreatorId(creatorDoc._id)
        res.json(posts)
    } catch {
        res.json("Hmmm cannot find that user in this universe")
    }
}

exports.doesUsernameExist = function(req, res) {
    // we want it to return a true or false value
    User.findByUsername(req.body.username).then(function() {res.json(true)}).catch(function() {res.json(false)})
}

exports.doesEmailExist = async function(req, res) {
    // we want it to return a true or false value
    let emailBool = await User.doesEmailExist(req.body.email)
    res.json(emailBool)
}

exports.sharedProfileData = async function (req, res, next) {
    let isVisitorsProfile = false
    
    let isFollowing = false
    // if user is logged in, check if they are following or not already
    if(req.session.user) {
        isVisitorsProfile = req.profileUser._id.equals(req.session.user._id)
        isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorID)        
    }

    req.isVisitorsProfile = isVisitorsProfile
    req.isFollowing = isFollowing

    // get post, follower, and following count
    let postCountPromise = Post.countPostsByCreator(req.profileUser._id)
    let followerCountPromise =  Follow.countFollowersByID(req.profileUser._id)
    let followingCountPromise = Follow.countFollowingByID(req.profileUser._id)
    // this way will be faster than having each one of the three above Await individually
    let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise])

    req.postCount = postCount
    req.followerCount = followerCount
    req.followingCount = followingCount

    next()
}

exports.mustBeLoggedIn = function(req, res, next){
    if(req.session.user){
        next()
    } else{
        req.flash("errors", "Mew-mow now - you'll have to log in to do that.")
        req.session.save(function(){
            res.redirect('404')
        })
    }
}

exports.apiMustBeLoggedIn = function(req, res, next){
    try {
        // 1st argument - token that you want to verify
        // 2nd argument - jwt secret phrase
        req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET)
        next()
    } catch {
        res.json("Me-mow - Suspicious token. High probability of space seal breach")
    }
}


exports.login = function(req, res){
    let user = new User(req.body)
    user.login().then(function(result){
       //allows users to have persistent data so stuff is saved when they login
        req.session.user = {
            username: user.data0.username, 
            avatarbgcolor: user.data0.avatarbgcolor, 
            avatar: user.avatar, 
            _id: user.data0._id
        }
        req.session.save(function(){
            res.redirect('/')
        })
    }).catch(function(e){
        req.flash('errors', e)
        req.session.save(function(){
            res.redirect('/')
        })
    })
}

exports.apiLogin = function(req, res){
    let user = new User(req.body)
    user.login().then(function(result){
       // gives json web token to user. But it won't expire unless you tell it to in 3rd argument  
       // 1st argument - data we want to store in the token, any data we want. so maybe avatar stuff here later?
       // 2nd argument - secret phrase that package will use when generating the token    
       // 3rd argument - object of options (30m for 30 minutes, 2d for 2 days, 4h for 4 hours etc)     
       res.json(jwt.sign({_id: user.data0._id}, process.env.JWTSECRET, {expiresIn: '7d'}))
    }).catch(function(e){
       res.json("me-mow - Sorry you are not found in this univers")
    })
}

exports.logout = function(req, res){
    req.session.destroy(function(){
        res.redirect('/')
    })

    console.log("You have left Game Space! We hope you return to play soon.")
}

exports.register = function(req, res){
    let user = new User(req.body)
    user.register().then(() => {
        req.session.user = {
            username: user.data0.username, 
            avatarbgcolor: user.data0.avatarbgcolor, 
            avatar: user.avatar, 
            _id: user.data0._id
        }
        req.session.save(function() {
            res.redirect('/')
        })
    }).catch((regErrors) => {
        regErrors.forEach(function(error) {
            req.flash('regErrors', error)
        })
        req.session.save(function(){
            res.redirect('/')
        })
    })

}

exports.home = async function(req, res){
     if (req.session.user){
        // fetch feed of posts for current user
        let posts = await Post.getFeed(req.session.user._id)
        res.render('home-dashboard', {posts: posts})
        console.log("Meow! Welcome to Game Space!")
     } else {
        res.render('home-guest', {regErrors: req.flash('regErrors')})
     }
}

exports.ifUserExists = function(req, res, next){    
    User.findByUsername(req.params.username).then(function(userDocument){
        req.profileUser = userDocument
        next()
    }).catch(function() {
        res.render("404")
    })
}

exports.profilePostsScreen = function(req, res){
    //pull in a user's posts
    // the promise will resolve with an array of posts
    Post.findByCreatorId(req.profileUser._id).then(function(posts){
        res.render('profile', {

           //this is for the browser page title and SEO - used 'greeting' for now, but canDelete or debug later if needed
           greeting: `${req.profileUser.username}`,

           currentPage: "posts",
           posts: posts,
           profileUsername: req.profileUser.username,
           profileAvatar: req.profileUser.avatar,
           profileAvatarBGcolor: req.profileUser.avatarbgcolor,
           isFollowing: req.isFollowing,
           isVisitorsProfile: req.isVisitorsProfile,
           counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        })
    }).catch(function(){
        res.render("404")
    })    
}


exports.profileFollowersScreen = async function(req, res) {
    try {
      let followers = await Follow.getFollowersById(req.profileUser._id)
      res.render('profile-followers', {
        currentPage: "followers",
        followers: followers,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        profileAvatarBGcolor: req.profileUser.avatarbgcolor,
        isFollowing: req.isFollowing,
        isVisitorsProfile: req.isVisitorsProfile,
        counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
      })
      console.log(followers)
    } catch {
        console.log("there must be an error in the code, check in userController > profileFollowerScreen")
        res.render("404")
        
    }  
} 

exports.profileFollowingScreen = async function(req, res) {
    try {
      let following = await Follow.getFollowingById(req.profileUser._id)
      res.render('profile-following', {
        currentPage: "following",
        following: following,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        profileAvatarBGcolor: req.profileUser.avatarbgcolor,
        isFollowing: req.isFollowing,
        isVisitorsProfile: req.isVisitorsProfile,
        counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
      })
      console.log(following)
    } catch {
        console.log("there must be an error in the code, check in userController > profileFolloingScreen")
        res.render("404")
        
    }  
}
