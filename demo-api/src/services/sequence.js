const db = require('../controllers/db.controller')
const helper = require('../helper')
const { logger } = require('../middleware/logger')
const config = require('../config')

// All CRUD operations related to sequence records:
// - Create sequence record
// - Update sequence record
// etc

// Get all sequence records
async function getAll () {
  let data = null
  try {
    const rows = await db.query(
      `SELECT * FROM Records WHERE record_type = ?`, ['sequence']
    )
    data = helper.emptyOrRows(rows)
  } catch (error) {
    logger.error('ERROR : Failed to retrieve all sequence records')
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
      `SELECT * FROM Records WHERE record_type = ? AND ${field}=?`, ['sequence', value]
    )
    data = helper.emptyOrRows(rows)
  } catch (error) {
    logger.error(`ERROR : Failed to retrieve ${field} for record`)
    logger.error(error.message)
  }
  return {
    data
  }
}

async function getRecordsByInternalId (ids, selectionFields) {
  let data = null
  try {
    const idString = JSON.stringify(ids)
    const snipped = idString.substring(1, idString.length-1);
    
    const rows = await db.query(
      `SELECT ${selectionFields} FROM Records
      WHERE record_type = ? AND internal_id IN (${snipped})`, ['sequence']
    )
    data = helper.emptyOrRows(rows)
  } catch (error) {
    logger.error('ERROR : Failed to get sequence record by internal ID')
    logger.error(error.message)
  }
  return {
    data
  }
}

async function addLinkedRecord (externalId, record, correlationId) {
  try {
    const query = `INSERT INTO MetadataLinked 
      (external_id, column_name, value)
      VALUES 
      (?, ?, ?)`
    const paramsArray = []

    Object.entries(record.metadata).forEach(([key, value]) => {
      const arr = [externalId, key, value]
      paramsArray.push(arr)
    })
    
    const result = await db.bulkQuery(query, paramsArray)

    if (result.affectedRows) {
      logger.info(`CORR ${correlationId}: New linked sequence metadata added successfully`)
    }
  } catch (error) {
    logger.error(`CORR ${correlationId}: Error in adding new linked sequence record`)
    logger.error(error.message)
  }
}

async function updateLinkageStatus (id, status, correlationId) {
  let message = ''
  try {
    const result = await db.query(
      `UPDATE Records 
      SET linkage_status= ?
      WHERE id= ? AND record_type=?`, [status, id, 'sequence']
    )

    message = `CORR ${correlationId}: Error updating sequence record linkage status: ${status}`

    if (result.affectedRows) {
      logger.info(`CORR ${correlationId}: Sequence record linkage status updated successfully: ${status}`)
    }
  } catch (error) {
    logger.error(`CORR ${correlationId}: Error updating sequence record linkage status: ${status}`)
    logger.error(error.message)
  }
  return { message }
}

module.exports = {
  getAll,
  getRecordByField,
  getRecordsByInternalId,
  addLinkedRecord,
  updateLinkageStatus
}
