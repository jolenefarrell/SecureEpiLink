// const db = require('./db')
const helper = require('../helper')
const config = require('../config')
const { logger } = require('../middleware/logger')
const sequence = require('../services/sequence')
const notification = require('../services/notification')
const identifiers = require('../services/identifiers')
const transaction = require('../services/transaction')
const transactionController = require('./transaction.controller')
const fasta = require('../services/fasta')
const { NodeType } = require('../enum/nodes')
const { LinkageStatus } = require('../enum/record')
const { TransactionStage, TransactionStatus } = require('../enum/transaction')
const { prepFiles, prepAndShareFiles, cleanupSharedFiles } = require('./fasta.controller')
const { apiClient } = require('../middleware/auth')
const metadata = require('../services/metadata')

const linkRecords = async (currentTransientIds, externalTransientIds, correlationId, ids) => {
  try {
    await transaction.update(correlationId, 'stage', TransactionStage.LINKAGE)
    // Get matches: Match on transient_id AND make sure pathogen/record type is the same
    // TODO: Ensure pathogen is the abbreviation, not the ID as ID may be different between nodes
    logger.info(`CORR ${correlationId}: Comparing ${currentTransientIds.length} internal transient IDs with ${currentTransientIds.length} external.`)
    const matches = helper.compareArrayOfObjMulti(currentTransientIds, externalTransientIds, 'transient_id', 'pathogen')

    // Extract only unique matches
    const uniqueMatches = []
    for (const match of matches) {
      const result = matches.filter(obj => {
        return obj.transient_id === match.transient_id
      })
      if (result.length === 1) {
        uniqueMatches.push(match)
      }
    }
    // Continue flow if there are unique matches
    if (uniqueMatches.length > 0) {
      getLinkedRecordData(uniqueMatches, correlationId, ids)
    } else {
      //TODO: TERMINATE TRANSACTION
      // console.log('I WANT TO TERMINAAATE')
      const message = `CORR ${correlationId}: LINKAGE COMPLETE: ${uniqueMatches.length} records matched.`
      logger.info(message)
      await transactionController.terminate(correlationId, TransactionStatus.COMPLETE, TransactionStage.LINKAGE)
      //

    }
    return {
      message: `CORR ${correlationId}: LINKAGE COMPLETE: ${uniqueMatches.length} records matched.`,
      data: { matches }
    }
  } catch (error) {
    logger.error('ERROR : Failed to link records')
    logger.error(error)
    // TODO: Terminate transaction properly here
    return { message: error.message }
  }
}

const getLinkedRecordData = async (uniqueMatches, correlationId, ids) => {
  try {
    logger.info(`CORR ${correlationId}: Retrieving record metadata for sharing`)
    await transaction.update(correlationId, 'stage', TransactionStage.METADATA_RETRIEVAL)
    const dataToShare = []

    // NOTE: using the sequence service as linkage is happening on LAB node
    // This can be agnostic if sequence and notification services are combined
    await Promise.all(uniqueMatches.map(async match => {
      // 1. Get internal ID list from record_id in uniqueMatches
      const recordField = await sequence.getRecordByField('id', match.record_id)
      const recordInternalId = recordField.data[0].internal_id

      // 2. Generate POST data from ID list and sharing fields (getSharingFields)
      const recordMetadata = await metadata.getSharingFields(recordInternalId)
      const record = recordMetadata.data.reduce((obj, item) => ({
        ...obj,
        [item.column_name]: item.value
      }), {});

      // Add remaining essential fields and metadata as nested object
      const toAdd = {
        transient_id: match.transient_id,
        pathogen: match.pathogen,
        metadata: record
      }

      dataToShare.push(toAdd)
    }))

    sendLinkedRecords(dataToShare, correlationId, ids)

  } catch (error) {
    logger.error('ERROR : Failed to retrieve metadata for linked records')
    logger.error(error)
    // TODO: Terminate transaction properly here
    return { message: error.message }
  }
}

