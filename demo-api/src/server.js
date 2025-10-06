// server.js: Responsible for creating the server, listening for incoming requests and handling errors
// - Creates a new HTTP server instance
// - Passes the new instance to the app module

var fs = require("fs");
var https = require("https");
var http = require("http");

const app = require('./app')
const { logger } = require('./middleware/logger')

const PORT = process.env.SERVER_PORT || 3000

// app.listen(PORT, () => {
//   logger.info(`Server started and running on port ${PORT}`)
// })

http.createServer(app)
  .listen(PORT, () => {
    console.log(`Demo app listening on port ${PORT}`);
  });

// https
//   .createServer(
//     {
//       key: fs.readFileSync("cert/server.key"),
//       cert: fs.readFileSync("cert/server.cert"),
//     },
//     app
//   )
//   .listen(PORT, () => {
//     console.log(`Demo app listening on port ${PORT}`);
//   });
