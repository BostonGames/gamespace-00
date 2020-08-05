import Search from './modules/search'
import Chat from './modules/chat'
import RegistrationForm from './modules/registrationForm'

if(document.querySelector("#registration-form")) {
    new RegistrationForm()
}

//only use the chat.js if there is chat-wrapper ID in the page.
if(document.querySelector("#chat-wrapper")){new Chat()}

//so ppl who are not logged in will not have their browsers have access to the search js
if(document.querySelector(".header-search-icon")){new Search()}