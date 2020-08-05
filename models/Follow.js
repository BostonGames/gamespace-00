const usersCollection = require('../db').db().collection("users")
const followsCollection = require('../db').db().collection("follows")
const ObjectID = require('mongodb').ObjectID
const User = require('./User')

let Follow = function (followedUsername, creatorID) {
    this.followedUsername = followedUsername
    this.creatorID = creatorID
    this.errors = []
}

Follow.prototype.cleanup = function() {
    if (typeof(this.followedUsername) != "string") {this.followedUsername = ""}
}

Follow.prototype.validate = async function(action) {
    // followedUsername must exist in db
    let followedAccount = await usersCollection.findOne({username: this.followedUsername})
    if (followedAccount) {
        this.followedID = followedAccount._id
    } else {
        this.errors.push("Interesting. It would appear this being does not exist in the Game Space dimension")
    }

    let doesFollowAlreadyExist = await followsCollection.findOne({followedID: this.followedID, creatorID: new ObjectID(this.creatorID)})
    if (action == "create") {
        if (doesFollowAlreadyExist) {
            this.errors.push("It appears they are already part of your universe")
        }
    }
    if (action == "delete") {
        if (!doesFollowAlreadyExist) {
            this.errors.push("This one is already outside of your universe, no yeeting required")
        }  
    }

    // should not be able to follow / unfollow urself
    if (this.followedID.equals(this.creatorID)) {
        this.errors.push("You already exist in your own universe")
    }
}

Follow.prototype.create = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanup()
        await this.validate("create")

        if(!this.errors.length) {
            // storing follows in db
            await followsCollection.insertOne({
                followedID: this.followedID,
                creatorID: new ObjectID(this.creatorID)
            })
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

Follow.prototype.delete = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanup()
        await this.validate("delete")

        if(!this.errors.length) {
            // storing follows in db
            await followsCollection.deleteOne({
                followedID: this.followedID,
                creatorID: new ObjectID(this.creatorID)
            })
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

// debug - this may need .prototype added after Follow
Follow.isVisitorFollowing = async function (followedID, visitorID) {

    let followDoc = await followsCollection.findOne({followedID: followedID, creatorID: new ObjectID(visitorID)})


    if(followDoc){
        return true
    } else {
        return false
    }
}

Follow.getFollowersById = function(id) {
    return new Promise(async function(resolve, reject) {
      try {
        let followers = await followsCollection.aggregate([
          {$match: {followedID: id}},
          {$lookup: {from: "users", localField: "creatorID", foreignField: "_id", as: "userDoc"}},
          {$project: {
            username: {$arrayElemAt: ["$userDoc.username", 0]},
            email: {$arrayElemAt: ["$userDoc.email", 0]},
            avatar: {$arrayElemAt: ["$userDoc.avatar", 0]},
            avatarbgcolor: {$arrayElemAt: ["$userDoc.avatarbgcolor", 0]}
          }}
        ]).toArray()

        followers = followers.map(function(follower) {
          let user = new User(follower, true)
          return {
              username: follower.username, 
              avatar: user.avatar,
              avatarbgcolor: follower.avatarbgcolor}
        })
        resolve(followers)
      } catch {
        reject()
      }
    })
  }

  
  Follow.getFollowingById = function(id) {
    return new Promise(async function(resolve, reject) {
      try {
        let following = await followsCollection.aggregate([
          {$match: {creatorID: id}},
          {$lookup: {from: "users", localField: "followedID", foreignField: "_id", as: "userDoc"}},
          {$project: {
            username: {$arrayElemAt: ["$userDoc.username", 0]},
            email: {$arrayElemAt: ["$userDoc.email", 0]},
            avatar: {$arrayElemAt: ["$userDoc.avatar", 0]},
            avatarbgcolor: {$arrayElemAt: ["$userDoc.avatarbgcolor", 0]}
          }}
        ]).toArray()

        following = following.map(function(follow) {
          let user = new User(follow, true)
          return {
              username: follow.username, 
              avatar: user.avatar,
              avatarbgcolor: follow.avatarbgcolor}
        })
        resolve(following)
      } catch {
        reject()
      }
    })
  }
  
  Follow.countFollowersByID = function(id) {
    return new Promise(async (resolve, reject) => {
        let followerCount = await followsCollection.countDocuments({followedID: id})
        resolve(followerCount)
    })
}

Follow.countFollowingByID = function(id) {
    return new Promise(async (resolve, reject) => {
        let followingCount = await followsCollection.countDocuments({creatorID: id})
        resolve(followingCount)
    })
}



module.exports = Follow