const db = require('../controllers/db.controller')
const helper = require('../helper')
const { logger } = require('../middleware/logger')
const config = require('../config')
const fields = require('../services/fields')
const pathogen = require('../services/pathogen')
const notification = require('../services/notification')
const transaction = require('../services/transaction')
const sequence = require('../services/sequence')
const metadata = require('../services/metadata')
const fasta = require('../services/fasta')
const uploadController = require('../controllers/upload.controller')
const { NodeType } = require('../enum/nodes')
const { TransactionStage } = require('../enum/transaction')


const serviceCheck = async (req, res) => {
  logger.info('TESTING REQUEST: Service check')
  const userMessage = req.query.message
  let message = null
  try {
    if (userMessage) {
      message = `Service is running! Your input message was: ${userMessage}`
    } else {
      message = "Service is running! Try inputting a message by add a 'message' query parameter to your request."
    }
    return res.success({ message })
  } catch (error) {
    return res.internalServerError({ message: error.message })
  }
}

const getConfig = async (req, res) => {
  logger.info('TESTING REQUEST: Get configuration')
  let message = null
  let data = null
  try {
    // Config: Node id and type, valid pathogens, and columns
    const nodeId = config.node.id
    const nodeType = config.node.type
  
    // TODO: Note that columns are only being retrieved by node type currently, despite more columns technically configured
    // Because business logic currently suggests PHU node will only store notification type
    // And LAB node will only store sequence type for now, if we want to show all columns technically configure we can use:
    // const columns = await fields.getMetadataColumns()

    const columns = await fields.getMetadataColumnsByNodeType(nodeType)
    const pathogens = await pathogen.getAll()
    data = {
      nodeId,
      nodeType,
      validPathogens: pathogens.data,
      metadataColumns: columns.data
    }
    message = "Successfully retrieved node configuration"

    return res.success({ message, data })
  } catch (error) {
    return res.internalServerError({ message: error.message })
  }
}

//TODO: Upload functions (by-passing for the moment)
const uploadSequence = async (req, res) => {
  logger.info('TESTING REQUEST: Upload sequences')
  try {
    const upload = await uploadController.uploadRecord(req, res)
    return res.success({ message, data })
  } catch (error) {
    return res.internalServerError({ message: error.message })
  }
  
}

const uploadNotification = async (req, res) => {
  logger.info('TESTING REQUEST: Upload notifications')
  try {
    const upload = await uploadController.uploadRecord()
    return res.success({ message, data })
  } catch (error) {
    return res.internalServerError({ message: error.message })
  }
}
//

const getAllRecords = async (req, res) => {
  logger.info('TESTING REQUEST: Get all records')
  let message = null
  let data = null
  let records = null
  try {
    const nodeType = config.node.type
    const pathogen = req.body.pathogen || 'all' // PATHOGEN PARAM
    console.log(nodeType, pathogen) 

    if (nodeType == NodeType.phu) {
      if (pathogen == "all") {
        records = await notification.getAll()
      } else {
        records = await notification.getRecordByField('pathogen', pathogen)
      }
      
      for (const record of records.data) {
        const md = await metadata.getMetadata(record.internal_id)
        const condensed = md.data.reduce((obj, item) => ({
          ...obj,
          [item.column_name]: item.value
        }), {});

        record.metadata = condensed
      }
      
      data = records.data

    } else if (nodeType == NodeType.lab) {
      if (pathogen == "all") {
        records = await sequence.getAll()
      } else {
        records = await sequence.getRecordByField('pathogen', pathogen)
      }

      for (const record of records.data) {
        const md = await metadata.getMetadata(record.internal_id)
        const condensed = md.data.reduce((obj, item) => ({
          ...obj,
          [item.column_name]: item.value
        }), {});

        record.metadata = condensed
      }
      
      data = records.data
    }
    message = "Successfully retrieved all records and corresponding metadata."
    return res.success({ message, data })
  } catch (error) {
    return res.internalServerError({ message: error.message })
  }
}

