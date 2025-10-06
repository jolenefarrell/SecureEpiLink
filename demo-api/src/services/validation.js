const db = require('../controllers/db.controller')
const helper = require('../helper')
const { logger } = require('../middleware/logger')
const pathogen = require('./pathogen')
const fields = require("../services/fields")
const fasta = require("../services/fasta")
const sequence = require("../services/sequence")
const { NodeType } = require('../enum/nodes')
const config = require('../config')
//
const minimal = ["internal_id", "pathogen", "record_type"]
// 
async function checkMinimal(record) {
  // TODO: This can be more streamlined and not hard coded
  let isValid = null
  let message = ''
  
  try {
    let minimalExists = true
    let minimalValid = true

    // Get valid pathogens for current node
    const validPathogens = await pathogen.getAll()
    const pathogenList = validPathogens.data.map(pathogen => pathogen.abbreviation)

    // Check validity of each value
    minimal.forEach(column => {
      if (!record.hasOwnProperty(column)) {
        minimalExists = false
      }
    })
    // Check validity of all fields since they exist
    let record_type_message = null
    if (minimalExists == true) {
      const internal_id_valid = await helper.isString(record.internal_id)
      const record_type_valid = record.record_type == 'sequence' || record.record_type == 'notification'
      let record_type_node_valid = null
      const nodeType = config.node.type
      
      // Check the correct type of record is being added to the correct node
      if (record.record_type == 'sequence' && nodeType == NodeType.lab) {
        record_type_node_valid = true
      } else if (record.record_type == 'notification' && nodeType == NodeType.phu) {
        record_type_node_valid = true
      } else {
        record_type_node_valid = false
        record_type_message = `Upload of record type '${record.record_type}' invalid on node type: '${nodeType}'`
      }
      
      const pathogen_valid = pathogenList.includes(record.pathogen)

      if (!internal_id_valid || !record_type_valid || !pathogen_valid || !record_type_node_valid) {
        minimalValid = false
      }
    }

    if (minimalExists == false) {
      isValid = false
      message = "Not all minimal record fields are present (internal_id, pathogen & record_type)"
    } else if (minimalValid == false) {
      isValid = false
      message = record_type_message || "Not all minimal record fields are valid (internal_id, pathogen & record_type)"
    } else {
      isValid = true
    }

  } catch (error) {
    logger.error(`ERROR: Failed to check minimal record fields`)
    logger.error(error.message)
    message = error.message
    isValid = false
  }

  return { isValid, message }
}

async function checkMetadata(record) {
  let isValid = null
  let message = ''
  try {
    // 1. Based on pathogen retrieve valid metadata columns
    const cols = await fields.getMetadataColumnsByRecordType(record.record_type)
    const pathSpecificCols = cols.data.filter(col => col.pathogen == record.pathogen)

    // 2. Check if all "linkage fields" are present
    const linkage = pathSpecificCols.filter(col => col.linkage_field == 'true')
    const linkageCols = linkage.map(a => a.column_name)
    const linkageCheck = linkageCols.every(key => record.hasOwnProperty(key))
    if (!linkageCheck) {
      message = `Please ensure all linkage fields are present (${linkageCols})`
      isValid = false
    } else {
      // Check all cols present validity
      for await (const [key, value] of Object.entries(record)) {
        if (!minimal.includes(key)) {     // Don't check minimal as we already validate them earlier
          // Make sure column is in fact in list 
          // console.log(pathSpecificCols)
          if (pathSpecificCols.map(a => a.column_name).includes(key)) {
            const column = pathSpecificCols.find((element) => element.column_name == key)

            // TODO: This needs to be more dynamic somehow
            if (column.data_type == "string") {
              isValid = await helper.isString(value)
              message = isValid ? '' : `${key} needs to be of data type: ${column.data_type}`
            } else if (column.data_type == "date") {
              isValid = await helper.isDate(value)
              message = isValid ? '' : `${key} needs to be of data type: ${column.data_type} (DD/MM/YYYY)`
            } else if (column.data_type == "number") {
              isValid = await helper.isInteger(value)
              message = isValid ? '' : `${key} needs to be of data type: ${column.data_type}`
            } else if (column.data_type == "categorical") {
              isValid = await helper.isString(value)
              message = isValid ? '' : `${key} needs to be of data type: ${column.data_type}`
            } else {
              message = `Please check the data type of ${key} column`
              isValid = false
            }
          } else {
            message = `The platform is not configured with "${key}" as a column for this record type (${record.record_type})`
            isValid = false
          }
        }
        // If false is found return first error
        if (isValid == false) {
          return { isValid, message }
        }
      }
    }
  } catch (error) {
    logger.error(`ERROR: Failed to check metadata fields`)
    logger.error(error.message)
    message = error.message
    isValid = false
  }
  return { isValid, message }
}


async function checkSequenceIdentifier(identifier) {
  // Check if sequence file ID present in 'Records' table
  let isValid = null
  let message = ''
  try {
    const all = await sequence.getAll()
    const hasId = all.data.some(record => record['internal_id'] === identifier)
    
    isValid = hasId
    message = hasId ? '' : 'There is no sequence record uploaded for this file identifier'

  } catch (error) {
    logger.error(`ERROR: Failed to check sequence file identifier against database records`)
    logger.error(error.message)
    message = error.message
    isValid = false
  }

  return { isValid, message }
}

async function checkSequenceFiles(identifier) {
  // Make sure there isn't already a sequence file for the given record in SequenceFiles
  let isValid = null
  let message = ''
  try {
    const all = await fasta.getAllFileDetails()
    const hasId = all.data.some( record => record['internal_id'] === identifier)
    isValid = !hasId
    message = hasId ? 'There is already a sequence file uploaded for this record/sequence identifier' : ''

  } catch (error) {
    logger.error(`ERROR: Failed to check sequence file against database records`)
    logger.error(error.message)
    message = error.message
    isValid = false
  }

  return { isValid, message }
}


module.exports = {
  minimal,
  checkMinimal,
  checkMetadata,
  checkSequenceIdentifier,
  checkSequenceFiles
}