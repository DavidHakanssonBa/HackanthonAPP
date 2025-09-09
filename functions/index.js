/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// functions/index.js
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const twilio = require("twilio");
require("dotenv").config({ path: ".env.local" }); // ⬅️ bara lokalt

const accountSid = process.env.TWILIO_ACCOUNT_SID || "AC_test_sid";
const authToken  = process.env.TWILIO_AUTH_TOKEN  || "test_token";
const messagingServiceSid = process.env.TWILIO_MSG_SERVICE || "MG_test";

exports.sendSms = onCall({ region: "europe-west1" }, async (req) => {
  if (!req.data?.to || !req.data?.body) {
    throw new HttpsError("invalid-argument", "to and body required");
  }
  const client = twilio(accountSid, authToken);
  const msg = await client.messages.create({
    to: req.data.to,
    body: req.data.body,
    messagingServiceSid,
  });
  return { sid: msg.sid, status: msg.status };
});
