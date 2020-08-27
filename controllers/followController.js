const Follow = require('../models/Follow')
const { response } = require('../app')

exports.addFollow = function (req, res) {
    // 1st param: user youre trying to follow
    // 2nd param: current users ID
    let follow = new Follow(req.params.username, req.visitorID)
    follow.create().then(() => {
        req.flash("success", `You have added this cat to your universe`)
        req.session.save(() => res.redirect(`/profile/${req.params.username}`))
    }).catch((errors) => {
        errors.forEach(error => {req.flash("errors", error)})
    })
    req.session.save(() => response.redirect('/'))
}

exports.removeFollow = function (req, res) {
    // 1st param: user youre trying to follow
    // 2nd param: current users ID
    let follow = new Follow(req.params.username, req.visitorID)
    follow.delete().then(() => {
        req.flash("success", `You have successfully yeeted this cat from your universe`)
        req.session.save(() => res.redirect(`/profile/${req.params.username}`))
    }).catch((errors) => {
        errors.forEach(error => {req.flash("errors", error)})
    })
    req.session.save(() => response.redirect('/'))
}