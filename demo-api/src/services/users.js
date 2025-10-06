const db = require('../controllers/db')
const helper = require('../helper')
// const config = require('../config')

async function getAllUsers () {
  const rows = await db.query(
    'SELECT * FROM users'
  )
  const data = helper.emptyOrRows(rows)
  // Do whatever
  return {
    data
  }
}

async function getUser (id) {
  const rows = await db.query(
    `SELECT * FROM users WHERE id=${id}`
  )
  const data = helper.emptyOrRows(rows)

  return {
    data
  }
}

async function create (user) {
  const result = await db.query(
`INSERT INTO users 
(name, age) 
VALUES 
('${user.name}', ${user.age})`
  )

  let message = 'Error in creating user'

  if (result.affectedRows) {
    message = 'User created successfully!!!!!'
  }

  return { message }
}

async function update (id, user) {
  const result = await db.query(
`UPDATE users 
    SET name="${user.name}", age=${user.age}
    WHERE id=${id}`
  )

  let message = 'Error in updating user'

  if (result.affectedRows) {
    message = 'User updated successfully'
  }

  return { message }
}

async function remove (id, user) {
  const result = await db.query(
`DELETE FROM users WHERE id=${id}`
  )

  let message = 'Error in deleting user'

  if (result.affectedRows) {
    message = 'User deleted successfully'
  }

  return { message }
}

module.exports = {
  getAllUsers,
  getUser,
  create,
  update,
  remove
}
