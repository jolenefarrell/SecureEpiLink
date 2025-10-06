const request = require('supertest')
const app = require('../../src/app')

describe('GET /', () => {
  it('should respond with "Welcome to this API service!"', async () => {
    const response = await request(app).get('/')
    expect(response.statusCode).toBe(200)
    expect(response.text).toBe('Welcome to this API service!')
  })
})
