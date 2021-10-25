const socket = io();

// Elements
const $messageForm = document.getElementById("message-form")
const $messageFormInput = document.querySelector("input")
const $messageFormButton = document.querySelector("button")
const $shareLocationButton = document.getElementById("share-location")
const $messageContainer = document.getElementById("messages")
const $sidebarContainer = document.getElementById("sidebar")

// Template
const messageTemplate = document.getElementById("message-template").innerHTML
const locationMessageTemplate = document.getElementById("location-message-template").innerHTML
const sidebarTemplate = document.getElementById("sidebar-template").innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New / Last Message Element
    const $lastMessage = $messageContainer.lastElementChild

    // Height of the new message
    const lastMessageStyles = getComputedStyle($lastMessage)
    const lastMessageMargin = parseInt(lastMessageStyles.marginBottom)
    const lastMessageHeight = $lastMessage.offsetHeight + lastMessageMargin

    // Visible Height
    const visibleHeight = $messageContainer.offsetHeight

    // Height of message container
    const containerHeight = $messageContainer.scrollHeight

    // How far Have I scrolled?
    const scrollOffSet = $messageContainer.scrollTop + visibleHeight

    if (containerHeight - lastMessageHeight <= scrollOffSet) {
        $messageContainer.scrollTop = $messageContainer.scrollHeight
    }

}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.message,
        createdAt: moment(message.createdAt).format("h:mm a")
    })
    $messageContainer.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('location-message', (message) => {
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format("h:mm a")
    })
    $messageContainer.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    $sidebarContainer.innerHTML = html
})

$messageForm.addEventListener("submit", (e) => {
    e.preventDefault()
    let text = $messageFormInput.value
    $messageFormButton.setAttribute('disabled', 'disabled')
    socket.emit('sendMessage', text, (err) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if (err) {
            return console.log(err)
        }
        console.log("Message delivered")
    })
})

$shareLocationButton.addEventListener("click", async (e) => {
    $shareLocationButton.setAttribute('disabled', 'disabled')
    if (!navigator.geolocation) {
        return alert('Geo-location is not supported by current version of your browser.')
    }

    await navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('share-location', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (err) => {
            if (err) return console.log(err)
            $shareLocationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})