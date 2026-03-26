const express = require('express')
const router = express.Router()
const https = require('https')
const config = require('../config');
const salt = require('../services/salt')
const notification = require('../services/notification')
const identifiers = require('../services/identifiers')
const sequence = require('../services/sequence')
const network = require('../services/network')
const testing = require('../services/testing')
const initiationController = require('../controllers/initiation.controller')
const uploadController = require('../controllers/upload.controller')
const { spawnSync } = require('child_process')
const uploads = require('../middleware/uploads');
const { NodeType } = require('../enum/nodes');
const cleanlab = '../../../automation/clean_lab_node.sql'
const cleanphu = '../../../automation/clean_phu_node.sql'


// const uploadController = async(req, res)=>{
//   res.send(req.file)
// }
// router.post("/upload/single", upload.single("file"), uploadController)

/**
 * @swagger
 * /upload/single:
 *   post:
 *     summary: Upload a single FASTA file
 *     description: Upload a single FASTA file for processing and storage.
 *     tags:
 *       - Testing
 */
router.post("/upload/single", uploads.uploadFasta.single("file"), (req, res) => {
  return res.send(req.file)
})

/**
 * @swagger
 * /upload/multi:
 *   post:
 *     summary: Upload multiple FASTA files
 *     description: Upload multiple FASTA files (up to 10) for batch processing and storage.
 *     tags:
 *       - Testing
 */
router.post("/upload/multi", uploads.uploadFasta.array("file", 10), (req, res) => {
  return res.send(req.files)
})

/**
 * @swagger
 * /reset:
 *   post:
 *     summary: Reset demo database
 *     description: Reset the demo database to its initial state, clearing all test data on the current node.
 *     tags:
 *       - Testing
 */
router.post("/reset", async function (req, res, next) {
  try {
    const lab = await db.query(cleanlab)
    const phu = await db.query(cleanphu)
  } catch (err) {
    next(err)
  }
})

// TEMP FOR REMOTE/LOCAL TESTING - temporary conditional based on node type
const nodeType = config.node.type

if (nodeType == NodeType.phu) {
  router.post('/records/upload/notification', uploads.uploadRecords.single("file"), uploadController.uploadRecords)
  router.get('/records/getLinked', testing.getLinkedRecords)
  router.get('/transaction/getSummary', testing.getLinkageSummary)

} else if (nodeType == NodeType.lab) {
  router.post('/records/upload/sequence', uploads.uploadRecords.single("file"), uploadController.uploadRecords)
  router.post('/fasta/upload', uploads.uploadFasta.array("files"), uploadController.uploadFasta)
  router.post('/transaction/initiate', initiationController.initiateTransaction)
}

/**
 * @swagger
 * /serviceCheck:
 *   get:
 *     summary: Service health check
 *     description: Check the health and availability of the service.
 *     tags:
 *       - Testing
 */
router.get('/serviceCheck', testing.serviceCheck)
/**
 * @swagger
 * /config/getAll:
 *   get:
 *     summary: Get all config
 *     description: Retrieve all configuration settings for the current node.
 *     tags:
 *       - Testing
 */
router.get('/config/getAll', testing.getConfig)
/**
 * @swagger
 * /records/getAll:
 *   get:
 *     summary: Get all records
 *     description: Retrieve all records stored on the current node.
 *     tags:
 *       - Testing
 */
router.get('/records/getAll', testing.getAllRecords)
/**
 * @swagger
 * /records/getById:
 *   get:
 *     summary: Get records by ID
 *     description: Retrieve records by their unique identifier on the current node.
 *     tags:
 *       - Testing
 */
router.get('/records/getById', testing.getAllRecordsById)
/**
 * @swagger
 * /records/getAllFiles:
 *   get:
 *     summary: Get all sequence files
 *     description: Retrieve all sequence files available on the current node.
 *     tags:
 *       - Testing
 */
router.get('/records/getAllFiles', testing.getSequenceFiles)
/**
 * @swagger
 * /records/getFilesById:
 *   get:
 *     summary: Get sequence files by ID
 *     description: Retrieve sequence files by their unique identifier on the current node.
 *     tags:
 *       - Testing
 */
router.get('/records/getFilesById', testing.getSequenceFilesById)
/**
 * @swagger
 * /transaction/getTransaction:
 *   get:
 *     summary: Get transaction details
 *     description: Retrieve details for a specific transaction on the current node.
 *     tags:
 *       - Testing
 */
router.get('/transaction/getTransaction', testing.getTransaction)

module.exports = router
