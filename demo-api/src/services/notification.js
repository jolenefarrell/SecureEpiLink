const db = require('../controllers/db.controller')
const helper = require('../helper')
const { logger } = require('../middleware/logger')
const config = require('../config')

// All CRUD operations related to notification records:
// - Get all notification records
// - Get notification records based on linkage status
// - Create notification record
// - Update notification record
// etc

// Get all notification records
async function getAll () {
  let data = null
  try {
    const rows = await db.query(
      `SELECT * FROM Records WHERE record_type = ?`, ['notification']
    )
    data = helper.emptyOrRows(rows)
  } catch (error) {
    logger.error('ERROR : Failed to get all notification records')
    logger.error(error.message)
  }

  return {
    data
  }
}

// Get sequence records based on linkage status
async function getRecordByField (field, value) {
  let data = null
  try {
    const rows = await db.query(
      `SELECT * FROM Records WHERE record_type = ? AND ${field}=?`, ['notification', value]
    )
    data = helper.emptyOrRows(rows)
  } catch (error) {
    logger.error(`ERROR : Failed to get ${field} from record`)
    logger.error(error.message)
  }

  return {
    data
  }
}

async function getRecordsByInternalId (ids, selectionFields) {
  const idString = JSON.stringify(ids)
  const snipped = idString.substring(1, idString.length-1);
  let data = null

  try {
    const rows = await db.query(
      `SELECT ${selectionFields} FROM Records
      WHERE record_type = ? AND internal_id IN (${snipped})`, ['notification']
    )
    data = helper.emptyOrRows(rows)
  } catch (error) {
    logger.error('ERROR : Failed to get notification record by internal ID')
    logger.error(error.message)
  }
  return {
    data
  }
}

async function addLinkedRecord (externalId, record, correlationId) {
  // Record fields: external_id, correlation_id, pathogen
  // TODO: Pathogen id has to be recorded dynamically via abbreviation I think because not all pathogen IDs will be the same across nodes
  try {
    // Add record and record system fields
    const query = `INSERT INTO RecordsLinked 
    (external_id, correlation_id, pathogen)
    VALUES 
    (?, ?, ?)`
    const params = [externalId, correlationId, record.pathogen]
    const result = await db.query(query, params)

    if (result.affectedRows) {
      logger.info(`CORR ${correlationId}: New linked record added successfully`)
    }

    const query2 = `INSERT INTO MetadataLinked 
      (external_id, column_name, value)
      VALUES 
      (?, ?, ?)`

    const paramsArray = []

    Object.entries(record.metadata).forEach(([key, value]) => {
      const arr = [externalId, key, value]
      paramsArray.push(arr)
    })
    
    const result2 = await db.bulkQuery(query2, paramsArray)

    if (result2.affectedRows) {
      logger.info(`CORR ${correlationId}: New linked record metadata added successfully`)
    }

  } catch (error) {
    logger.error(`CORR ${correlationId}: Error in adding new linked record`)
    logger.error(error.message)
  }
}

async function updateLinkageStatus (id, status, correlationId) {
  try {
    const result = await db.query(
      `UPDATE Records 
      SET linkage_status = ?
      WHERE internal_id = ? AND record_type=?`, [status, id, 'notification']
    )
    if (result.affectedRows) {
      logger.info(`CORR ${correlationId}: Notification record linkage status updated successfully: ${status}`)
    }
  } catch (error) {
    logger.error(`CORR ${correlationId}: Error updating notification record linkage status: ${status}`)
    logger.error(error.message)
  }
}


module.exports = {
  getAll,
  getRecordByField,
  getRecordsByInternalId,
  addLinkedRecord,
  updateLinkageStatus
}
