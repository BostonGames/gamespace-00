const Post = require("../models/Post")
const sendgrid = require("@sendgrid/mail")
sendgrid.setApiKey(process.env.SENDGRIDAPIKEY)

exports.viewCreateScreen = function (req, res) {
  res.render("create-post")
}

exports.create = function (req, res) {
  let post = new Post(req.body, req.session.user._id)
  post
    .create()
    .then(function (newId) {
      sendgrid.send({
        to: "allyn89@gmail.com",
        from: "meowmers@bostongames.net",
        subject: "a new user has registered",
        text: "a new alien cat has joined Game Space",
        // can use ``s to put in dynamic html
        html: "<b>a <h2>new</h2> alien cat has joined Game Space"
      })

      req.flash("success", "Your post was created.")
      req.session.save(() => res.redirect(`/post/${newId}`))
    })
    .catch(function (errors) {
      errors.forEach((error) => req.flash("errors", error))
      req.session.save(() => res.redirect(`/create-post`))
    })
}

exports.apiCreate = function (req, res) {
  let post = new Post(req.body, req.apiUser._id)
  post
    .create()
    .then(function (newId) {
      res.json(newId)
    })
    .catch(function (errors) {
      res.json(errors)
    })
}

exports.viewSingle = async function (req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorID)
    res.render("single-post-screen", { post: post, title: post.title, greeting: post.greeting })
  } catch {
    res.render("404")
  }
}

exports.viewEditScreen = async function (req, res) {
  try {
    // pull in post info to edit, we need this info first so use promise await
    let post = await Post.findSingleById(req.params.id, req.visitorId)

    //updated this if argument from post.isVisitorCreator and it works just fine now
    if (post.creatorID.equals(req.visitorID)) {
      res.render("edit-post", { post: post })
    } else {
      req.flash("errors", "Only the creator can edit this")
      req.session.save(() => res.redirect(`/post/${req.params.id}`))
    }
  } catch {
    res.render("404")
  }
}

exports.edit = function (req, res) {
  let post = new Post(req.body, req.visitorID, req.params.id)
  post
    .update()
    .then((status) => {
      // the post was successfully updated

      if (status == "success") {
        // post was updated in db
        req.flash("success", "Updates saved")
        req.session.save(function () {
          res.redirect(`/post/${req.params.id}`)
        })
        // user did have permission, but validation errors
      } else {
        post.errors.forEach(function (error) {
          req.flash("errors", error)
        })
        req.session.save(function () {
          res.redirect(`/post/${req.params.id}/edit`)
        })
      }
    })
    .catch(() => {
      // a post w/requested ID does not exist or if user is not creator of post
      req.flash("errors", "Sorry, you can't do that.")
      req.session.save(function () {
        res.redirect("/")
      })
    })
}

exports.delete = function (req, res) {
  Post.delete(req.params.id, req.visitorID)
    .then(() => {
      req.flash("success", "Post Eliminated.")
      //TODO would need safe profile url value here
      req.session.save(() => {
        res.redirect(`/profile/${req.session.user.username}`)
      })
    })
    .catch(() => {
      req.flash("errors", "You do not have permission to destroy that")
      req.session.save(() => res.redirect(`/post/${req.params.id}`))
    })
}

exports.apiDelete = function (req, res) {
  // API version: the Post model delete method still takes care of the validation checks, permission checks, and business logic
  Post.delete(req.params.id, req.apiUser._id)
    .then(() => {
      res.json("post yeeted in API mode")
    })
    .catch(() => {
      res.json("You do not have permission to destroy that via API")
    })
}

exports.search = function (req, res) {
  // we want to pass the stuff the user enters in the search field
  // we used 'searchTerm' as a var in search.js>searchRequest(). it's the value the user types into the field.
  Post.search(req.body.searchTerm)
    .then((posts) => {
      //want to send the json data to the browser if it works
      res.json(posts)
    })
    .catch(() => {
      res.json([])
    })
}
