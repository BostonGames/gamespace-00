import axios from 'axios'

export default class RegistrationForm {
    constructor() {
        this._csrf = document.querySelector('[name="_csrf"]').value
        this.form = document.querySelector("#registration-form")
        // quearySelectorAll will return multiple elements like in the css doc
        this.allFields = document.querySelectorAll("#registration-form .form-control")
        //this.allFields = document.querySelectorAll("#meowmers0 .form-control")
        this.insertValidationElements()
        this.username = document.querySelector("#username-register")
        this.username.previousValue = ""
        this.email = document.querySelector("#email-register")
        this.email.previousValue = ""
        this.password = document.querySelector("#password-register")
        this.password.previousValue = ""
        // want these to get validated before accepted, so start as false
        this.username.isUnique = false
        this.email.isUnique = false
        this.events()
    }

    // Events
    events(){
        this.form.addEventListener("submit", (e) => {
            e.preventDefault()
            this.formSubmitHandler()
        })

        this.username.addEventListener("keyup", () => {
           this.isDifferent(this.username, this.usernameHandler)
        })
        this.email.addEventListener("keyup", () => {
        this.isDifferent(this.email, this.emailHandler)
        })
        this.password.addEventListener("keyup", () => {
        this.isDifferent(this.password, this.passwordHandler)
        })
        // blur is when users exit out of a field or gets out of focus
        // like if you hit 'tab' really quick after entering a bad entry
        this.username.addEventListener("blur", () => {
            this.isDifferent(this.username, this.usernameHandler)
         })
         this.email.addEventListener("blur", () => {
         this.isDifferent(this.email, this.emailHandler)
         })
         this.password.addEventListener("blur", () => {
         this.isDifferent(this.password, this.passwordHandler)
         })
    }
    // Methods
    formSubmitHandler() {
        this.usernameImmediately()
        this.usernameAfterDelay()
        this.emailAfterDelay()
        this.passwordImmediately()
        this.passwordAfterDelay()

        if(this.username.isUnique && 
            !this.username.errors &&
            this.email.isUnique &&
            !this.email.errors &&
            !this.password.erros
            ){
            this.form.submit()
        }
    }

    isDifferent(el, handler){
        if (el.previousValue != el.value){
            handler.call(this)
        }
        el.previousValue = el.value
    }

    usernameHandler(){
        this.username.errors = false
        this.usernameImmediately()
        clearTimeout(this.username.timer)
        this.username.timer = setTimeout(() => this.usernameAfterDelay(), 800)
    }

    emailHandler(){
        this.email.errors = false
  
        clearTimeout(this.email.timer)
        this.email.timer = setTimeout(() => this.emailAfterDelay(), 800)
    }

    passwordHandler(){
        this.password.errors = false
        this.passwordImmediately()
        clearTimeout(this.password.timer)
        this.password.timer = setTimeout(() => this.passwordAfterDelay(), 800)
    }

    usernameImmediately() {
        // check if user entry is either blank or contains non-alpha numeric symbols
        // this uses a regular expression for js
        if(this.username.value != "" && !/^([a-zA-Z0-9]+)$/.test(this.username.value)) {
            this.showValidationError(this.meowmers, "you can only use letters and numbers in your username")
        }
        if(this.username.value.length > 30){
            this.showValidationError(this.username, "your username can't be that long")
        }
        if(!this.username.errors) {
            this.hideValidationError(this.username)
        }
    }

    passwordImmediately() {
        if (this.password.value.length > 50) {
            this.showValidationError(this.password, "This can't be longer than 50 characters")
        }
        if(!this.password.errors){
            this.hideValidationError(this.password)
        }
    }

    showValidationError(el, message) {
        el.nextElementSibling.innerHTML = message
        el.nextElementSibling.classList.add("liveValidateMessage--visible")
        el.errors = true
    }

    hideValidationError(el){
        el.nextElementSibling.classList.remove("liveValidateMessage--visible")
    }

    passwordAfterDelay() {
        if (this.password.value.length < 8) {
            this.showValidationError(this.password, "This has to be at least 8 characters or a space seal might guess it")
        }
    }

    emailAfterDelay() {
        // another regular expression
        // will evaluate to true if there is text, then an @, then additional text, then '.', then more text
        if(!/^\S+@\S+.\S$/.test(this.email.value)){
            this.showValidationError(this.email, "You'll need to use a real hooman email address")
        }

        if(!this.email.errors){
            axios.post('/doesEmailExist', {_csrf: this._csrf, email: this.email.value}).then((response) => {
                if (response.data) {
                    this.email.isUnique = false
                    this.showValidationError(this.email, "someone is already using that email")
                } else {
                    this.email.isUnique = true
                    this.hideValidationError(this.email)
                }
            }).catch(() => {
                console("Hmm try again later")
            })
        }
    }

    usernameAfterDelay() {
        if (this.username.value.length < 3) {
            this.showValidationError(this.username, "username has to be at least three characters")
        }
        
        if(!this.username.errors) {
            // 1st argument - the url we want to send a request to
            // 2nd argument - 
            axios.post('/doesUsernameExist', {_csrf: this._csrf, username: this.username.value}).then((response) => {
                // if name already exists
                if(response.data) {
                    this.showValidationError(this.username, "that name is already taken")
                    this.username.isUnique = false
                } else {
                    this.username.isUnique = true
                }
            }).catch(() => {
                console.log("please try again later.")
            })
        }
    }

    insertValidationElements() {
        this.allFields.forEach(function(el) {
            // make sure to use different quotes (double quotes, in this case) than what you wrap the second argument in
            el.insertAdjacentHTML('afterend', '<div class="alert alert-danger small liveValidateMessage"></div')
        })
    }
}