const sendLinkedRecords = async (records, correlationId, ids) => {
  try {
    // POST records and relevant data to participating phu node
    const idDetails = helper.getNodeDetails(ids, config)

    // Pass details to POST only if they are within the same jurisdiction
    if (idDetails.target == null || idDetails.source == null) {
      const message = 'There was an error retrieving node details to continue transaction'
      throw new Error(message)
    }

    logger.info(`CORR ${correlationId}: Sending ${records.length} records to participating ${idDetails.target.type} node ${idDetails.target.id}.`)

    await transaction.update(correlationId, 'stage', TransactionStage.MATCHED_DATA_TRANSFER)

    const options = helper.generatePostOpt(idDetails.target.hostname, '/records/linked', idDetails.target.port, 'POST', ids)
    const { form, toCleanUp } = await prepFiles(idDetails, ids, records, correlationId)

    if (records.length > 0) {
      logger.info(`CORR ${correlationId}: Prepared ${records.length} files to send to ${ids.target}`)
      // Only share files/metadata if there is a record to share
      let optionsHeaders = options.headers;
      delete optionsHeaders["Content-Type"];
      const response = await apiClient.post(options.url, form, { headers: { ...form.getHeaders(), ...optionsHeaders } })

      if (response.data.status == 'SUCCESS') {
        // await prepAndShareFiles(idDetails, ids, records, correlationId)
        // Clean up shared files 
        cleanupSharedFiles(toCleanUp, correlationId)
        //
        await transaction.update(correlationId, 'stage', TransactionStage.VERIFYING)
        getVerifiedRecords(correlationId, ids, 1) // STARTING THE POLLING PROCESS (attempt = 1)
      } else {
        // TODO: Send termination to partner node (fail transaction due to verification and clean up)
      }
    }
    else {
      // TODO: Send termination to partner node
      // Terminate transaction
      await transaction.update(correlationId, 'status', TransactionStatus.COMPLETE)
      await transaction.update(correlationId, 'records_linked', 0)
      await transaction.update(correlationId, 'message', 'No unique matches found for transaction')
    }
  } catch (error) {
    logger.error(`CORR ${correlationId} : Failed to send linked records`)
    // TODO: Terminate transaction properly here
    logger.error(error)
  }
}

const receiveLinkedRecords = async (req, res) => {
  logger.error('RECEIVING LINKED RECORDS')
  const params = { ...req.body || {} }
  const target = req.get('Target-Node')
  const source = req.get('Source-Node')
  const files = req.files || []
  const headerIds = { target, source }

  logger.error('PARSING JSON')
  console.dir(params)
  const records = JSON.parse(params.records)
  logger.error('PARSED JSON')

  try {
    logger.info(`CORR ${params.correlationId}: RECEIVED LINKED RECORDS`)
    if (records.length > 0) {
      await transaction.update(params.correlationId, 'stage', TransactionStage.MATCHED_DATA_TRANSFER)

      // Add record of the file into the database
      for (const file of files) {
        // TODO: This may not the most robust way of getting the transient id (sentName)
        const sentName = file.filename.split('Z_')[1]
        const transientId = sentName.split('.')[0]
        await fasta.store(transientId, file.filename, params.correlationId, source)
      }

      // res.send(req.files)

      // Once files are stored, move on to verification or records and adding them to db
      console.log("MOVING ON TO VERIFICATION")
      verifyLinkedRecords(records, params.correlationId, headerIds)
    } else {
      // Terminate transaction
      await transaction.update(params.correlationId, 'status', TransactionStatus.COMPLETE)
      await transaction.update(params.correlationId, 'records_linked', 0)
      await transaction.update(params.correlationId, 'message', 'No unique matches found for transaction')
    }
    return res.success({ message: 'Records received and now being verified' })
  } catch (error) {
    logger.error('ERROR : Error receiving linked records')
    logger.error(error)
    return res.internalServerError({ message: error.message })
  }
}

