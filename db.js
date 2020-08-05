const dotenv = require('dotenv')
dotenv.config()
const mongodb = require('mongodb')

                    
mongodb.connect(process.env.CONNECTIONSTRING, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client){
    //this makes it able to work in multiple files, it will return the database we can work with
    //makes sure there is a connection to database before app is launched
    module.exports = client
    const app = require('./app')
    app.listen(process.env.PORT)
})