const getAllRecordsById = async (req, res) => {
  logger.info('TESTING REQUEST: Get all records by ID')
  let message = null
  let data = null
  try {
    const ids = req.body.ids
    if (ids == undefined || ids == null || ids.length == 0) {
      message = "No record IDs provided"
      logger.error(message)
      return res.badRequest({ message })
    }
    const nodeType = config.node.type
    if (nodeType == NodeType.phu) {
      const records = await notification.getRecordsByInternalId(ids, '*')
      for (const record of records.data) {
        const md = await metadata.getMetadata(record.internal_id)
        const condensed = md.data.reduce((obj, item) => ({
          ...obj,
          [item.column_name]: item.value
        }), {});

        record.metadata = condensed
      }
      
      data = records.data

    } else if (nodeType == NodeType.lab) {
      const records = await sequence.getRecordsByInternalId(ids, '*')
      for (const record of records.data) {
        const md = await metadata.getMetadata(record.internal_id)
        const condensed = md.data.reduce((obj, item) => ({
          ...obj,
          [item.column_name]: item.value
        }), {});

        record.metadata = condensed
      }
      
      data = records.data
    } 

    if (data.length !== 0) {
      message = `Successfully retrieved records for ${data.length}/${ids.length} records.`
      return res.success({ message, data })
    } else {
      message = `Could not retrieve any records in the database matching the input record ids.`
      return res.recordNotFound({ message, data })
    }
    
  } catch (error) {
    return res.internalServerError({ message: error.message })
  }
}

const getSequenceFiles = async (req, res) => {
  logger.info('TESTING REQUEST: Get sequence files details')
  let message = null
  let data = null
  try {
    const files = await fasta.getAllFileDetails()
    data = files.data
    message = "Successfully retrieved available sequence file details."

    return res.success({ message, data })
  } catch (error) {
    return res.internalServerError({ message: error.message })
  }
}

const getSequenceFilesById = async (req, res) => {
  logger.info('TESTING REQUEST: Get sequence files details by ID')
  let message = null
  let data = null
  try {
    const ids = req.body.ids
    if (ids == undefined || ids == null || ids.length == 0) {
      message = "No record IDs provided"
      logger.error(message)
      return res.badRequest({ message })
    }
    const files = await fasta.getFileDetailsById(ids)
    data = files.data

    if (data.length !== 0) {
      message = `Successfully retrieved all current sequence file details for ${data.length}/${ids.length} records.`
      return res.success({ message, data })
    } else {
      message = `Could not retrieve any files records in the database matching the input record ids.`
      return res.recordNotFound({ message, data })
    }

    
  } catch (error) {
    return res.internalServerError({ message: error.message })
  }
}

const getTransaction = async (req, res) => {
  logger.info('TESTING REQUEST: Get transaction')
  let message = null
  let data = null
  try {
    const correlationId = req.body.correlationId
    if (correlationId == undefined || correlationId == null) {
      message = "No correlation ID provided"
      logger.error(message)
      return res.badRequest({ message })
    }

    const record = await transaction.getById(correlationId)
    data = record.data[0]

    if (data == null | data == undefined) {
      message = `Could not retrieve transaction record in the database matching the input correlation ID: ${correlationId}.`
      return res.recordNotFound({ message, data })
    } else {
      message = "Successfully retrieved transaction details."
      return res.success({ message, data })
    }
    
  } catch (error) {
    return res.internalServerError({ message: error.message })
  }
}

