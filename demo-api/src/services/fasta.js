const db = require('../controllers/db.controller')
const helper = require('../helper')
const uuid = require('uuid')
const { logger } = require('../middleware/logger')
const fs = require('fs');
const config = require('../config');


async function get(id) {
  const filepath = `/user/code${config.fileStorage.fasta}${id}.fasta`
  const file = fs.createReadStream(filepath)

  return file
}

async function getFileDetailsById(ids) {
  let message = ''
  let data = null
  try {
    const idString = JSON.stringify(ids)
    const snipped = idString.substring(1, idString.length - 1);
    const query = `SELECT * FROM SequenceFiles WHERE internal_id IN (${snipped})`
    const rows = await db.query(query)
    data = helper.emptyOrRows(rows)
    return {
      data
    }
  } catch (error) {
    logger.error('ERROR : Failed to get fasta file details')
    logger.error(error)
  }

}

async function getAllFileDetails() {
  let message = ''
  let data = null
  try {
    const query =
      `SELECT * FROM SequenceFiles`
    const rows = await db.query(query)
    data = helper.emptyOrRows(rows)
    return {
      data
    }
  } catch (error) {
    logger.error('ERROR : Failed to get all fasta file details')
    logger.error(error)
  }

}

async function store(id, filename, correlationId, source) {
  let message = ''
  let data = null
  try {
    const filepath = `/user/code${config.fileStorage.fasta}${filename}`

    const query =
      `INSERT INTO SequenceFiles
      (file_name, file_path, internal_id, source_node_id)
      VALUES (?, ?, ?, ?)
      `
    const params = [filename, filepath, id, source]
    const rows = await db.query(query, params)
    data = helper.emptyOrRows(rows)
    logger.info(`CORR ${correlationId}: Fasta file successfully added to the database`)
  } catch (error) {
    logger.error('ERROR : Failed to store file details in database')
    logger.error(error)
    message = error
  }
}

async function updateRecordId(old_id, new_id, new_name) {
  let message = ''
  let data = null

  try {
    // // Fields being updated: internal_id, file_name, file_path
    const file_name = `${new_name}.fasta`
    const file_path = `/user/code${config.fileStorage.fasta}${file_name}`

    // Use replace to replace transient ID with external Id

    // 1. Get record id from transient Id
    const recordQuery =
      `SELECT id from SequenceFiles 
    WHERE internal_id = ?
    `
    const param = [old_id]
    const idResult = await db.query(recordQuery, param)
    const id = idResult[0].id

    // 2. Use record id to update all other fields
    const updateQuery = `
    UPDATE SequenceFiles
    SET internal_id = ?, file_name = ?, file_path = ?
    WHERE id = ?
    `
    const params = [new_id, file_name, file_path, id]
    const updateResult = await db.query(updateQuery, params)

    logger.info(`Fasta file details successfully updated in the database`)
  } catch (error) {
    logger.error('ERROR : Failed to update file in database')
    logger.error(error)
    message = error
  }
}

async function rename(initialName, newName) {

  const initalfilepath = `/user/code${config.fileStorage.fasta}${initialName}.fasta`
  const newfilepath = `/user/code${config.fileStorage.fasta}${newName}.fasta`

  await fs.promises.copyFile(initalfilepath, newfilepath)
}

async function replaceId(old_id, new_id, file_path) {
  // const filepath = `/user/code${config.fileStorage.fasta}${new_id}.fasta`
  try {
    const data = await fs.promises.readFile(file_path, 'utf8')
    const contents = data.replace(old_id, new_id)
    await fs.promises.writeFile(file_path, contents, 'utf8')
  } catch (e) {
    logger.error(e)
  }
}

async function remove(filename, correlationId) {
  try {
    const filepath = `/user/code${config.fileStorage.fasta}${filename}`
    await fs.promises.unlink(filepath,
      (err => {
        if (err) logger.error(`CORR ${correlationId}: ${err}`)
        else {
          logger.info(`CORR ${correlationId}: Deleted renamed fasta file successfully`)
        }
      })
    )
  } catch (e) {
    logger.error(e)
  }
}


module.exports = {
  get,
  store,
  updateRecordId,
  rename,
  replaceId,
  remove,
  getAllFileDetails,
  getFileDetailsById
}