const verifyLinkedRecords = async (records, correlationId, ids) => {
  try {
    logger.info(`CORR ${correlationId}: VERIFYING RECORDS`)
    await transaction.update(correlationId, 'stage', TransactionStage.VERIFYING)
    // 1. Check hashed IDs received exist in TransientNotificationIdentifiers table
    const assessedRecords = [] // Just incase it may be useful to have a breakdown
    const verifiedRecords = [] // Sequence record
    const verifiedRecordIds = [] // Only ids of verified records

    for (const record of records) {
      const idExists = await identifiers.getTransientById(NodeType.phu, record.transient_id)
      if (idExists.data.length === 1) {
        assessedRecords.push({ transient_id: record.transient_id, internal_id: idExists.data[0].internal_id, exists: 'unique' })
        verifiedRecords.push(record)
      } else if (idExists.data.length > 1) {
        assessedRecords.push({ transient_id: record.transient_id, exists: 'many' })
      } else if (idExists.data.length === 0) {
        assessedRecords.push({ transient_id: record.transient_id, exists: 'none' })
      }
    }

    // 2. Get matching notifications then enter matching hashed IDs and corresponding notification metadata into NotificationLinked table
    // "verifiedRecord" = sequence record + metadata
    // "recordToAdd" = notification record + metadata

    const toCleanUp = []

    // TODO: TOIMPROVE: Carefully check that it is looping through each record in parallel
    // But waiting for each await to finish before moving on to the next step

    await Promise.all(verifiedRecords.map(async verifiedRecord => {
      const notificationId = await identifiers.getTransientById(NodeType.phu, verifiedRecord.transient_id) // transient id

      const id = notificationId.data[0].record_id
      const notificationRecord = await notification.getRecordByField('id', id) // notification record
      const notificationMetadata = await metadata.getSharingFields(notificationRecord.data[0].internal_id)
      const metadataStructured = await notificationMetadata.data.reduce((obj, item) => ({
        ...obj,
        [item.column_name]: item.value
      }), {});

      // Re-structure notification record to include relevant record fields + metadata
      const recordToAdd = {
        transient_id: verifiedRecord.transient_id,
        pathogen: notificationRecord.data[0].pathogen,
        metadata: metadataStructured
      }

      const externalIdResp = await identifiers.createExternal(correlationId, verifiedRecord.transient_id)

      await notification.addLinkedRecord(externalIdResp.externalID, recordToAdd, correlationId)
      await sequence.addLinkedRecord(externalIdResp.externalID, verifiedRecord, correlationId)

      // Fasta files need to be renamed with externalID or removed
      // TODO: TOIMPROVE: TransientSequenceFiles table to be added, then only proper file records added for 
      // verified records, including renaming files with external Ids and clearing table and files with transient ID at the end of transaction

      const file = await fasta.getFileDetailsById([verifiedRecord.transient_id])
      const newName = file.data[0].file_name.replace(verifiedRecord.transient_id, externalIdResp.externalID)


      // Strip extension before sending files
      await fasta.rename(file.data[0].file_name.replace('.fasta', ''), newName.replace('.fasta', ''))

      // Update ID inside the fasta file verifiedRecord.transient_id --> externalIdResp.externalID
      const currentFilePathValue = `/user/code${config.fileStorage.fasta}${newName}`

      await fasta.replaceId(verifiedRecord.transient_id, externalIdResp.externalID, currentFilePathValue)

      // Update sequence file records as well
      await fasta.updateRecordId(verifiedRecord.transient_id, externalIdResp.externalID, newName.replace('.fasta', ''))

      // await notification.createExternalId(verifiedRecord.transient_id, correlationId)
      // await sequence.createExternalId(verifiedRecord.transient_id, correlationId)

      // 5. Update linkage status of original records in Notifications table
      await notification.updateLinkageStatus(notificationRecord.data[0].internal_id, LinkageStatus.LINKED, correlationId)
      verifiedRecordIds.push({ transient_id: verifiedRecord.transient_id })

      // 6. Add records to LinkageIdentifiers table
      await identifiers.createLinkage(verifiedRecord.transient_id, correlationId, ids.source)
      toCleanUp.push(file.data[0].file_name)
    }))

    // Remove any sequence files that are stored according to any of the transient IDs involved in the transaction
    await cleanupSharedFiles(toCleanUp, correlationId)


    // // 7. Call sendVerification() and pass list of processed/verified hashed IDs
    // sendVerification(verifiedRecordIds, correlationId, ids)
    await transaction.update(correlationId, 'stage', TransactionStage.VERIFICATION_COMPLETE)
  } catch (error) {
    logger.error('ERROR: Failed to verify linked records')
    logger.error(error)
    return { error: error.message }
  }
}

