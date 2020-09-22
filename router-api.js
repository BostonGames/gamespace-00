const apiRouter = require("express").Router()
const userController = require("./controllers/userController")
const postController = require("./controllers/postController")
const followController = require("./controllers/followController")
const cors = require("cors")

// this applies to any routes below this line and will configure them to set cors policy to allow access from any domain
apiRouter.use(cors())

apiRouter.post("/login", userController.apiLogin)
apiRouter.post("/create-post", userController.apiMustBeLoggedIn, postController.apiCreate)
apiRouter.delete("/post/:id", userController.apiMustBeLoggedIn, postController.apiDelete)
apiRouter.get("/postsByCreator/:username", userController.apiMustBeLoggedIn, userController.apiGetPostsByUsername)

module.exports = apiRouter
