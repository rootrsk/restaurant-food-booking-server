const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app)
const socket = require('socket.io')
const cors = require('cors')
const dotnev = require('dotenv')
dotnev.config()
app.use(cors())

const port = process.env.PORT || 3001
// app.use(require("morgan"));
const io = socket(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST']
  }
})

require('./src/db/mongoose')
const userRouter = require('./src/routes/user')
const adminRouter = require('./src/routes/admin')
app.use(cors())
app.use(express.json())
app.use(adminRouter)
app.use(userRouter)

server.listen(port, () => {
  console.log(`Backend server is listening at http://localhost:${port}`)
})

