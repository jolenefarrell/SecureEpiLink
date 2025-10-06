const { logger } = require('../middleware/logger')
const db = require('../controllers/db.controller')
const validation = require('../services/validation')

// TODO: Account for case when record is added successfully and metadata isnt (or vice versa)
async function add(record) {
  let message = ''
  let data = null
  try {
    // Add record and record system fields
    const query = `INSERT INTO Records 
    (internal_id, pathogen, record_type)
    VALUES 
    (?, ?, ?)`
    const params = [record.internal_id, record.pathogen, record.record_type]

    // Upload all other columns other than minimal (which have been validated previously) to db
    const query2 = `INSERT INTO Metadata 
      (internal_id, column_name, value)
      VALUES 
      (?, ?, ?)`

    const paramsArray = []
    Object.entries(record).forEach(([key, value]) => {
      if (!validation.minimal.includes(key)) { 
        const arr = [record.internal_id, key, value]
        paramsArray.push(arr)
      }
    })
    
    const result = await db.query(query, params)

    if (result.affectedRows) {
      logger.info(`New record added successfully`)
    }

    const result2 = await db.bulkQuery(query2, paramsArray)
    logger.info(`New record metadata added successfully`)

    if (result.affectedRows && result2) {
      return {
        isValid: true,
        message: 'New record and metadata added successfully'
      }
    } else {
      return {
        isValid: false,
        message: 'New record and metadata could not be added successfully'
      }
    }

  } catch (error) {
    logger.error(`Error in adding new record`)
    logger.error(error.message)
    return {
      isValid: false,
      message: error.message
    }
  }
}

async function updateFile(id, value) {
  try {
    const result = await db.query(
      `UPDATE Records 
      SET file_attached = ?
      WHERE internal_id = ?`, [value, id]
    )
    if (result.affectedRows) {
      logger.info(`FILE ID ${id}: Record file attachment updated successfully`)
    }
  } catch (error) {
    logger.error(`FILE ID ${id}: Error updating record file attachment`)
    logger.error(error.message)
  }
}

module.exports = {
  add,
  updateFile
}
