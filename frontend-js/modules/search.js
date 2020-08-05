import axios from 'axios'
import DOMPurify from 'dompurify'


export default class Search {
    // 1. Select DOM elements, and keep track of any userful data
    constructor() {
        this._csrf = document.querySelector('[name="_csrf"]').value
        this.injectHTML()
        // basically naming the search icon as a variable
        this.headerSearchIcon = document.querySelector(".header-search-icon")
        // assigns the "search overlay" class as the overlay variable. cool.
        this.overlay = document.querySelector(".search-overlay")
        this.closeIcon = document.querySelector(".close-live-search")
        this.inputField = document.querySelector("#live-search-field")
        this.resultsArea = document.querySelector(".live-search-results")
        this.loaderIcon = document.querySelector(".circle-loader")
        this.typingWaitTimer
        //this one will keep the spinning load icon from showing when the user types in non-input keys like the direction arrows
        this.previousValue = ""
        this.events()
    }

    // 2. Events
    events() {
                                                // the arrow function so the "this" function is not changed
        this.headerSearchIcon.addEventListener("click", (e) => {
            // prevents default funciton of the a link for the icon so the # does nothing
            e.preventDefault()
            this.openOverlay()

        // keyup is where the user presses a key and releases, then something will happen
        this.inputField.addEventListener("keyup", () => this.keyPressHandler())

        this.closeIcon.addEventListener("click", () => this.closeOverlay())
        })
    }

    // 3. Methods
    openOverlay () {
        this.overlay.classList.add("search-overlay--visible")
        // focus will put the users cursor on the object we want, the inputField element
        // and we want a delay of 50 miliseconds for the focus feature to work
        setTimeout(() => this.inputField.focus(), 50)

    }
    closeOverlay () {
        this.overlay.classList.remove("search-overlay--visible")

    }

    keyPressHandler() {
        let value = this.inputField.value
        
      if(value ==""){
        clearTimeout(this.typingWaitTimer)
        this.hideLoaderIcon()
        this.hideResultsArea()
      }

        // if the input field is not empty or the same as the last search value
        if(value != "" && value != this.previousValue) {
            clearTimeout(this.typingWaitTimer)
            this.showLoaderIcon()
            this.hideResultsArea()
            this.typingWaitTimer = setTimeout(() => this.sendRequest(), 170)
        }

        this.previousValue = value
    }

    sendRequest() {
        // first argument is the url we want to send a request to
        // second argument is an object with any data we want to send along to the server
        // this will return a promise, so using then catch syntax
        axios.post('/search', {_csrf: this._csrf, searchTerm: this.inputField.value}).then(response => {
          console.log(response.data)
          this.renderResultsHTML(response.data)
        }).catch(() => {
            alert("sendRequest failuressaeennn erro rr  wakjkjskd")
        })
    }

    renderResultsHTML(posts){
      if (posts.length) {
                                    // this is all we need to do to purify front end stuff for the app
        this.resultsArea.innerHTML = DOMPurify.sanitize(`<div class="list-group shadow-sm">
        <div class="list-group-item active"><strong>Universe Search Results</strong> - ${posts.length > 1 ? `${posts.length} meowings found` : `there is one meow like that here`}</div>

        ${posts.map((post) => {
          let postDate = new Date(post.createdDate)
          
          return`
          <a href="/post/${post._id}" class="list-group-item list-group-item-action">
          <img class="avatar-tiny" style="background-color:${String(post.createdBy.avatarbgcolor)}" src="${post.createdBy.avatar}"> <strong>${post.greeting} - ${post.title}</strong>
          <span class="text-muted small">by ${post.createdBy.username} on ${postDate.getMonth() + 1}/${postDate.getDate()}/${postDate.getFullYear()}</span>
          </a>`
        }).join('')}
      

        </div>`)
      } else {
        this.resultsArea.innerHTML = `<p class="alert alert-danger text-center shadow-sm">Hmmm.. There is nothing like that in this universe right now.</p>`
      }
      this.hideLoaderIcon()
      this.showResultsArea()
    }

    showLoaderIcon() {
        this.loaderIcon.classList.add("circle-loader--visible")
    }
    hideLoaderIcon() {
      this.loaderIcon.classList.remove("circle-loader--visible")
    }

    showResultsArea() {
      this.resultsArea.classList.add("live-search-results--visible")
    }
    hideResultsArea() {
      this.resultsArea.classList.remove("live-search-results--visible")
    }
    
    injectHTML(){
        document.body.insertAdjacentHTML('beforeend', `  <!-- search feature begins -->
        <div class="search-overlay">
          <div class="search-overlay-top shadow-sm">
            <div class="container container--narrow">
              <label for="live-search-field" class="search-overlay-icon"><i class="fas fa-search"></i></label>
              <input type="text" id="live-search-field" class="live-search-field" placeholder="Search Deep Game Space">
              <span class="close-live-search"><i class="fas fa-times-circle"></i></span>
            </div>
          </div>
      
          <div class="search-overlay-bottom">
            <div class="container container--narrow py-3">
              <div class="circle-loader"></div>
              <div class="live-search-results"> </div>
                
              
            </div>
          </div>
        </div>
        <!-- search feature end -->`)
    }
}
