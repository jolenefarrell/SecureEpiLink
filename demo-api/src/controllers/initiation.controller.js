// const db = require('./db')
// const helper = require('../helper')
const transaction = require('../services/transaction')
const salt = require('../services/salt')
const proposalController = require('./proposal.controller')
const { TransactionStage, TransactionStatus } = require('../enum/transaction')
const { logger } = require('../middleware/logger')
const config = require('../config')
const helper = require('../helper')

// TODO: If a part of this fails, what happens? how do we handle the errors correctly?
const initiateTransaction = async (req, res) => {
  const params = { ...req.body || {} }
  const ids = { target: params.target, source: config.node.id }
  try {

    // Find node details using ids from POST request
    const idDetails = helper.getNodeDetails(ids, config)

    // Pass details to POST only if they are within the same jurisdiction
    if (idDetails.target == null || idDetails.source == null) {
      const message = 'Nodes either do not exist or are not within the same jurisdiction'
      throw new Error(message)
    }

    // SERVICE: Create transaction + return correlation ID
    const transactionResult = await transaction.create(null, ids, TransactionStage.CREATED)

    // SERVICE: Create salt and update transaction status
    const saltResult = await salt.create(transactionResult.correlationId, null)
    await transaction.update(transactionResult.correlationId, 'status', TransactionStatus.IN_PROGRESS)
    await transaction.update(transactionResult.correlationId, 'stage', TransactionStage.SALT_GENERATED)

    // FUNCTION CALL: Call proposalController
    await proposalController.proposeSalt(transactionResult.correlationId, ids, saltResult.salt, idDetails)

    return res.success({ data: { correlationId: transactionResult.correlationId } })
  } catch (error) {
    logger.error('ERROR : Error initiating transaction')
    logger.error(error.message)
    return res.internalServerError({ message: error.message })
  }
}

module.exports = {
  initiateTransaction
}
