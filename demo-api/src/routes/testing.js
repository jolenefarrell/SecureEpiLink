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

router.post("/upload/single", uploads.uploadFasta.single("file"), (req, res) => {
  return res.send(req.file)
})

router.post("/upload/multi", uploads.uploadFasta.array("file", 10), (req, res) => {
  return res.send(req.files)
})

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

router.get('/serviceCheck', testing.serviceCheck)
router.get('/config/getAll', testing.getConfig)
router.get('/records/getAll', testing.getAllRecords)
router.get('/records/getById', testing.getAllRecordsById)
router.get('/records/getAllFiles', testing.getSequenceFiles)
router.get('/records/getFilesById', testing.getSequenceFilesById)
router.get('/transaction/getTransaction', testing.getTransaction)

module.exports = router
