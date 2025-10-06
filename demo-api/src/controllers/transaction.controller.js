const { logger } = require("../middleware/logger")
const transaction = require('../services/transaction')
const config = require('../config')
const helper = require('../helper')
const { apiClient } = require("../middleware/auth");
const identifiers = require("../services/identifiers")

// Terminates transaction on the node where termination initiated 
async function terminate(correlationId, status, message) {
  try {
    await transaction.update(correlationId, 'status', status)
    await transaction.update(correlationId, 'message', message)
    await transaction.update(correlationId, 'records_linked', 0)

    // TODO: Remove transient IDs only relevant to the transaction being terminated 
    // Currently simply removing all transient IDs under the assumption that only one transaction is happening at a given time
    await identifiers.clearAllTransient(null, correlationId)

    logger.info(`CORR ${correlationId}: Successfully terminated transaction`)
    logger.info(`CORR ${correlationId}: Sending transaction termination to partner node`)

    const currentNodeId = helper.getCurrentNodeId(config)
    const transactionRecord = await transaction.getById(correlationId)
    const comparisonObj = {
      source: transactionRecord.data[0].source_id,
      target: transactionRecord.data[0].target_id
    }

    let findTarget = ''
    Object.keys(comparisonObj).forEach(async function (key) {
      if (comparisonObj[key] !== currentNodeId) {
        findTarget = comparisonObj[key]
      }
    });
    const ids = {
      target: findTarget,
      source: currentNodeId
    }

    const idDetails = helper.getNodeDetails(ids, config)
    const options = helper.generatePostOpt(idDetails.target.hostname, '/transaction/terminate', idDetails.target.port, 'POST', ids)
    const data = { correlationId, status, message }
    const response = await apiClient.post(options.url, data, { headers: options.headers })
    logger.info(`CORR ${correlationId}: Sent transaction termination to partner node`)

  } catch (error) {
    logger.error('ERROR: Error terminating transaction')
    logger.error(error.message)
  }
}

// Terminates transaction on partner node
const handlePartnerTermination = async (req, res) => {
  const params = { ...req.body || {} }
  try {
    const message = params.message
    const status = params.status
    const correlationId = params.correlationId

    // PNT = Partner Node Termination
    const newMessage = message + ' (PNT)'
    await transaction.update(correlationId, 'status', status)
    await transaction.update(correlationId, 'message', newMessage)
    await transaction.update(correlationId, 'records_linked', 0)

    // TODO: Remove transient IDs only relevant to the transaction being terminated 
    // Currently simply removing all transient IDs under the assumption that only one transaction is happening at a given time
    await identifiers.clearAllTransient(null, correlationId)

    logger.info(`CORR ${correlationId}: Successfully terminated transaction (PNT)`)
    return res.success({ data: { correlationId, message: 'Successfully terminated transaction (PNT)' } })
  } catch (error) {
    logger.error('ERROR: Error handling partner transaction termination')
    logger.error(error.message)
    return res.internalServerError({ message: error.message })
  }
}

module.exports = {
  terminate,
  handlePartnerTermination
}