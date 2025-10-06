/* eslint-disable no-unused-vars */
// const db = require('./db')
const helper = require('../helper')
const https = require('https')
const config = require('../config')
const axios = require('axios').default
const { apiClient } = require('../middleware/auth')
const { NodeType } = require('../enum/nodes')
const { LinkageStatus } = require('../enum/record')
const notification = require('../services/notification')
const sequence = require('../services/sequence')
const identifiers = require('../services/identifiers')
const transaction = require('../services/transaction')
const metadata = require('../services/metadata')
const linkageController = require('./linkage.controller')
const { TransactionStage, TransactionStatus } = require('../enum/transaction')
const { generatePostOpt } = require('../helper')
const { logger } = require('../middleware/logger')

// CONTROLLER FUNC: Create hashed IDs from fields
const generateHashedIds = async (req, res) => {
  try {
    const salt = req.salt
    const correlationId = req.correlationId
    const ids = req.ids
    const data = ''
    const node = config.node
    logger.info(`CORR ${correlationId}: GENERATING HASHED IDS FOR ${node.id}`)
    await transaction.update(correlationId, 'stage', TransactionStage.HASHING_IDS)

    if (node.type === NodeType.lab) {
      // Get sequence records that are not linked
      const sequences = await sequence.getRecordByField('linkage_status', LinkageStatus.NOT_LINKED)

      // Filter out sequence records that do not have a sequence file attached
      const filteredSequences = sequences.data.filter(function (sequenceRecord) {
        return sequenceRecord.file_attached == "true"
      })

      const hashedIds = await identifiers.hashIds(filteredSequences, salt, correlationId)

      await identifiers.createTransient(NodeType.lab, sequences.data, hashedIds, correlationId)
      await transaction.update(correlationId, 'stage', TransactionStage.HASHED_IDS) // Stage completion flag
      // NEW FUNCTION
      getHashedIds(correlationId, ids, 1) // STARTING THE POLLING PROCESS (attempt = 1)

      return { data }
    } else if (node.type === NodeType.phu) {
      const notifications = await notification.getRecordByField('linkage_status', LinkageStatus.NOT_LINKED)
      const hashedIds = await identifiers.hashIds(notifications.data, salt, correlationId)

      await identifiers.createTransient(NodeType.phu, notifications.data, hashedIds, correlationId)
      await transaction.update(correlationId, 'stage', TransactionStage.HASHED_IDS) // Stage completion flag

      // const idsToSend = hashedIds.map(record => {
      //   const newRecord = { transient_id: record.hashed_id }
      //   return newRecord
      // })
      // sendHashedIds(correlationId, idsToSend, ids)
    }
  } catch (error) {
    logger.error('ERROR: Error generating hashed IDs')
    logger.error(error)
    return { message: error.message }
  }
}

const receiveHashedIds = async (req, res) => {
  const params = { ...req.body || {} }
  const target = req.get('Target-Node')
  const source = req.get('Source-Node')
  const headerIds = { target, source }

  try {
    await transaction.update(params.correlationId, 'stage', TransactionStage.HASHED_IDS_RECEIVED)

    // Linkage function params: 2 sets of hashed IDs, correlation ID
    const data = {
      stage: TransactionStage.HASHED_IDS_RECEIVED,
      correlationId: params.correlationId
    }

    // Once hashed IDs are received, check if transient db (lab node) has entries
    // If it has entries, get those with the IDs as kick off linkage function
    const currentTransientIds = await identifiers.getAllTransient(NodeType.lab)
    const externalTransientIds = params.idsToSend

    if (currentTransientIds.data.length > 0) {
      linkageController.linkRecords(currentTransientIds.data, externalTransientIds, params.correlationId, headerIds)
      return res.success({ data })
    } else {
      // TODO: Design solution to this case (Transaction and stage management)
      return res.internalServerError({ message: 'There are no transient IDs available to perform linkage' })
    }
  } catch (error) {
    logger.error(error)
    return res.internalServerError({ message: error.message })
  }
}

