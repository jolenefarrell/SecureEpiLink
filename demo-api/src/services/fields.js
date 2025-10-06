const db = require('../controllers/db.controller')
const helper = require('../helper')
const { logger } = require('../middleware/logger')
const config = require('../config')
const pathogen = require('./pathogen')
const { NodeType } = require('../enum/nodes')

async function getMetadataColumns () {
  let data = null
  try {
    const rows = await db.query(
      `SELECT * FROM Columns`, []
    )
    data = helper.emptyOrRows(rows)
  
  } catch (error) {
    logger.error(`ERROR : Failed to get metadata columns`)
    logger.error(error.message)
  }

  return {
    data
  }
}

async function getMetadataColumnsByNodeType (type) {
  let data = null
  try {
    let recordType = ""
    if (type == NodeType.phu) {
      recordType = "notification"
    } else if (type == NodeType.lab) {
      recordType = "sequence"
    }
    // console.log(`GETTING FIELDS FOR: ${recordType}, ${type}`)
    const rows = await db.query(
      `SELECT * FROM Columns WHERE record_type = ?`, [recordType]
    )
    data = helper.emptyOrRows(rows)
  
  } catch (error) {
    logger.error(`ERROR : Failed to get metadata columns`)
    logger.error(error.message)
  }

  return {
    data
  }
}

async function getMetadataColumnsByRecordType (recordType) {
  let data = null
  try {
    const rows = await db.query(
      `SELECT * FROM Columns WHERE record_type = ?`, [recordType]
    )
    data = helper.emptyOrRows(rows)
  
  } catch (error) {
    logger.error(`ERROR : Failed to get metadata columns`)
    logger.error(error.message)
  }

  return {
    data
  }
}


async function getLinkageColumns (pathogen) {
  let data = null
  try {
    // 1. Get pathogen id
    const pathogenId = await pathogen.getPathogen(pathogen)

    data = pathogenId
  
  } catch (error) {
    logger.error(`ERROR : Failed to get identifiable columns for ${pathogen}`)
    logger.error(error.message)
  }

  return {
    data
  }
}

async function getIdentifiableColumns (pathogen) {
  let data = null
  try {
    // 1. Get pathogen id
    const pathogenId = await db.query(
      `SELECT ? FROM Pathogens WHERE abbreviation = ?`, ['id', pathogen]
    )

    const rows = await db.query(
      `SELECT * FROM Columns WHERE pathogen = ? AND identifiable = ?`, [pathogenId, 'true']
    )
    data = helper.emptyOrRows(rows)
  
  } catch (error) {
    logger.error(`ERROR : Failed to get identifiable columns for ${pathogen}`)
    logger.error(error.message)
  }

  return {
    data
  }
}

module.exports = {
  getMetadataColumns,
  getMetadataColumnsByNodeType,
  getMetadataColumnsByRecordType,
  getIdentifiableColumns,
  getLinkageColumns
}
