const { logger } = require("../middleware/logger")
const identifiers = require('../services/identifiers')
const fasta = require('../services/fasta')
const fs = require('fs');
const FormData = require('form-data')
const { default: axios } = require('axios')
const helper = require('../helper')
const config = require('../config');
const { apiClient } = require("../middleware/auth");

const prepFiles = async (idDetails, ids, records, correlationId) => {
  try {
    logger.info(`CORR ${correlationId}: Preparing ${records.length} fasta files to ${ids.target}`)
    const form = new FormData()
    const toCleanUp = []

    for (const record of records) {
      // Retrieve internal_id temporarily for file prep (its not present here as it shouldn't be shared)
      const internalIdObj = await identifiers.getInternalIdByTransient(record.transient_id)
      const internalId = internalIdObj.data[0].internal_id

      // 1. Get file paths from db using record id
      const file = await fasta.getFileDetailsById([internalId])
      const initialFullName = file.data[0].file_name
      // const initialName = initialFullName.split(".")[0]
      const initialName = initialFullName.replace(".fasta", "")
      const newName = record.transient_id
      await fasta.rename(initialName, newName, correlationId)
      await fasta.replaceId(internalId, record.transient_id, `/user/code${config.fileStorage.fasta}${record.transient_id}.fasta`)
      toCleanUp.push(`${newName}.fasta`)

      const fileStream = fs.createReadStream(`/user/code${config.fileStorage.fasta}${newName}.fasta`)
      form.append('files', fileStream, `${newName}.fasta`)
    }

    form.append('correlationId', correlationId)
    form.append('records', JSON.stringify(records))

    return {
      form, toCleanUp
    }
  } catch (error) {
    logger.error(error)
    throw Error('Failed to prepare fasta files')
  }
}

const prepAndShareFiles = async (idDetails, ids, records, correlationId) => {
  try {
    logger.info(`CORR ${correlationId}: Preparing and sending ${records.length} fasta files to ${ids.target}`)
    const secondaryOptions = helper.generatePostOpt(idDetails.target.hostname, '/fasta/upload', idDetails.target.port, 'POST', ids)
    const form = new FormData()
    const toCleanUp = []

    for (const record of records) {
      // Retrieve internal_id temporarily for file prep (its not present here as it shouldn't be shared)
      const internalIdObj = await identifiers.getInternalIdByTransient(record.transient_id)
      const internalId = internalIdObj.data[0].internal_id

      // 1. Get file paths from db using record id
      const file = await fasta.getFileDetailsById([internalId])
      const initialFullName = file.data[0].file_name
      // const initialName = initialFullName.split(".")[0]
      const initialName = initialFullName.replace(".fasta", "")
      const newName = record.transient_id
      await fasta.rename(initialName, newName, correlationId)
      await fasta.replaceId(internalId, record.transient_id, `/user/code${config.fileStorage.fasta}${record.transient_id}.fasta`)
      toCleanUp.push(`${newName}.fasta`)

      const fileStream = fs.createReadStream(`/user/code${config.fileStorage.fasta}${newName}.fasta`)
      form.append('files', fileStream, `${newName}.fasta`)
    }

    form.append('correlationId', correlationId)
    const fastaResponse = await apiClient.post(secondaryOptions.url, form, { headers: { ...form.getHeaders(), ...secondaryOptions.headers } })
    // TODO: Error handling here (if success - clean up and update message on transaction, else error transaction and stop it from continuing)
    if (fastaResponse) {
      cleanupSharedFiles(toCleanUp, correlationId)
    }
  } catch (error) {
    logger.error(error)
  }

}

const cleanupSharedFiles = async (files, correlationId) => {
  try {
    for (const file of files) {
      await fasta.remove(file, correlationId)
    }
  } catch (error) {
    logger.error(error)
  }

}

const handleReceivedFiles = async (req, res) => {
  try {
    const params = { ...req.body || {} }
    const files = req.files || []
    const target = req.get('Target-Node')
    const source = req.get('Source-Node')
    const headerIds = { target, source }

    logger.info(`CORR ${params.correlationId}: Storing and recording shared fasta files`)

    // Add record of the file into the database
    for (const file of files) {
      // TODO: Not the most robust way of getting the transient id (sentName)
      const sentName = file.filename.split('Z_')[1]
      const transientId = sentName.split('.')[0]
      await fasta.store(transientId, file.filename, params.correlationId, source)
    }

    res.send(req.files)
  } catch (error) {
    logger.error(error)
  }
}

module.exports = {
  prepFiles,
  prepAndShareFiles,
  handleReceivedFiles,
  cleanupSharedFiles
}
