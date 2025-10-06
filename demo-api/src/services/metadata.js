const db = require('../controllers/db.controller')
const helper = require('../helper')
const { logger } = require('../middleware/logger')
const config = require('../config')

// Get all metadata for a given records (by internal ID)
async function getMetadata (internal_id) {
  let data = null
  try {
    const rows = await db.query(
      `SELECT * FROM Metadata WHERE internal_id = ?`, [internal_id]
    )
    data = helper.emptyOrRows(rows)
  } catch (error) {
    logger.error(`ERROR : Failed to get metadata for internal ID = ${internal_id}`)
    logger.error(error.message)
  }

  return {
    data
  }
}

async function getLinkageFields (internal_id) {
  let data = null
  try {
    const rows = await db.query(
      `SELECT Metadata.column_name, Metadata.value FROM Metadata 
      INNER JOIN Columns ON Columns.column_name = Metadata.column_name
      WHERE internal_id = ? AND linkage_field = 'true'`, [internal_id]
    )
    data = helper.emptyOrRows(rows)
  } catch (error) {
    logger.error(`ERROR : Failed to get linkage fields for internal ID = ${internal_id}`)
    logger.error(error.message)
  }

  return {
    data
  }
}

async function getSharingFields (internal_id) {
  let data = null
  try {
    const rows = await db.query(
      `SELECT Metadata.column_name, Metadata.value FROM Metadata 
      INNER JOIN Columns ON Columns.column_name = Metadata.column_name
      WHERE internal_id = ? AND identifiable = 'false'`, [internal_id]
    )
    data = helper.emptyOrRows(rows)
  } catch (error) {
    logger.error(`ERROR : Failed to get sharing fields for internal ID = ${internal_id}`)
    logger.error(error.message)
  }

  return {
    data
  }
}

module.exports = {
  getMetadata,
  getLinkageFields,
  getSharingFields
}
