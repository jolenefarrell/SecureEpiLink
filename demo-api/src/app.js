// app.js: Responsible for defining the routes, middleware and other application-level functionality

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()
require('dotenv').config()
const { logger, readLog, morganMiddleware } = require('./middleware/logger')
const routes = require('./routes')
const { serverAuthMiddleware } = require('./middleware/auth')

app.use(cors())
app.use(bodyParser.json({ limit: '20mb' }))
app.use(express.json()) // Recognise incoming request as JSON
app.use(express.urlencoded({ extended: true })) // Recognise incoming request as JSON
app.use(morganMiddleware)
app.use(serverAuthMiddleware)
app.use(require('./utils/response'))

app.get('/', (req, res) => {
  res.send('Welcome to this API service!!!')
})

app.use('/', routes)

app.get('/api/logs', (req, res) => {
  try {
    const result = readLog(req.body.date)
    res.set('Content-Type', 'text/plain')
    return res.send(result)
  } catch (e) {
    return res.sendStatus(500)
  }
})

/* Error handler middleware */
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500
  logger.error(err.message, err.stack)
  res.status(statusCode).json({ message: err.message })
})

module.exports = app
