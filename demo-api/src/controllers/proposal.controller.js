// const db = require('./db')
const helper = require('../helper')
// const salt = require('../services/salt')
const https = require('https')
const transaction = require('../services/transaction')
const idController = require('./id.controller')
const { TransactionStage, TransactionStatus } = require('../enum/transaction')
const { generatePostOpt } = require('../helper')
const { logger } = require('../middleware/logger')
const config = require('../config')
const { apiClient } = require('../middleware/auth')

// Function to propose salt externally
async function proposeSalt (correlationId, ids, salt, idDetails) {
  logger.info(`CORR ${correlationId}: SALT PROPOSAL COMMENCED`)
  await transaction.update(correlationId, 'stage', TransactionStage.SALT_PROPOSAL)
  const options = generatePostOpt(idDetails.target.hostname, '/salt/proposal', idDetails.target.port, 'POST', ids)
  // POST: Correlation ID, Salt
  const data = { correlationId, salt }
  const dataString = JSON.stringify(data)
  options.headers['Content-Length'] = dataString.length

  const response = await apiClient.post(options.url, data, { headers: options.headers })

  const obj = {
    salt,
    correlationId,
    ids
  }
  // TODO: Add here that only if response = success should the idController be triggered
  idController.generateHashedIds(obj)

  const toReturn = response.data.data

  return {
    toReturn
  }
}

// Function to handle incoming salt proposal
const receiveSalt = async (req, res) => {
  const params = { ...req.body || {} }
  const target = req.get('Target-Node')
  const source = req.get('Source-Node')
  const headerIds = { target, source }

  try {
    // SERVICE: Add transaction to receiving node's db
    await transaction.create(params.correlationId, headerIds, TransactionStage.SALT_RECEIVED)
    await transaction.update(params.correlationId, 'status', TransactionStatus.IN_PROGRESS)
    // We DON'T want to add the salt to the receiving node's db
    // await salt.create(params.correlationId, params.salt)

    // CONTROLLER: Call next controller here (idGenerationController)
    const obj = {
      salt: params.salt,
      correlationId: params.correlationId,
      ids: headerIds
    }
    idController.generateHashedIds(obj)
    const data = {
      stage: TransactionStage.SALT_RECEIVED,
      correlationId: params.correlationId,
      ids: headerIds
    }
    return res.success({ data })
  } catch (error) {
    logger.error('ERROR : Failed to receive salt')
    logger.error(error)
    return res.internalServerError({ message: error.message })
  }
}

module.exports = {
  proposeSalt,
  receiveSalt
}
