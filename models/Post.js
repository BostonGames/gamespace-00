const { post } = require('../app')

const postsCollection = require('../db').db().collection("posts")
const followsCollection = require('../db').db().collection("follows")
const ObjectID = require('mongodb').ObjectID
const User = require('./User')
const sanitizeHTML = require('sanitize-html')

//constructor function
let Post = function(data, userid, requestedPostID){
    this.data = data
    this.errors = []
    this.userid = userid
    this.requestedPostID = requestedPostID
}

Post.prototype.cleanUp = function(){
    if (typeof(this.data.title) !="string"){this.data.title = ""}
    if (typeof(this.data.body) !="string"){this.data.body = ""}

    // get rid of bogus properties
    this.data = {
        

        //strip all questionable stuff with sanitizeHTML
        createdBy: ObjectID(this.userid),
        title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}),
        body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}),
        greetingValue: sanitizeHTML(this.data.greeting, {allowedTags: [], allowedAttributes: {}}),
        greeting: sanitizeHTML(this.data.greeting, {allowedTags: [], allowedAttributes: {}}),      
        createdDate: new Date()
    }
}

Post.prototype.validate = function(){
    if (this.data.title ==""){this.errors.push("You'll need a title first!")}
    if (this.data.body ==""){this.errors.push("You need to write something for your post content")}
    if(this.data.greeting == null){this.errors.push("You need to choose a greeting")}
    if(this.data.greeting == 'undefined'){this.errors.push("You need to choose a greeting")}
    
    //this one is specific to the Edit screen
    if(this.data.greeting == "greeting-starter-foredits"){this.errors.push("Make sure to update your greeting message")}
    
    
}


// change post selections here, this is what will get posted
Post.prototype.assignPostText = function(){
      
    
    if(this.data.greeting == "greeting-0"){this.data.greeting = "Greetings!"}
    if(this.data.greeting == "greeting-1"){this.data.greeting = "Hello"}
    if(this.data.greeting == "greeting-2"){this.data.greeting = "Meow there!"}
    if(this.data.greeting == "greeting-3"){this.data.greeting = "Mew"}
}

Post.prototype.create = function(){
    return new Promise((resolve, reject) => {
        this.cleanUp()
        this.validate()
        //need this to make sure dropdown text is stored properly as a string
        this.assignPostText()
        if(!this.errors.length){
            // save post into database
            postsCollection.insertOne(this.data).then((info) => {
                resolve(info.ops[0]._id)
            }).catch(() => {
                this.errors.push("Mewozax 8! There seems to be a server connection issue - please try again later")
                reject(this.errors)
            })
            
        } else {
            reject(this.errors)
        }
    })
}

Post.prototype.update = function(){
    return new Promise(async (resolve, reject) => {
        // find the right post document in database
        try {
            let post = await Post.findSingleById(this.requestedPostID, this.userid)
            if(post.isVisitorOwner){
                let status = await this.actuallyUpdate()
                resolve(status)
            } else {
                reject()
            }
        } catch{
            reject()
        }
    })
}

Post.prototype.actuallyUpdate = function(){
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        this.validate()
        //need this to make sure dropdown text is stored properly as a string
        this.assignPostText()
        if (!this.errors.length){
            // 1st argument is object we want to find
            // 2nd argument is what to do with that object
            await postsCollection.findOneAndUpdate({_id: new ObjectID(this.requestedPostID)}, {$set:
            {
                title: this.data.title,
                body: this.data.body,
                greeting: this.data.greeting,
            }})
            resolve("success")
        } else {
            resolve("failure")
        }
    })
}