// NEW FUNCTIONS
const getHashedIds = async (correlationId, ids, attempt) => {

  const retries = 5 // Can be changed after some performance testing 
  let count = attempt

  logger.info(`CORR ${correlationId}: Getting hashed IDs from unlinked records on ${ids.target}`)
  try {
    // Find node details using ids from POST request
    const idDetails = helper.getNodeDetails(ids, config)

    // Pass details to POST only if they are within the same jurisdiction
    if (idDetails.target == null || idDetails.source == null) {
      const message = 'There was an error retrieving node details to continue transaction'
      throw new Error(message)
    }
    // POST: Correlation ID
    const options = generatePostOpt(idDetails.target.hostname, '/identifiers/unlinked', idDetails.target.port, 'POST', ids)
    const info = { correlationId }
    const dataString = JSON.stringify(info)
    options.headers['Content-Length'] = dataString.length

    // TODO: Make sure response is successful here
    // TODO: Change so API call is only made when lab node (current) has transient IDs
    const response = await apiClient.post(options.url, info, { headers: options.headers })

    const receivedIds = response.data.data

    const currentTransientIds = await identifiers.getAllTransient(NodeType.lab)
    const externalTransientIds = receivedIds

    if (externalTransientIds == null && count < retries) { // phu node is not ready yet
      count++
      logger.info(`CORR ${correlationId}: Attempt ${count}/${retries}`)
      setTimeout(function () {
        getHashedIds(correlationId, ids, count)
      }, 4000)
    } else if (currentTransientIds.data.length > 0 && externalTransientIds.length > 0) { // There are two sets of records to be compared
      await transaction.update(correlationId, 'stage', TransactionStage.HASHED_IDS_RETRIEVED)
      linkageController.linkRecords(currentTransientIds.data, externalTransientIds, correlationId, ids)
    } else { // Only one node has unlinked records or exhausted tries
      // TODO: New POST API to send status to partner node
      if (currentTransientIds.data.length === 0) {
        await transaction.update(correlationId, 'status', TransactionStatus.COMPLETE)
        await transaction.update(correlationId, 'message', 'Current node has no unlinked records to offer for linkage')
      } else if (externalTransientIds.length === 0) {
        await transaction.update(correlationId, 'status', TransactionStatus.COMPLETE)
        await transaction.update(correlationId, 'message', 'Target node has no unlinked records to offer for linkage')
      } else {
        await transaction.update(correlationId, 'status', TransactionStatus.FAILED)
        await transaction.update(correlationId, 'message', 'Records between nodes could not be assessed for matches')
      }
    }
  } catch (error) {
    logger.error(`CORR ${correlationId} : Error getting hashed IDs from unlinked records on ${ids.target}`)
    logger.error(error.message)
  }
}

const getHashedIdsResponse = async (req, res) => {
  const params = { ...req.body || {} }
  let data = null
  let message = ''
  try {
    const currentTransaction = await transaction.getById(params.correlationId)
    if (currentTransaction.data.length === 1) {
      if (currentTransaction.data[0].stage === TransactionStage.HASHED_IDS) {
        const transientIds = await identifiers.getAllTransient(NodeType.phu)
        data = transientIds.data

        if (transientIds.data.length > 0) {
          message = 'Successfully retrieved transient IDs'
        } else {
          // Terminate transaction
          message = 'No transient IDs available for linkage'
          await transaction.update(params.correlationId, 'status', TransactionStatus.COMPLETE)
          await transaction.update(params.correlationId, 'message', message)
        }
      } else {
        message = `Please try again, IDs have not yet been hashed. Current stage ${currentTransaction.data[0].stage}.`
      }
    } else {
      message = 'Please try again, no transactions matching the correlation ID could be retrieved.'
    }
    logger.info(`CORR ${params.correlationId}: ${message}`)
    res.success({ message, data })
  } catch (error) {
    logger.error('ERROR : Failed getting hashed IDs')
    logger.error(error.message)
    return res.internalServerError({ message: error.message })
  }
}

module.exports = {
  generateHashedIds,
  getHashedIds,
  getHashedIdsResponse,
  receiveHashedIds
}
