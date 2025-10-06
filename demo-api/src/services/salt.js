const db = require('../controllers/db.controller')
const helper = require('../helper')
const uuid = require('uuid')
const { logger } = require('../middleware/logger')

// All CRUD operations related to salt:
// - Get all salts
// - Get salts based on date, correlation ID, phu/Lab node ID
// etc

async function getAll () {
  let data = null
  try {
    const rows = await db.query(
      'SELECT * FROM Salt'
    )
    data = helper.emptyOrRows(rows)
  } catch (error) {
    logger.error('ERROR : Failed to get all salts')
    logger.error(error.message)
  }
  // logger.info(JSON.stringify(data))
  return {
    data
  }
}

async function create (correlationId, incomingSalt) {
  // Generate new salt
  let salt = ''
  let message = ''
  try {
    if (incomingSalt === null) {
      salt = uuid.v4()
    } else {
      salt = incomingSalt
    }

    // Insert salt into database table
    const result = await db.query(
      `INSERT INTO Salt 
      (correlation_id, salt) 
      VALUES 
      (?, ?)`, [correlationId, salt]
    )

    message = 'Error in creating new salt'

    if (result.affectedRows) {
      message = 'New salt created successfully'
    }
    // const ids = {
    //   phuId: transaction.phuId,
    //   labId: transaction.labId
    // }
    logger.info(`${correlationId}: ${message}`)
  } catch (error) {
    logger.error('ERROR : Failed to create new salt')
    logger.error(error.message)
  }

  return { message, salt }
}

async function update () {
  const data = ''

  return {
    data
  }
}

module.exports = {
  getAll,
  create,
  update
}
