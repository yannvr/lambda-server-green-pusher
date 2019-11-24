require("dotenv").config()
const { Expo } = require("expo-server-sdk")
const { connectToDatabase } = require("../mongo/db.js")

const axios = require("axios")
// const APIgreenHabitPageLimit1OrderRandomFieldsSummary = "https://greenlife.cloud/api/v2/pages/?format=json&type=greenhabits.GreenHabitPage&limit=1&order=random&fields=summary,source,body"
const APIgreenHabitPageLimit1OrderRandomFieldsSummary = "https://greenlife.cloud/api/v2/pages/?format=json&type=greenhabits.GreenHabitPage&limit=1&order=random&fields=summary,source,links"


let db
let collectionToken

const init = async () => {
  db = await connectToDatabase(process.env.MONGODB_URI)
  collectionToken = db.collection("expotoken")
}

// Create a new Expo SDK client

let pushToMeOnly = false

const pushQuoteNotifications = async quote => {
  let expo = new Expo()
  let tokens

  console.log("push to me only..")
  if (pushToMeOnly) {
    console.info("no broadcast, target me only")
    tokens = [
      {
        token: "ExponentPushToken[IKpQ7PNo_7IugJN3BNZMru]", // Test
        deviceName: "Yann’s phone",
      },
      {
        token: "ExponentPushToken[4wPgRXAc1K1M0kyaZCkAz3]", // dev
        deviceName: "Yann’s phone",
      },
      {
        token: "ExponentPushToken[stYrctEOfIWPJar7faEdG0]", // dev
        deviceName: "Yann’s phone",
      },
      {
        token: "ExponentPushToken[wH3CEjM-VZeIVere5dPrk-]", // dev
        deviceName: "Yann’s phone",
      },
      {
        token: "ExponentPushToken[YV6f_WJUVsGZsNQFV7Uq0D]", // dev
        deviceName: "Yann’s phone",
      },
    ]
  } else {
    tokens = await collectionToken.find().toArray()
    console.info("new quote broadcast, target count:", tokens.length)
  }

  if (!tokens.length) {
    console.log("no recipients")
    return
  }

  // Create the messages that you want to send to clients
  let messages = []

  // for (let userTokens of tokens) {
  for (let userTokens of tokens) {
    const pushToken = userTokens.token

    console.log("GL pushToken target:", pushToken)

    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`)
      // await collectionToken.deleteOne({ token: expoToken })
      continue
    }

    // Construct a message (see https://docs.expo.io/versions/latest/guides/push-notifications.html)
    messages.push({
      to: pushToken,
      // On Kris explicit request
      sound: null,
      body: quote.summary,
      data: {
        quote,
      },
    })
  }

  // The Expo push notification service accepts batches of notifications so
  // that you don't need to send 1000 requests to send 1000 notifications. We
  // recommend you batch your notifications to reduce the number of requests
  // and to compress them (notifications with similar content will get
  // compressed).
  let chunks = expo.chunkPushNotifications(messages)
  let tickets = []
  ;(async () => {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (let chunk of chunks) {
      try {
        console.log("SEND PUSH NOTIF")
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk)
        console.log("TICKET", ticketChunk)
        console.log(ticketChunk)
        tickets.push(...ticketChunk)
        // NOTE: If a ticket contains an error code in ticket.details.error, you
        // must handle it appropriately. The error codes are listed in the Expo
        // documentation:
        // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
      } catch (error) {
        console.error(error)
      }
    }
  })()

  // Later, after the Expo push notification service has delivered the
  // notifications to Apple or Google (usually quickly, but allow the the service
  // up to 30 minutes when under load), a "receipt" for each notification is
  // created. The receipts will be available for at least a day; stale receipts
  // are deleted.
  //
  // The ID of each receipt is sent back in the response "ticket" for each
  // notification. In summary, sending a notification produces a ticket, which
  // contains a receipt ID you later use to get the receipt.
  //
  // The receipts may contain error codes to which you must respond. In
  // particular, Apple or Google may block apps that continue to send
  // notifications to devices that have blocked notifications or have uninstalled
  // your app. Expo does not control this policy and sends back the feedback from
  // Apple and Google so you can handle it appropriately.
  let receiptIds = []
  for (let ticket of tickets) {
    // NOTE: Not all tickets have IDs; for example, tickets for notifications
    // that could not be enqueued will have error information and no receipt ID.
    if (ticket.id) {
      receiptIds.push(ticket.id)
    }
  }

  let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds)
  ;(async () => {
    // Like sending notifications, there are different strategies you could use
    // to retrieve batches of receipts from the Expo service.
    for (let chunk of receiptIdChunks) {
      try {
        let receipts = await expo.getPushNotificationReceiptsAsync(chunk)
        console.log("receipts:", receipts)

        // The receipts specify whether Apple or Google successfully received the
        // notification and information about an error, if one occurred.
        for (let receipt of receipts) {
          if (receipt.status === "ok") {
            continue
          } else if (receipt.status === "error") {
            console.error(
              `There was an error sending a notification: ${receipt.message}`
            )
            if (receipt.details && receipt.details.error) {
              // Is the user expo token not matched? Then delete it
              if (receipt.details.error === "DeviceNotRegistered") {
                await collectionToken.deleteOne({ token: expoToken })
                console.log("Deleting unmatched token")
              }

              // The error codes are listed in the Expo documentation:
              // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
              // You must handle the errors appropriately.
              console.error(`The error code is ${receipt.details.error}`)
            }
          }
        }
      } catch (error) {
        console.error("Send push error", error)
        // await collectionToken.deleteOne({ token: expoToken })
        // console.log("Deleting unmatched token")
        console.error(error)
      }
    }
  })()
}

const pushQuote = () =>
  axios(APIgreenHabitPageLimit1OrderRandomFieldsSummary).then(
    async response => {
      const item = response.data.items[0]
      console.log("quote:", item)
      item.summary = item.summary || item.title
      await pushQuoteNotifications(item)
    }
  )

module.exports = async (req, res) => {
  pushToMeOnly = req.headers.meonly == 1
  if (req.headers.cypress == process.env.secret) {
    await init()
    await pushQuote()
    res.send(200)
  } else {
    res.send(403)
  }
}
