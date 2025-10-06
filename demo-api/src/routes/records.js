const express = require('express')
const router = express.Router()
const uploads = require('../middleware/uploads')

const linkageController = require('../controllers/linkage.controller')

router.post('/linked', uploads.uploadFasta.array("files"), linkageController.receiveLinkedRecords)

router.post('/linked/verified', linkageController.getVerifiedRecordsResponse)

module.exports = router
