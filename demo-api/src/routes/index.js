const express = require('express')
// const userRouter = require('./users')
const transactionRouter = require('./transaction')
const saltRouter = require('./salt')
const identifierRouter = require('./identifiers')
const recordRouter = require('./records')
const testRouter = require('./testing')
const fastaRouter = require('./fasta')
const config = require('../config');
const { NodeType } = require('../enum/nodes')

const router = express.Router()
const nodeType = config.node.type

router.use('/transaction', transactionRouter)

if (nodeType == NodeType.phu) { // PHU only APIs
  router.use('/salt', saltRouter)                     
  router.use('/identifiers', identifierRouter)        
  router.use('/records', recordRouter)                
  router.use('/fasta', fastaRouter)                   

} else if (nodeType == NodeType.lab) { // LAB only APIs
  // router.use('/transaction', transactionRouter)
}

/**
 * @swagger
 * tags:
 *   - name: Testing
 *     description: Endpoints for testing and demo operations
 */
router.use('/testing', testRouter) // Testing APIs conditioning exposed within testRouter                  
// router.use('/users', userRouter)





module.exports = router