const getLinkedRecords = async (req, res) => {
  logger.info('TESTING REQUEST: Get linked records')
  let message = null
  let data = null
  let rows = null
  try {
    const correlationId = req.body.correlationId
    const pathogen = req.body.pathogen || 'all' // PATHOGEN PARAM
    if (pathogen == 'all') {
      if (correlationId == undefined || correlationId == null || correlationId == '') {
        rows = await db.query(
          `SELECT * FROM RecordsLinked`
        )
      } else {
        rows = await db.query(
          `SELECT * FROM RecordsLinked WHERE correlation_id=?`, [correlationId]
        )
      }
    } else {
      if (correlationId == undefined || correlationId == null || correlationId == '') {
        rows = await db.query(
          `SELECT * FROM RecordsLinked WHERE pathogen=?`, [pathogen]
        )
      } else {
        rows = await db.query(
          `SELECT * FROM RecordsLinked WHERE correlation_id=? AND pathogen=?`, [correlationId, pathogen]
        )
      }
    }
    
    const records = helper.emptyOrRows(rows)

    for (const record of records) {
      // Check if fasta file matching the ID
      const fasta = await db.query(
        `SELECT * FROM SequenceFiles WHERE internal_id=?`, [record.external_id]
      )
      record.sequence_file = ((fasta.length > 0) ? 'true' : 'false');

      // Get metadata for the record
      const mdRows = await db.query(
        `SELECT * FROM MetadataLinked WHERE external_id=?`, [record.external_id]
      )
      const md = helper.emptyOrRows(mdRows)

      const condensed = md.reduce((obj, item) => ({
        ...obj,
        [item.column_name]: item.value
      }), {});

      record.metadata = condensed
    }

    // 
    data = records
    if (data == null | data == undefined | data.length == 0) {
      message = `Could not retrieve any records.`
      return res.recordNotFound({ message, data })
    }  else {
      message = "Successfully retrieved all linked records."
      return res.success({ message, data })
    }
  } catch (error) {
    return res.internalServerError({ message: error.message })
  }
}

// Transaction information and list of linked records + metadata
const getLinkageSummary = async (req, res) => {
  logger.info('TESTING REQUEST: Get linkage summary')
  let message = null
  let data = null
  let summary = null
  try {
    const correlationId = req.body.correlationId
    if (correlationId == undefined || correlationId == null) {
      message = "No correlation ID provided"
      logger.error(message)
      return res.badRequest({ message })
    }
    // Below could be independent functions called multiple times in this file
    // 1. GET TRANSACTION RECORD
    const transactionRecord = await transaction.getById(correlationId)
    const transactionRecordData = transactionRecord.data[0]

    if (transactionRecordData == null | transactionRecordData == undefined) {
      message = `Could not retrieve transaction record in the database matching the input correlation ID: ${correlationId}.`
      return res.recordNotFound({ message, data })
    }
    // 2. GET LINKED RECORDS
    const rows = await db.query(
      `SELECT * FROM RecordsLinked WHERE correlation_id=?`, [correlationId]
    )
    const records = helper.emptyOrRows(rows)

    for (const record of records) {
      // Check if fasta file matching the ID
      const fasta = await db.query(
        `SELECT * FROM SequenceFiles WHERE internal_id=?`, [record.external_id]
      )
      record.sequence_file = ((fasta.length > 0) ? 'true' : 'false');

      // Get metadata for the record
      const mdRows = await db.query(
        `SELECT * FROM MetadataLinked WHERE external_id=?`, [record.external_id]
      )
      const md = helper.emptyOrRows(mdRows)

      const condensed = md.reduce((obj, item) => ({
        ...obj,
        [item.column_name]: item.value
      }), {});

      record.metadata = condensed
    }
    //

    if (transactionRecordData.status == TransactionStage.COMPLETE) {
      summary = {
        correlationId,
        totalRecordsLinked: transactionRecordData.records_linked,
        linkedRecords: records
      }
      message = "Successfully retrieved linkage transaction summary."
    } else {
      summary = {
        ...transactionRecordData
      }
      message = "Linkage summary could not be generated, transaction incomplete."
    }
  
    data = summary

    return res.success({ message, data })
  } catch (error) {
    return res.internalServerError({ message: error.message })
  }
}

module.exports = {
  serviceCheck,
  getConfig,
  uploadSequence,
  uploadNotification,
  getAllRecords,
  getAllRecordsById,
  getSequenceFiles,
  getSequenceFilesById,
  getTransaction,
  getLinkedRecords,
  getLinkageSummary
}