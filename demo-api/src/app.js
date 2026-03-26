// app.js: Responsible for defining the routes, middleware and other application-level functionality
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
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


const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '0.0.1',
      description: 'API documentation for the demo SecureEpiLink API service.',
    },
  },
  apis: ['./src/routes/**/*.js'], // Path to the API docs
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
console.log(JSON.stringify(swaggerDocs.paths, null, 2));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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
