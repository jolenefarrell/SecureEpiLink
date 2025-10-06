const express = require('express')
const router = express.Router()
const idController = require('../controllers/id.controller');
const { logger } = require('../middleware/logger');

router.post('/unlinked', idController.getHashedIdsResponse)

module.exports = router


