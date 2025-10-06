const db = require('../controllers/db.controller')
const { TransactionStatus } = require('../enum/transaction')
const helper = require('../helper')
// const config = require('../config')
const { logger } = require('../middleware/logger')
const uuid = require('uuid')

// Get all transactions
async function getAll () {
  let data = null
  try {
    const rows = await db.query(
      'SELECT * FROM Transactions'
    )
    data = helper.emptyOrRows(rows)
  } catch (error) {
    logger.error('ERROR: Getting all transactions FAILED')
    logger.error(error.message)
  }

  return {
    data
  }
}

async function getById (correlationId) {
  let data = null
  try {
    const rows = await db.query(
      'SELECT * FROM Transactions WHERE correlation_id = ?', [correlationId]
    )
    data = helper.emptyOrRows(rows)
  } catch (error) {
    logger.error('ERROR: Getting transaction by correlation id FAILED')
    logger.error(error.message)
  }

  return {
    data
  }
}

// Create new transaction
// TODO: Shouldn't be manually inserting phu ID vs lab ID
// It should just be who initiated vs who received the transaction

async function create (correlationId, ids, stage) {
  let message = ''
  try {
    // Generate correlation ID here if its not passed in transaction object
    if (correlationId == null || correlationId === '') {
      correlationId = uuid.v4()
    }
    logger.info(`CORR ${correlationId}: Creating a new transaction`)
    // TODO: Change here if there are other transaction types
    const result = await db.query(
      `INSERT INTO Transactions 
      (stage, target_id, source_id, correlation_id, status, message, type)
      VALUES 
      (?, ?, ?, ?, ?, ?, ?)
      `, [stage, ids.target, ids.source, correlationId, TransactionStatus.IN_PROGRESS, '', 'linkage']
    )

    message = 'Error in creating transaction'

    if (result.affectedRows) {
      message = 'Transaction created successfully'
    }
    logger.info(`CORR ${correlationId}: ${message} : ${JSON.stringify(ids)}`)
  } catch (error) {
    logger.error(`CORR ${correlationId}: Error creating a new transaction : ${JSON.stringify(ids)}`)
    logger.error(error.message)
  }

  return { correlationId, message }
}

// Update transaction
async function update (correlationId, field, value) {
  let message = `CORR ${correlationId}: Updating transaction field ${field}`
  try {
    const result = await db.query(
      `UPDATE Transactions
      SET ${field}= ?
      WHERE correlation_id= ?`, [value, correlationId]
    )

    message = `CORR ${correlationId}: Error updating transaction field ${field}`

    if (result.affectedRows) {
      logger.info(`CORR ${correlationId}: Transaction ${field} updated successfully: ${value}`)
    }
  } catch (error) {
    logger.error(`ERROR: Updating transaction ${field} to ${value} FAILED`)
    logger.error(error.message)
  }

  return { message }
}


module.exports = {
  getAll,
  getById,
  create,
  update
}
