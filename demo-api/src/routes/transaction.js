const express = require('express')
const router = express.Router()
const transaction = require('../services/transaction')
const initiationController = require('../controllers/initiation.controller')
const transactionController = require('../controllers/transaction.controller')

router.get('/', async function (req, res, next) {
  try {
    res.json(await transaction.getAll())
  } catch (err) {
    next(err)
  }
})

router.post('/initiate', initiationController.initiateTransaction)

router.post('/terminate', transactionController.handlePartnerTermination)

module.exports = router
