import DOMPurify from 'dompurify'

export default class Chat{
    constructor(){
        this.openedYet = false
        this.chatWrapper = document.querySelector("#chat-wrapper")
        this.openIcon = document.querySelector(".header-chat-icon")
        
        this.injectHTML()
        this.chatLog = document.querySelector("#chat")
        //find the chat text form and use the stuff ppl type in
        this.chatField = document.querySelector("#chatField")
        this.chatForm = document.querySelector("#chatForm")
        //need this below injectHTML, since it wont exist until the chat icon is clicked on
        this.closeIcon = document.querySelector(".chat-title-bar-close")
        this.events()
    }

    // Events
    events() {
        this.chatForm.addEventListener("submit", (e) => {
            // prevent page from reloading
            e.preventDefault()
            this.sendMessageToServer()
        })
        this.openIcon.addEventListener("click", () => this.showChat())
        this.closeIcon.addEventListener("click", () => this.hideChat())
    }

    //methods
    sendMessageToServer(){
        // emits an event with some data to the server
        // 1st argument is a name we choose to describe this event
        // 2nd argument is an object with any data we want to send to the server
        this.socket.emit('chatMessageFromBrowser', {message: this.chatField.value})
        this.chatLog.insertAdjacentHTML('beforeend', DOMPurify.sanitize(`
            <div class="chat-self">
                <div class="chat-message">
                    <div class="chat-message-inner">
                    ${this.chatField.value}
                    </div>
                </div>
                <a href="/profile/${this.username}">
                    <img class="chat-avatar avatar-tiny" style="background-color: ${String(this.avatarbgcolor)}" src="${this.avatar}">
                </a>
            </div>
    `))
        // auto scroll to bottom
        this.chatLog.scrollTop = this.chatLog.scrollHeight
        // empty the text field so its ready for new text from user
        this.chatField.value = ''
        // focus on the field again
        this.chatField.focus()
    }
    
    openConnection(){
        // this opens a connection between browser and server
        this.socket = io()
        this.socket.on('welcome', (data) => {
            this.username = data.username
            this.avatar = data.avatar
            this.avatarbgcolor = data.avatarbgcolor
        
        })
        this.socket.on('chatMessageFromServer', (data) => {
            //debug canDelete - works
            //alert(data.message)

            this.displayMessageFromServer(data)
        })
    }

    displayMessageFromServer(data){
        // 1st argument - where to insert HTML
        // 2nd argument - what to insert
        this.chatLog.insertAdjacentHTML('beforeend', DOMPurify.sanitize(`
        <div class="chat-other">
        <a href="/profile/${data.username}"><img class="avatar-tiny" style="background-color: ${String(data.avatarbgcolor)}" src="${data.avatar}"></a>
        <div class="chat-message"><div class="chat-message-inner">
          <a href="/profile/${data.username}"><strong>${data.username}:</strong></a>
          ${data.message}
        </div></div>
      </div>
        `))
        this.chatLog.scrollTop = this.chatLog.scrollHeight
        
    }
    
    injectHTML() {
        this.chatWrapper.innerHTML = `
        <div class="chat-title-bar">Chat <span class="chat-title-bar-close"><i class="fas fa-times-circle"></i></span></div>
        <div id="chat" class="chat-log"></div>

        <form id="chatForm" class="chat-form border-top">
            <input type="text" class="chat-field" id="chatField" placeholder="Type a message…" autocomplete="off">
        </form>
        `
    }

    showChat() {
        // this is so that a new connection is not made every time a user opens and closes the chat box. connects just once, more efficient
        if(!this.openedYet) {
            this.openConnection()
        }

        this.openedYet = true

        this.chatWrapper.classList.add("chat--visible")
        this.chatField.focus()
    }



    hideChat(){
        this.chatWrapper.classList.remove("chat--visible")
    }
}