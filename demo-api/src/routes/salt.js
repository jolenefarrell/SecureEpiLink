const express = require('express')
const router = express.Router()
const salt = require('../services/salt')
const proposalController = require('../controllers/proposal.controller')

router.get('/', async function (req, res, next) {
  try {
    res.json(await salt.getAll())
  } catch (err) {
    next(err)
  }
})

router.post('/proposal', proposalController.receiveSalt)

module.exports = router
