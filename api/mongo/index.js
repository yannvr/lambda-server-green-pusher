const { connectToDatabase } = require('./db.js')

module.exports = async (req, res) => {
    try {
        const db = await connectToDatabase(process.env.MONGODB_URI)
        console.log('0');

        // Select the "users" collection from the database
        const collection = await db.collection('expotoken')
        console.log('1');

        // Select the users collection from the database
        const tokens = await collection.find({}).toArray()
        console.log('2');

        // Respond with a JSON string of all users in the collection
        res.status(200).json({ tokens })
    } catch(e) {
        console.error('error', e)
        res.status(500).send('error connecting to mongo', e)
    }
}
