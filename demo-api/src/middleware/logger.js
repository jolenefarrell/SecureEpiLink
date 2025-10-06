const { createLogger, format, transports } = require('winston')
const fs = require('fs')
const morgan = require('morgan')
const RotateFile = require('winston-daily-rotate-file')
const logFile = 'demo-api-'
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss.SSS A' }),
  format.align(),
  format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`)
)

const transport = new RotateFile({
  filename: './logs/' + logFile + '%DATE%.log',
  datePattern: 'YYYY-MM-DD', // Daily log file rotation
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  prepend: true
})

const logger = createLogger({
  level: 'http',
  format: logFormat,
  transports: [
    transport,
    new transports.Console({
      // Only colorize logs going to the console to prevent additional characters in the log files
      format: format.colorize({ all: true })
    })
  ]
})

const morganMiddleware = morgan(
  function (tokens, req, res) {
    return JSON.stringify({
      method: tokens.method(req, res),
      host: req.headers.host,
      url: tokens.url(req, res),
      status: Number.parseFloat(tokens.status(req, res)),
      req_body: req.body,
      content_length: tokens.res(req, res, 'content-length'),
      response_time: Number.parseFloat(tokens['response-time'](req, res))
    })
  },
  {
    stream: {
      // Configure Morgan to use our custom logger with the http severity
      write: (message) => logger.http(message.trim())
    }
  }
)

const readLog = (date) => {
  const defaultDate = new Date().toISOString().substring(0, 10)
  const datetime = date || defaultDate
  const log = fs.readFileSync('./logs/' + logFile + datetime + '.log', 'utf8',
    (error, content) => {
      if (error) {
        logger.error(error)
        return error
      }
      // otherwise
      return content
    })
  return log
}

module.exports = { logger, morganMiddleware, readLog }
