require("dotenv").config()
const { connectToDatabase } = require("../mongo/db.js")

let db
let collectionToken

const init = async () => {
  db = await connectToDatabase(process.env.MONGODB_URI)
  collectionToken = db.collection("expotoken")
}

module.exports = async (req, res) => {
  
  try {
    if (req.headers.cypress == process.env.secret) {
      await init()
      res.send('HOT')
    } else {
      res.send(403)
    }
  } catch (e) {
    
    // const { status, statusText } = e.response
    res.status(400).send(`error: ${e}`)
  }
}
