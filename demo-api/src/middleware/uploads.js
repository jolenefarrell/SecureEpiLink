const multer = require('multer')
const config = require('../config')
const { logger } = require('./logger')


const fastaStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `/user/code${config.fileStorage.fasta}`)
  },
  filename: function (req, file, cb) {
    // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    // cb(null, uniqueSuffix + '-' + file.originalname)
    const date = Date.now()
    const iso = new Date(date).toISOString()
    const client = req.get('x-client-id')
    cb(null, client + '_' + iso + '_' + file.originalname)
  }
})

const recordStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `/user/code${config.fileStorage.records}`)
  },
  filename: function (req, file, cb) {
    const date = Date.now()
    const iso = new Date(date).toISOString()
    const client = req.get('x-client-id')
    cb(null, client + '_' + iso + '_' + file.originalname)
    // cb(null, file.originalname)
  }
})

const csvFilter = (_req, file, cb) => {
  logger.info(`Reading file in middleware: ${file.originalname} (${file.mimetype})`);
  if (file == undefined) {
    cb({ message: 'Please upload a file to proceed.' }, false);
  } else if (file.mimetype.includes('csv')) {
    cb(null, true);
  } else if (!file.mimetype.includes('csv')) {
    cb({ message: 'Please upload only csv file as only CSV is supported for now.' }, false);
  } else {
    logger.debug('Uploaded file:')
    logger.debug(file)
    cb({ message: 'Error uploading file.' }, false);
  }
};

const fastaFilter = (_req, file, cb) => {
  logger.info(`Reading file in middleware: ${file.originalname}`);
  if (file == undefined) {
    cb({ message: 'Please upload a file to proceed.' }, false);
  } else if (file.originalname.endsWith('fasta')) {
    cb(null, true);
  } else {
    cb({ message: 'Please upload only fasta files.' }, false);
  }
};

const uploadFasta = multer({
  storage: fastaStorage,
  fileFilter: fastaFilter,
  limits: { fileSize: 1000000 }
})

const uploadRecords = multer({
  storage: recordStorage,
  fileFilter: csvFilter,
  limits: { fileSize: 1000000 }
})

module.exports = {
  uploadFasta,
  uploadRecords
}