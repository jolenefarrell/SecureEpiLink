const helper = require('../helper')
const { logger } = require('../middleware/logger')
const db = require('../controllers/db.controller')
const { createHash } = require('node:crypto')
const config = require('../config')
const metadata = require('../services/metadata')

async function hashIds (records, salt, correlationId) {
  logger.info(`CORR ${correlationId}: Generating hashed ids for ${records.length}`)
  const ids = []
  try {
    const data = JSON.parse(JSON.stringify(records))

    await Promise.all(data.map(async item => {
      const internalID = item.internal_id

      // Dynamically build strings to hash based on what fields are "linkage" for each record
      const linkageFields = await metadata.getLinkageFields(internalID)

      // Sort the fields alphabetically
      const orderedLinkageFields = linkageFields.data.sort((a, b) =>
        a.column_name.localeCompare(b.column_name));

      // Build string to hash from fields
      let stringToHash = ''
      orderedLinkageFields.forEach(element => {
        stringToHash = stringToHash.concat(element.value)
      });
      
      const unhashedId = stringToHash + salt

      const hashedID = createHash('sha256')
        .update(unhashedId)
        .digest('hex') // Returns a string representation of the hash

      ids.push({ id: item.id, internal_id: internalID, hashed_id: hashedID, pathogen: item.pathogen }) // Return pathogen here for pathogen-specific linkage later
    }))
  } catch (error) {
    logger.error('ERROR : Failed to hash IDs')
    logger.error(error)
  }
  return ids
}

async function createTransient (node, records, hashedIds, correlationId) {
  logger.info(`CORR ${correlationId}: Creating transient identifiers`)

  let data = null
  try {
    const dbTable = 'TransientIdentifiers'
    const query =
      `INSERT INTO ${dbTable}
      (record_id, transient_id, pathogen)
      VALUES
      (?, ?, ?)
      `
    const params = hashedIds.map(record => {
      const param = [record.id, record.hashed_id, record.pathogen]
      return param
    })
    const rows = await db.bulkQuery(query, params)
    data = helper.emptyOrRows(rows)
    logger.info(`CORR ${correlationId}: ${data.length}/${hashedIds.length} transient IDs inserted`)
  } catch (error) {
    logger.error('ERROR : Failed createTransient IDs')
    logger.error(error)
  }
  return { data }
}

async function getAllTransient () {
  let data = null
  try {
    const dbTable = 'TransientIdentifiers'
    const rows = await db.query(`SELECT * FROM ${dbTable}`)
    data = helper.emptyOrRows(rows)
  } catch (error) {
    logger.error('ERROR : Failed to get all transient IDs')
    logger.error(error.message)
  }
  return { data }
}

async function getTransientById (node, id) {
  let data = null
  try {
    const dbTable = 'TransientIdentifiers'
    const rows = await db.query(
      `SELECT * FROM ${dbTable} WHERE transient_id = ?`, [id]
    )
    data = helper.emptyOrRows(rows)
  } catch (error) {
    logger.error('ERROR : Failed get transient ID')
    logger.error(error.message)
  }
  return { data }
}

// Will only function intermittently (during a transaction)
async function getInternalIdByTransient (id) {
  let data = null
  try {
    const rows = await db.query(
      `SELECT internal_id FROM Records
      INNER JOIN TransientIdentifiers ON Records.id = TransientIdentifiers.record_id
      WHERE TransientIdentifiers.transient_id = ?
      `, [id]
    )
    data = helper.emptyOrRows(rows)
  } catch (error) {
    logger.error('ERROR : Failed get internal ID from transient ID')
    logger.error(error.message)
  }
  return { data }
}

async function clearAllTransient (node, correlationId) {
  logger.info(`CORR ${correlationId}: Clearing all transient IDs from transient identifiers table`)
  let data = null
  try {
    const dbTable = 'TransientIdentifiers'
    const rows = await db.query(
      `DELETE FROM ${dbTable}`
    )
    data = helper.emptyOrRows(rows)
  } catch (error) {
    logger.error('ERROR : Failed clear all transient IDs')
    logger.error(error.message)
  }
  return { data }
}

async function createLinkage (verifiedRecordId, correlationId, partnerNode) {
  let message = ''
  let data = null
  try {
    const query =
      `INSERT INTO LinkageIdentifiers
      (transient_id, correlation_id, partner_node)
      VALUES (?, ?, ?)
      `
    const params = [verifiedRecordId, correlationId, partnerNode]
    const rows = await db.query(query, params)
    data = helper.emptyOrRows(rows)
    logger.info(`CORR ${correlationId}: Linkage ID successfully added to the database`)
  } catch (error) {
    logger.error('ERROR : Failed to create linkage IDs')
    logger.error(error)
    message = error
  }
  return { message, data }
}

async function getAllLinkage () {
  let data = null
  try {
    const rows = await db.query('SELECT * FROM LinkageIdentifiers')
    data = helper.emptyOrRows(rows)
  } catch (error) {
    logger.error('ERROR : Failed to get all linkage IDs')
    logger.error(error.message)
  }
  return { data }
}

async function getLinkageById (correlationId) {
  let data = null
  try {
    const rows = await db.query('SELECT * FROM LinkageIdentifiers WHERE correlation_id = ?', [correlationId])
    data = helper.emptyOrRows(rows)
  } catch (error) {
    logger.error(`ERROR : Failed to get linkage ID from correlation ID : ${correlationId}`)
    logger.error(error.message)
  }
  return { data }
}

async function createExternal (correlationId, transient_id) {
  let data = null
  let externalID = null
  try {
    // 1. Create row
    const createQuery = await db.query(
      `INSERT INTO ExternalIdentifiers
      (correlation_id, transient_id)
      VALUES (?, ?)`, 
      [correlationId, transient_id]
    )

    // 2. Get id column for the added row
    const idQuery = await db.query('SELECT id FROM ExternalIdentifiers WHERE transient_id = ?', [transient_id])
    idResult = helper.emptyOrRows(idQuery)

    // 3. Generate external ID and insert into table
    externalID = helper.generateExternalIdString(config.node.id, idResult[0].id)
    const insertQuery = await db.query('UPDATE ExternalIdentifiers SET external_id = ? WHERE transient_id = ?', [externalID, transient_id])
    data = helper.emptyOrRows(insertQuery)
    logger.info(`CORR ${correlationId} : External ID successfully created`)
  } catch (error) {
    logger.error(`CORR ${correlationId} : ERROR Failed to create external ID`)
    logger.error(error.message)
  }
  return { data, externalID }
}


module.exports = {
  hashIds,
  createTransient,
  getAllTransient,
  getTransientById,
  getInternalIdByTransient,
  clearAllTransient,
  createLinkage,
  getAllLinkage,
  getLinkageById,
  createExternal
}
