import DOMPurify from "dompurify"

export default class Chat {
  constructor() {
    this.openedYet = false
    this.chatWrapper = document.querySelector("#chat-wrapper")
    this.openIcon = document.querySelector(".header-chat-icon")

    this.injectHTML()
    this.chatLog = document.querySelector("#chat")
    //find the chat text form and use the stuff ppl type in
    this.chatField = document.querySelector("#chatField")
    this.chatPunctuation = document.querySelector("#chatPunctuation")
    this.chatTextColor = document.querySelector("#chatTextColor")
    this.chatForm = document.querySelector("#chatForm")
    //need this below injectHTML, since it wont exist until the chat icon is clicked on
    this.closeIcon = document.querySelector(".chat-title-bar-close")
    this.events()
  }

  // Events
  events() {
    this.chatForm.addEventListener("submit", (e) => {
      console.log("submit heard")
      console.log(this.chatTextColor.value)
      // prevent page from reloading
      e.preventDefault()
      this.sendMessageToServer()
    })
    this.chatForm.addEventListener("keydown", (e) => {
      if (e.keyCode === 13) {
        // prevent page from reloading
        e.preventDefault()
        this.sendMessageToServer()
      }
    })
    this.openIcon.addEventListener("click", () => this.showChat())
    this.closeIcon.addEventListener("click", () => this.hideChat())
  }

  //methods
  sendMessageToServer() {
    // emits an event with some data to the server
    // 1st argument is a name we choose to describe this event
    // 2nd argument is an object with any data we want to send to the server (also have to add in app.js > io.on)
    this.socket.emit("chatMessageFromBrowser", {
      message: this.chatField.value,
      chatPunctuation: this.chatPunctuation.value,
      chatTextColor: String(this.chatTextColor.value)
    })
    this.chatLog.insertAdjacentHTML(
      "beforeend",
      DOMPurify.sanitize(`
           
        <div class="chat-self">
                <div class="chat-message">
                    <div class="chat-message-inner userChatSpeechBubble sb3 " style="color:${this.chatTextColor.value}">
                      <div class="chatRow">
                <div class="chatMessageText"> ${this.chatField.value}${this.chatPunctuation.value}</div>  
                      
                      <div class="chatMessageUserIcon"><a href="/profile/${this.username}">
                      <img class="chat-avatar avatar-tiny" style="background-color: ${String(this.avatarbgcolor)}" src="${this.avatar}">
                </a></div> </div>
                        
                      <div  class="chatReactionsWrapper">
                          <div class="chatReactions">
                        <i class="fas fa-plus-circle"></i>
                          chat reaction icons here
                        </div>
                          </div>
                      </div>                     
                    
                </div>                
        </div>    
    `)
    )
    // auto scroll to bottom
    this.chatLog.scrollTop = this.chatLog.scrollHeight
    // empty the text field so its ready for new text from user
    this.chatField.value = ""

    this.chatPunctuation.value = ""
    // focus on the field again
    this.chatField.focus()
  }

  openConnection() {
    // this opens a connection between browser and server
    this.socket = io()
    this.socket.on("welcome", (data) => {
      this.username = data.username
      this.avatar = data.avatar
      this.avatarbgcolor = data.avatarbgcolor
    })
    this.socket.on("chatMessageFromServer", (data) => {
      //debug canDelete - works
      //alert(data.message)

      this.displayMessageFromServer(data)
    })
  }

