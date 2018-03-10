const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const bodyParser = require('body-parser')
const cors = require('cors')
const redisAdapter = require('socket.io-redis')

const app = express()
const server = http.Server(app)
const io = socketio(server)

app.use(bodyParser.json())
app.use(cors())

io.adapter(redisAdapter(process.env.REDIS_URL))

module.exports = {
    app,
    server,
    io
}
