const removeBOM = require("remove-bom-stream")
const fs = require('fs')
const csv = require("csv-parser")
const { logger } = require("../middleware/logger")
const upload = require('../middleware/uploads')
const validation = require('../services/validation')
const recordService = require('../services/record')
const fasta = require('../services/fasta')
const record = require('../services/record')
const config = require('../config')
const { invalid } = require("moment")

function streamAsPromise(fileStream) {
  const csvData = []
  return new Promise((resolve, reject) => {
      fileStream.pipe(removeBOM('utf-8'))
      .pipe(csv())
      .on('data', (data) => csvData.push(data))
      .on('end', () => {
        resolve(csvData)
      });
  });
}

const uploadRecords = async (req, res) => {
  let csvData = null
  let message = null
  let recordResult = []

  try {
    if (req.file == undefined) {
      message = "No CSV file attached"
      return res.badRequest({ message })
    }
    logger.info(`${req.file.filename}: Reading CSV records`)
    
    // TODO: Optimise below for big files
    const filepath = req.file.path
    const fileStream = fs.createReadStream(filepath,  { encoding: null }) 
    csvData = await streamAsPromise(fileStream)


    await Promise.all(csvData.map(async (record, idx) => {
      let isMinimalValid = null
      let isMetadataValid = null
      let isValid = null
      let message = null
      let addRecord = null

      // 1. Check minimal fields are present (internal_id, pathogen, record_type) and valid
      isMinimalValid = await validation.checkMinimal(record)
      
      // If minimal is valid, continue
      if (isMinimalValid.isValid) {
        // 2. Return bad request if duplicate record identifiers are present
        let duplicates = [];
        //
        for (let i = 0; i < csvData.length; i++) {
            for (let j = i + 1; j < csvData.length; j++) {
                if (csvData[i].internal_id === csvData[j].internal_id) {
                    if (!duplicates.includes(csvData[i].internal_id)) {
                        duplicates.push(csvData[i].internal_id);
                    }
                }
            }
        }
        if (duplicates.length !== 0) {
          message = "Please ensure there are no duplicate record identifiers within the uploaded file"
          return res.badRequest({ message, data: { duplicates } })
        }

        // 3. Check if metadata values are valid
        isMetadataValid = await validation.checkMetadata(record)
      }
      
      if (isMinimalValid.isValid && isMetadataValid.isValid) {

        // 3. Add records that have passed to the database
        addRecord = await recordService.add(record)
        if (addRecord.isValid) {
          isValid = true
          message = 'Record validated and added to the database'
        } else {
          isValid = false
          message = addRecord.message || "Please check all columns and data types against provided template"
        }

      } else {
        isValid = false
        message = isMinimalValid.message || isMetadataValid.message || "Please check all columns and data types against provided template"
      }

      // 5. Report back to the user what rows have passed/failed
      recordResult.push({
        "row": idx + 1,
        "valid": isValid,
        "message": message,
        "record": record
      })
    }));

    // Order result by row index so it is easier to read
    recordResult.sort((firstItem, secondItem) => firstItem.row - secondItem.row)
    const successful = recordResult.filter((obj) => obj.valid == true).length
    const total = recordResult.length

    const invalidResult = recordResult.filter((obj) => obj.valid == false)

    const finalResult = {
      result: `${successful}/${total} records successfully uploaded`,
      invalidRecords: invalidResult
    }

    logger.info(`${req.file.filename}: Validation and upload complete`)
    logger.info(`${req.file.filename}: ${JSON.stringify(finalResult)}`)

    return res.success({ 
      message, 
      data: finalResult
    })
  } catch (error) {
    logger.error(error)
    return res.internalServerError({ error })
  }
}

const uploadFasta = async (req, res) => {
  try {
    let message = null
    const invalidResult = []

    // Check files are there (and format)
    if (req.files == undefined) {
      message = "No sequence files attached"
      return res.badRequest({ message })
    }
    const files = req.files
    const filenames = req.files.map(file => file.filename)
    const nodeId = config.node.id
    
    logger.info(`Reading fasta files: ${JSON.stringify(filenames)}`)
    
    // 2. a) Read file name and check if a corresponding internal_id is present in the database
    // 2. b) Make sure there ISN'T already an entry for that internal_id in SequenceFiles
    

    await Promise.all(files.map(async (file, idx) => {
      const identifier = file.originalname.split('.')[0]
      const filename = file.filename
  
      // Check if file in Records (as internal_id)
      const idCheck = await validation.checkSequenceIdentifier(identifier)

      // TODO: Allow multiple fasta files for a since ID but always take the latest for sharing purposes 
      // Check if file is not in SequenceFiles (as internal_id)
      const fileCheck = await validation.checkSequenceFiles(identifier)

      if (idCheck.isValid && fileCheck.isValid) {
        await fasta.store(identifier, filename, 'N/A', nodeId)
        await record.updateFile(identifier, 'true') // Mark that record has sequence file
        // TODO: Add logic to check success of db query
      } else {
        // Push to invalid list
        invalidResult.push({
          file: file.originalname,
          message: idCheck.message || fileCheck.message || "Error uploading this file, please contact your system administrator."
        })

        // Remove files from storage that are invalid (using filename)
        logger.info(`File validation failed: Deleting ${file.path}`)
        fs.unlinkSync(file.path)
      }
      message = `${filenames.length - invalidResult.length}/${filenames.length} sequence files successfully uploaded.`

    }))


    return res.success({
      data: {
        result: message,
        invalidFiles: invalidResult
      }
    })
  } catch (error) {
    logger.error(error)
    return res.internalServerError({ error })
  }
}

module.exports = {
  uploadRecords,
  uploadFasta
}