const db = require('../controllers/db.controller')
const helper = require('../helper')
const { logger } = require('../middleware/logger')
const config = require('../config')

// Get all defined nodes in network
async function getAll () {
  let data = null
  try {
    const rows = await db.query(
      `SELECT * FROM Nodes WHERE node_type <> ?`, ['admin']
    )
    data = helper.emptyOrRows(rows)
  } catch (error) {
    logger.error('ERROR : Failed to get all nodes')
    logger.error(error.message)
  }

  return {
    data
  }
}

module.exports = {
  getAll,
}