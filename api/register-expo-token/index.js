const { connectToDatabase } = require("../mongo/db.js")

module.exports = async (req, res) => {
  try {
    const db = await connectToDatabase(process.env.MONGODB_URI)
    const collectionToken = db.collection("expotoken")
    const { userExpoToken, deviceName } = req.body
    console.log("userExpoToken", userExpoToken)
    console.log("deviceName", deviceName)

    const isTokenRegistered = await collectionToken.findOne({
      token: userExpoToken,
    })
    if (!isTokenRegistered) {
      await collectionToken.insertOne({
        token: req.body.userExpoToken,
        deviceName,
        date: Date.now(),
      })
    } else {
      console.log("userExpoToken already exist")
    }

    // Respond with a JSON string of all users in the collection
    res.status(200).send("Token registered")
  } catch (e) {
    console.error("error", e)
    res.status(500).send("error connecting to mongo", e)
  }
}
