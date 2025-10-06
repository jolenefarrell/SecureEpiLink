const db = require('../controllers/db.controller')
const helper = require('../helper')
const { logger } = require('../middleware/logger')
const config = require('../config')

async function getAll() {
  let data = null
  try {
    const rows = await db.query(
      `SELECT * FROM Pathogens`
    )
    data = helper.emptyOrRows(rows)
  
  } catch (error) {
    logger.error(`ERROR : Failed to get pathogens`)
    logger.error(error.message)
  }
  return {
    data
  }
}

async function getPathogenAbbrev (id) {
  let data = null
  try {
    // 1. Get pathogen id
    const rows = await db.query(
      `SELECT ? FROM Pathogens WHERE id = ?`, ['abbreviation', id]
    )
    data = helper.emptyOrRows(rows)
  
  } catch (error) {
    logger.error(`ERROR : Failed to get pathogen abbreviation for id ${id}`)
    logger.error(error.message)
  }

  return {
    data
  }
}

async function getPathogenId (abbrev) {
  let data = null
  try {
    // 1. Get pathogen id
    const rows = await db.query(
      `SELECT ? FROM Pathogens WHERE abbreviation = ?`, ['id', abbrev]
    )
    data = helper.emptyOrRows(rows)
  
  } catch (error) {
    logger.error(`ERROR : Failed to get pathogen id for abbreviation ${abbrev}`)
    logger.error(error.message)
  }

  return {
    data
  }
}

module.exports = {
  getAll,
  getPathogenAbbrev,
  getPathogenId
}
