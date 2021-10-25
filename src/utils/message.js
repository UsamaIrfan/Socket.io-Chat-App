const generateMessage = (username, text) => ({
    username,
    message: text,
    createdAt: new Date().getTime()
})

const generateLocationMessage = (username, url) => ({
    username,
    url: url,
    createdAt: new Date().getTime()
})

module.exports = {
    generateMessage,
    generateLocationMessage,
}