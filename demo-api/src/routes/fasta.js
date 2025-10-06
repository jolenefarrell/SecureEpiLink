const express = require('express')
const router = express.Router()
const fastaController = require('../controllers/fasta.controller')
const uploads = require('../middleware/uploads')
const uploadController = require('../controllers/upload.controller')

router.post("/upload", uploads.uploadFasta.array("files"), fastaController.handleReceivedFiles)


module.exports = router