// when getting data on a post, it will pull all data with a 1. 
Post.reusablePostQuery = function (uniqueOperations, visitorID){
    return new Promise(async function(resolve, reject){
        let aggOperations = uniqueOperations.concat([        
            // lookup data from 'users' collection
            {$lookup: {from:"users", localField: "createdBy", foreignField: "_id", as: "createdByDocument"}},
            // project only gets parts of a collection, not the entire object
            {$project: {
                title: 1,
                greeting: 1,
                body: 1,
                createdDate: 1,
                avatar: 1,
                avatarbgcolor: 1,
                creatorID: "$createdBy",
                createdBy: {$arrayElemAt: ["$createdByDocument", 0]}
            }}

        ])

        //Mongo db returns a primise, adding await makes sure this completes before moving on
        let posts = await postsCollection.aggregate(aggOperations).toArray()

        //clean up author property in each post object
        posts = posts.map(function(post){
            post.isVisitorOwner = post.creatorID.equals(visitorID)           

            post.createdBy = {
                username: post.createdBy.username,
                avatar: new User(post.createdBy, true).avatar,
                avatarbgcolor: post.createdBy.avatarbgcolor,
                // ifNeeded debug: my fix for hiding user _id from ppl searching posts. original version in lesson vid 87, but it stopped users from editing their own posts. this one works better
                creatorID: undefined                
            }

            console.log("avatarbgcolor for post: " + post.createdBy.avatarbgcolor)
            

            //returns the manipulated post
            return post
        })  
        resolve(posts)      
    })
}

Post.findSingleById = function (id, visitorID){
    return new Promise(async function(resolve, reject){
        //maek sure nothing malicious is trying to be injected in
        if (typeof(id) != "string" || !ObjectID.isValid(id)) {            
            reject()
            return
        }      
        
        // put in the unique identifier in the parenthesis
        // we are using the match operation, so the id should match the objectID in mongo db
        let posts = await Post.reusablePostQuery([{$match: {_id: new ObjectID(id)}}], visitorID)

        
        if(posts.length){
            //shows the data the aggOperations is looking up in reusablePostQuery
            console.log(posts[0])
            resolve(posts[0])
        } else {
            reject()
        }
    })
}

Post.findByCreatorId = function(creatorID) {
    return Post.reusablePostQuery([
        {$match: {createdBy: creatorID}},
        //want the newest posts on top (-1 for descending, 1 for ascending)
        {$sort: {createdDate: -1}}
    ])
}

Post.delete = function(postIDtoDelete, currentUserID) {
    return new Promise(async (resolve, reject) => {
        try {
            let post = await Post.findSingleById(postIDtoDelete, currentUserID)
            if(post.isVisitorOwner) {
               await postsCollection.deleteOne({_id: new ObjectID(postIDtoDelete)})
               resolve()
            } else {
               // something fishy or sus goin on here
                reject()
            }
        } catch {
            // post ID is not valied or does not exist
            reject()
        }
    })
}

Post.search = function (searchTerm) {
    return new Promise(async (resolve, reject) => {
        if (typeof(searchTerm) == "string") {
            let posts = await Post.reusablePostQuery([
                {$match: {$text: {$search: searchTerm}}},
                // want to sort posts by best match, so ones with best 'score'
                {$sort: {score: {$meta: "textScore"}}}
            ])
            resolve(posts)
        } else {
            reject()
        }
    })
}

Post.countPostsByCreator = function(id) {
    return new Promise(async (resolve, reject) => {
        let postCount = await postsCollection.countDocuments({createdBy: id})
        resolve(postCount)
    })
}

Post.getFeed = async function(id){
    // create an array of user ids that the current user follows
    let followedUsers = await followsCollection.find({creatorID: new ObjectID(id)}).toArray()

    // map creates a new array with only the elements we want, in this case the _id of the person the current user is following
    followedUsers = followedUsers.map(function (followDoc) {
        return followDoc.followedID
    })

    // look for posts where the authors (users friends) are in the above array of followed users
    return Post.reusablePostQuery([
        {$match: {createdBy: {$in: followedUsers}}},
        {$sort: {createdDate: -1}}
    ])
}

module.exports = Post