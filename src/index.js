const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words")
const { addUser, getUser, removeUser, getUsersInRoom } = require("./utils/users.js")

const app = express()
const publicDirectory = path.join(__dirname, "../public")
app.use(express.static(publicDirectory))
const server = http.createServer(app)
const io = socketio(server)
const { generateMessage, generateLocationMessage } = require("./utils/message")

io.on("connection", (socket) => {
    console.log("New Websocket Connection")

    socket.on("sendMessage", (message, callback) => {
        const filter = new Filter()
        const { user, error } = getUser(socket.id)

        if (error) {
            return callback(error)
        }

        if (filter.isProfane(message)) {
            return callback("Profanity is not allowed.")
        }

        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback('Delivered')
    })

    socket.on('share-location', (data, callback) => {
        const { user, error } = getUser(socket.id)
        if (error) {
            return callback(error)
        }
        io.to(user.room).emit('location-message', generateLocationMessage(user.username, `https://www.google.com/maps?q=${data.latitude},${data.longitude}`))
        callback()
    })
    socket.on('join', ({ username, room }, callback) => {
        const { user, error } = addUser({ id: socket.id, username, room })
        if (error) {
            return callback(error)
        }
        socket.join(user.room)
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        socket.emit('message', generateMessage('Team Chat', `Welome to the room ${user.room}`))
        socket.broadcast.to(user.room).emit('message', generateMessage('Team Chat', `${user.username} has joined!`))
    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        console.log("HAHA2", user)
        if (user) {
            io.to(user.room).emit('message', generateMessage('Team Chat', `${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

const port = process.env.PORT || 3001

server.listen(port, () => {
    console.log(`Listening to port: ${port}`)
})