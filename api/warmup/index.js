require("dotenv").config()
const { connectToDatabase } = require("../mongo/db.js")
const logdna  = require("@logdna/logger")

const options = {
  app: "GreenLife",
  level: 'debug', // set a default for when level is not provided in function calls
}

const logger = logdna.createLogger("fa8e7820260fe31bce4bca47e1add5f6", options)

let db
let collectionToken

const init = async () => {
  db = await connectToDatabase(process.env.MONGODB_URI)
  collectionToken = db.collection("expotoken")
}

module.exports = async (req, res) => {
  logger.info(`Warm up lambda (no message)`)
  try {
    if (req.headers.cypress == process.env.secret) {
      await init()
      res.send('HOT')
    } else {
      res.send(403)
    }
  } catch (e) {
    logger.error(`PUSH INIT ERROR:  ${e}`)
    // const { status, statusText } = e.response
    res.status(400).send(`error: ${e}`)
  }
}
