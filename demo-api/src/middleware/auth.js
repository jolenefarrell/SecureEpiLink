const axios = require('axios');
const { createHash } = require('node:crypto')
const { logger } = require('../middleware/logger')
const db = require('../controllers/db.controller')
const helper = require('../helper')
const config = require('../config')

// Get API key from database for a given node
async function get (node) {
  let data = null
  let key = ''
  const field = 'node_id'
  const value = node
  try {
    const rows = await db.query(
      `SELECT * FROM Nodes WHERE ${field} = ?`, [value]
    )
    data = helper.emptyOrRows(rows)
  } catch (error) {
    logger.error('ERROR : Failed to get key')
    logger.error(error.message)
  }
  
  if (data && data.length == 1) {
    key = data[0].key
  }

  return key
}

// Hash API key prior to sending in API header
async function hash (key, salt) {
  const stringToHash = key + salt

  const hashedKey = createHash('sha256')
  .update(stringToHash)
  .digest('hex') // Returns a string representation of the hash

  return hashedKey
}

// Verify two keys (incoming and local) are the same
async function verify (incoming, local) {
  let result = "UNAUTHENTICATED"
  if (incoming === local) {
    result = "AUTHENTICATED"
  }
  return result
}

// Server authentication middleware
async function serverAuthMiddleware(req, res, next) {
  let serverId = ''
  logger.info('AUTHENTICATING INCOMING REQUEST')

  let apiKey = req.get('x-api-key')
  let clientId = req.get('x-client-id')
  
  // Temporary account for admin (POSTMAN) requests
  if (clientId === 'H2SEQADMIN') {
    logger.info("H2SEQ Admin Request Incoming")
    apiKey = ''
    // API key doesn't get hashed prior to request so needs to be hashed first
    apiKey = await hash(apiKey, clientId)
  
  } else if (clientId === 'VITECLIENT') {
    // Temporary work around for dashboard requests
    logger.info("H2SEQ Portal Request Incoming")
    serverId = req.get('x-server-id')
    apiKey = await get(serverId)
    apiKey = await hash(apiKey, clientId)
  } else {
    serverId = helper.getCurrentNodeId(config)
  }

  const serverKey = await get(serverId)

  const hashedKey = await hash(serverKey, clientId)

  const result = await verify(apiKey, hashedKey)
  if (result == 'UNAUTHENTICATED') {
    logger.error('INCOMING REQUEST UNAUTHENTICATED')
    return res.sendStatus(401)
  } else {
    logger.info('SUCCESSFULLY AUTHENTICATED')
    return next() 
  }
  
}

// Client authentication middleware
const apiClient = axios.create({})

// Retrieve the auth key and client Id
async function getAuthHeaders(serverId) {
  const serverKey = await get(serverId)
  const clientId = helper.getCurrentNodeId(config)
  const key = await hash(serverKey, clientId)

  return { key, clientId }
}

// A request interceptor to include the auth token in every request
apiClient.interceptors.request.use(async config => {
  const serverId = config.headers['Target-Node']
  const { key, clientId } = await getAuthHeaders(serverId)
  if (key && clientId) {
    config.headers['x-api-key'] = `${key}`
    config.headers['x-client-id'] = `${clientId}`
  }
  return config;
}, error => Promise.reject(error));



module.exports = { serverAuthMiddleware, apiClient }