const getVerifiedRecords = async (correlationId, ids, attempt) => {
  logger.info(`CORR ${correlationId}: Getting verified linked IDs from ${ids.target}`)
  const retries = 5 // Can be changed after some performance testing 
  let count = attempt
  try {
    // Find node details using ids from POST request
    const idDetails = helper.getNodeDetails(ids, config)

    // Pass details to POST only if they are within the same jurisdiction
    if (idDetails.target == null || idDetails.source == null) {
      const message = 'There was an error retrieving node details to continue transaction'
      throw new Error(message)
    }
    // POST: Correlation ID
    const info = { correlationId }
    const dataString = JSON.stringify(info)
    const options = helper.generatePostOpt(idDetails.target.hostname, '/records/linked/verified', idDetails.target.port, 'POST', ids)

    options.headers['Content-Length'] = dataString.length
    const response = await apiClient.post(options.url, info, { headers: options.headers })
    const verifiedIds = response.data.data

    if (verifiedIds == null && count < retries) { // phu node is not ready yet
      count++
      logger.info(`CORR ${correlationId}: Target node ${ids.target} verification incomplete (attempt ${count}/${retries})`)
      setTimeout(function () {
        getVerifiedRecords(correlationId, ids, count)
      }, 4000)
    } else if (verifiedIds?.length > 0) { //////////////////
      logger.info(`CORR ${correlationId}: Verified linked IDs received`)
      for (const verifiedId of verifiedIds) {
        // Add records to LinkageIdentifiers table with - Hashed ID (PK) correlation ID and communicating node ID
        await identifiers.createLinkage(verifiedId.transient_id, correlationId, ids.target)

        const sequenceId = await identifiers.getTransientById(NodeType.lab, verifiedId.transient_id) // transient id

        const recordId = sequenceId.data[0].record_id
        await sequence.updateLinkageStatus(recordId, LinkageStatus.LINKED, correlationId)
      }
      await identifiers.clearAllTransient(config.node.type, correlationId)
      await transaction.update(correlationId, 'status', TransactionStatus.COMPLETE)
      await transaction.update(correlationId, 'stage', TransactionStage.COMPLETE)
      await transaction.update(correlationId, 'records_linked', verifiedIds.length)

      // TODO: Terminate PNT
      return ({ message: 'Records received and transaction complete', correlationId })
    } else {
      logger.info(`CORR ${correlationId}: No verified linked IDs received`)
      await transaction.update(correlationId, 'status', TransactionStatus.COMPLETE)
      await transaction.update(correlationId, 'records_linked', 0)
      await transaction.update(correlationId, 'message', 'No verified linked IDs received')
    }
    //
  } catch (error) {
    logger.error('ERROR : Failed to get verified records')
    logger.error(error.message)
  }
}

const getVerifiedRecordsResponse = async (req, res) => {
  const params = { ...req.body || {} }
  let message = ''
  let data = null
  try {
    const currentTransaction = await transaction.getById(params.correlationId)
    if (currentTransaction.data.length === 1) {
      if (currentTransaction.data[0].stage === TransactionStage.VERIFICATION_COMPLETE) {
        const linkageIds = await identifiers.getLinkageById(params.correlationId)
        data = linkageIds.data || []
        message = 'Successfully retrieved linkage IDs'
        // Remove transient IDs
        await identifiers.clearAllTransient(config.node.type, params.correlationId)
        await transaction.update(params.correlationId, 'status', TransactionStatus.COMPLETE)
        await transaction.update(params.correlationId, 'stage', TransactionStage.COMPLETE)
        await transaction.update(params.correlationId, 'records_linked', data.length)
      } else {
        message = `Please try again, IDs have not yet been verified. Current stage ${currentTransaction.data[0].stage}.`
      }
    } else {
      message = 'Please try again, no transactions matching the correlation ID could be retrieved.'
    }

    logger.info(`CORR ${params.correlationId}: ${message}`)
    res.success({ message, data })
  } catch (error) {
    logger.error('ERROR: Failed getting verified IDs')
    logger.error(error.message)
    return res.internalServerError({ message: error.message })
  }
}

module.exports = {
  linkRecords,
  sendLinkedRecords,
  receiveLinkedRecords,
  verifyLinkedRecords,
  getVerifiedRecords,
  getVerifiedRecordsResponse
  // sendVerification,
  // receiveVerification
}