  displayMessageFromServer(data) {
    // 1st argument - where to insert HTML
    // 2nd argument - what to insert
    this.chatLog.insertAdjacentHTML(
      "beforeend",
      DOMPurify.sanitize(`
        <div class="chat-other">
        
        <div class="chat-message"><div class="chat-message-inner otherChatSpeechBubble sb4">
          
          <div class="chatRow">
            
            <div class="chatMessageUserIcon"><a href="/profile/${data.username}"><img class="avatar-tiny" style="background-color: ${String(data.avatarbgcolor)}" src="${data.avatar}"></a></div>
                <div class="chatMessageText"><a style="color: ${String(data.chatTextColor)}" href="/profile/${data.username}"><strong>${data.username}:</strong></a>
          ${data.message}${data.chatPunctuation}</div>  
                      
                       </div>
                        
                      <div  class="chatReactionsWrapper">
                          <div class="chatReactions">
                        <i class="fas fa-plus-circle"></i>
                          chat reaction icons here
                        </div>
                          </div>
                      </div>                        
                    
          </div></div>
        `)
    )
    this.chatLog.scrollTop = this.chatLog.scrollHeight
  }

  injectHTML() {
    this.chatWrapper.innerHTML = `
    <div class="chat-100wrapper"><div class="chat-title-img chatRow1"><i class="fas fa-comment"></i>CatChat<span class="chat-title-bar-close">
    <i class="fas fa-times-circle"></i></span></div></div>   
    <div id="chat" class="chat-log">                                    </div>

    <div class="chat-100wrapper"><div class="chat-footer-img">
            
            
    <form id="chatForm" class="chat-form">  

    <div class="flex-dropdown-wrapper">       
      <div class="chatElement0">        
        <div class="select-wrapper"><select required name="chatGreeting" id="chatField" class="dropdownText0">
             <option value="" selected>Message!</option>
             <option value="" >- none -</option>

             <option value="" style="font-weight:800" >- Greetings -</option>             
             <option>Me-Mow</option>
             <option>Meow there</option>
             <option>Hey</option>
             <option>Hi</option>              
             <option>Hello</option>
             <option>Welcome</option>
             <option>Yo</option> 
             <option>Sup fam</option>  
             
             <option value="" style="font-weight:800" >- Questions -</option>
             <option>Meowing?</option>
             <option>How are you?</option>
             <option>Mowing-mew?</option>
             <option>How is your galaxy faring?</option>              
             <option>Have you got any fish?</option>
             <option>May I have some fish?</option>
             <option>What is your favorite animal?</option>
             <option>What do you like to do?</option>

             <option value="" style="font-weight:800" >- Replies -</option>
             <option>Doing meow</option>
             <option>It's meow</option>
             <option>Yes</option>
             <option>I think so</option> 
             <option>No</option> 
             <option>Not really</option>             
             <option>Kind of</option>
             <option>Maybe</option>
             <option>Not sure</option>
             <option>Thank you</option> 
             <option>Ur welcome</option>           
             <option>Cool</option>
             <option>Lame</option>
             <option>lol</option>
             <option>Nice</option> 
             <option>Oops</option>
             <option>Sorry</option>
             <option>Me too</option>

             <option>Decent</option>
             <option>I'm good</option> 
             <option>Tired</option>
             <option>Happy</option>
             <option>Sad</option>
             <option>Bored</option>
             <option>Meh</option>

             <option value="" style="font-weight:800" >- Animals -</option>
             <option>cat</option>
             <option>dog</option>
             <option>bird</option>
             <option>hamster</option>
             <option>mouse</option>
             <option>lizard</option>
             <option>horse</option>
             <option>unicorn</option>
             <option>tiger</option>
             <option>lion</option>
             <option>seal</option>
             <option>sloth</option>
             <option>panda</option>
             <option>monkey</option>
             <option>butterfly</option>
             <option>seahorse</option>
             <option>turtle</option>
             <option>owl</option>
             <option>llama</option>
             <option>moose</option>
             <option>bear</option>
             <option>leemur</option>
             <option>bunny</option>
             <option>octopus</option>
             <option>squid</option>
             <option>whale</option>



             <option value="" style="font-weight:800" >- Statements -</option>
             <option>Me-mow</option>
             <option>Mew</option>
             <option>Prr</option>
             <option>Hiss</option> 
             <option>I like gaming</option> 
             <option>I like sports</option> 
             <option>I like school</option>            
             <option>I like art</option>
             <option>I like naps</option>
             <option>I like cooking</option>
             <option>I like baking</option> 
             <option>I love my pet</option>           
             <option>I like your name</option>
             <option>Your name is funny</option>
             <option>lol</option> 
             <option>lol</option> 
             <option>lol</option>
             
             <option value="" style="font-weight:800" >- Food -</option>
             <option>breakfast</option>
             <option>brunch</option>
             <option>lunch</option>
             <option>dinner</option>
             <option>dessert</option>             
             <option>vegetables</option>
             <option>fruit</option>
             <option>meat</option>
             <option>bread</option>
             <option>rice</option>
             <option>sweets</option>
             <option>pizza</option>
             <option>ice cream</option>
             <option>chocolate</option>
             <option>tacos</option>
             <option>pasta</option>
             <option>sushi</option>
             <option>noodles</option>
             <option>ramen</option>
             <option>stir fry</option>
             <option>bacon</option>
             <option>peanut butter</option>
             <option>dumplings</option>
             <option>french fries</option>
             <option>strawberries</option>
             <option>bananas</option>
             <option>oranges</option>
             <option>tangerines</option>
             <option>grapes</option>
             <option>melon</option>
             <option>cake</option>
             <option>cinnamon rolls</option>
             <option>donuts</option>
             <option>cheese</option>
             <option>eggs</option>
             <option>bagels</option>
             <option>buttered toast</option>
             <option>nuts</option>
             <option>cereal</option>
             <option>burgers</option>
             <option>chili</option>
             <option>seafood</option>
             <option>pickles</option>             
             <option>carrots</option>
             <option>spinach</option>
             <option>potatoes</option>
             <option>broccoli</option>
             <option>apples</option>

            

           </select>
         </div>  </div>

         <div class="chatElement0">
           <div class="select-wrapper">
                 <select required name="chatPunctuation" id="chatPunctuation" class="dropdownText0">         
            <option value="" selected>Emote!</option>
            <option value="">- none -</option>
  
           <option value="" style="font-weight:800" >- Basic -</option>
           <option>!</option>
           <option>?</option>
           <option>...</option>
           <option>♡</option>
           <option>♪</option>
           <option>★</option>
           <option>☆</option>

           <option value="" style="font-weight:800" >- Catmojis -</option>
           <option>&nbsp≧◡≦</option>              
           <option>&nbsp~(=^–^)</option>
           <option>&nbsp(^･ｪ･^)</option>
           <option>&nbsp(⁎˃ᆺ˂)</option> 
           <option>&nbsp(^._.^)ﾉ</option>
           <option>&nbspㅇㅅㅇ</option>              
           <option>&nbsp[^._.^]ﾉ*</option>
           <option>&nbsp~(=^‥^)_｡</option>
           <option>&nbsp(^-人-^)</option> 
           <option>&nbsp(=^･^=)</option>
           <option>&nbsp( =◣ . ◢= )</option>
           <option>&nbsp(^ᵔᴥᵔ^)</option>
           <option>&nbsp^ↀᴥↀ^</option>              
           <option>&nbsp(⁎˃ᆺ˂)</option>
           <option>&nbspヾ(=ﾟ･ﾟ=)ﾉ</option>
           <option>&nbsp(=ＴェＴ=)</option> 
           <option>&nbsp(=ｘェｘ=)</option> 
           <option>&nbsp~(=^‥^)ﾉ◎～</option>              
           <option>&nbsp-ᄒᴥᄒ-</option>
           <option>&nbspᕙ༼◕ ᴥ ◕༽ᕗ</option>
           <option>&nbsp^▶ᴥ◀^</option> 
           <option>&nbsp●ᴥ●</option> 
           <option>&nbspヽ(*^ｰ^)人(^ｰ^*)ノ</option> 
           <option>&nbspO o <*)))><{</option>           
           <option>&nbsp<*)))><{</option>
           <option>&nbsp}><(((*> o O</option>
           <option>&nbsp}><(((*></option> 
           

           <option value="" style="font-weight:800" >- Hooman Emoticons -</option>
           <option>&nbsp:)</option>              
           <option>&nbsp:(</option>              
           <option>&nbsp:D</option>            
           <option>&nbsp⌐■_■</option>
           <option>&nbspO_o</option>              
           <option>&nbsp^_^</option>
           <option>&nbsp^_~</option>
           <option>&nbsp: |</option> 
           <option>&nbsp:3</option> 
           <option>&nbsp( ゜ε ゜ )</option>              
           <option>&nbspಠ ⌒ ಠ </option>
           <option>&nbsp♡( ･ᴗ･ )♡</option> 
           <option>&nbsp┐༼꒰  •᷅ ༽┌</option> 
           <option>&nbspಠ_ಠ</option>           
           <option>&nbspヘ( ^o^)ノ＼(^_^ )</option>
           <option>&nbspヾ(_ _*)</option> 
           <option>&nbsp┌( ಠ_ಠ)┘</option>              
           <option>&nbspఠ_ఠ</option>
           <option>&nbsp◴_◶</option>
           <option>&nbsp〈( ^.^)ノ</option> 
           <option>&nbspヽ(*ﾟｰﾟ*)ﾉ</option> 
           <option>&nbsp└| ∵ |┘</option>           
           <option>&nbsp(*_*)</option>           
           <option>&nbsp(o_-)</option> 
           <option>&nbsp♪(((#^-^)八(^_^*)))♪</option>
           <option>&nbsp(•ิ_•ิ)</option>


           <option value="" style="font-weight:800" >- Birb Emoticons -</option>
           <option>&nbsp(০▿০)</option>              
           <option>&nbsp⊚▿⊚</option>
           <option>&nbsp| •́ ▾ •̀ |</option>
           <option>&nbsp⋋( ◕ ∧ ◕ )⋌</option> 
           <option>&nbsp（ꉺ▿ꉺ）</option>
           <option>&nbsp[●▲●]</option>              
           <option>&nbsp ∧( ‘Θ’ )∧</option>
           <option>&nbsp♪( ‘Θ’)ﾉ~☆</option>
           <option>&nbsp( ˘⊖˘)</option> 
           <option>&nbsp⋛⋋( ‘Θ’)⋌⋚</option> 
           <option>&nbsp⋋(◍’Θ’◍)⋌</option>              
           <option>&nbsp(•ө•)</option>
           <option>&nbsp(•ө•)♡</option>
           <option>&nbsp(╮ꏿ ◊ ꏿ╭)</option> 
           <option>&nbsp⋋(◍’◊’◍)⋌</option>
           <option>&nbsp|•́ ◇ •̀ |</option> 
           <option>&nbsp(~‾▿‾)~</option>
           <option>&nbsp(~˘▾˘)~</option> 
           <option>&nbsp~(‾▿‾~)</option>  
           <option>&nbsp~(˘▾˘~)</option>           
           <option>&nbsp（○・▽・○）人（●・▽・●）ノ</option>


           <option value="" style="font-weight:800" >- More -</option>
           <option>&nbsp━☆ﾟ.*･｡ﾟ✿</option> 
           <option>&nbspo .｡.:*☆</option>              
           <option>&nbsp*✲ﾟ*｡⋆</option>

           <option>&nbsp</option>


         </select>
       </div> </div>

         
         <div class="chatElement1">
            <input name="catTextColor" id="chatTextColor" class="" type="color" value="#ffffff">
         </div>
         
         <button type="submit" class="btn0-success chatSubmitButton"> 
         <i class="fas fa-arrow-alt-circle-up"></i>   
       </button>
   </div>
 
</form>
</div>
</div> </div>
        `
  }

  showChat() {
    // this is so that a new connection is not made every time a user opens and closes the chat box. connects just once, more efficient
    if (!this.openedYet) {
      this.openConnection()
    }

    this.openedYet = true

    this.chatWrapper.classList.add("chat--visible")
    this.chatField.focus()
  }

  hideChat() {
    this.chatWrapper.classList.remove("chat--visible")
  }
}
