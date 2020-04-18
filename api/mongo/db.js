require('dotenv').config()
const url = require('url')
const MongoClient = require('mongodb').MongoClient

console.log('MONGODB_URI', process.env.MONGODB_URI);

// Create cached connection variable
let db = null

// A function for connecting to MongoDB,
// taking a single paramater of the connection string
async function connectToDatabase(uri) {
    // If no connection is cached, create a new one
    const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })

    // Select the database through the connection,
    // using the database path of the connection string
    // console.log('url.parse(uri).pathname.substr(1)', url.parse(uri).pathname.substr(1));
    const dbName = url.parse(uri).pathname.substr(1)
    const db = await client.db()

    // Get a database connection, cached or otherwise,
    // using the connection string environment variable as the argument
    // await connectToDatabase(uri)
    console.log('connected to', dbName);
    return db
}

module.exports = { connectToDatabase }
