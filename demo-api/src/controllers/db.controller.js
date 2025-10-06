const mysql = require('mysql2/promise')
const pLimit = require('p-limit')
const config = require('../config')

const pool = mysql.createPool(config.db)

async function bulkQuery (query, paramsArray) {
  const results = []
  const limit = pLimit(3)

  const promises = paramsArray.map(async param => {
    // eslint-disable-next-line no-async-promise-executor
    return limit(() => new Promise(async (resolve, reject) => {
      const connection = await pool.getConnection()
      const result = await connection.execute(query, param)
      // Release connection
      pool.releaseConnection(connection)
      connection.release()
      results.push(result)
      resolve(query)
    }))
  })

  await Promise.all(promises)

  return results
}

async function query (sql, params) {
  const connection = await pool.getConnection()
  const [results] = await connection.execute(sql, params)
  // Release connection
  pool.releaseConnection(connection)
  connection.release()

  return results
}

module.exports = {
  query,
  bulkQuery
}
