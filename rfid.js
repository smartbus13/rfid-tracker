// Import required libraries
const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const bodyParser = require("body-parser");

// Initialize Express app
const app = express();
const PORT = 5300;

// Middleware for handling CORS and JSON body parsing
app.use(cors());
app.use(bodyParser.json());

// Firebase Admin SDK initialization
const serviceAccount = require("./firebaseConfig.json"); // Your Firebase service account key
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const collectionRef = db.collection("RFIDTags"); // Single collection for all data

// Startup Log
console.log("🚀 Server is starting...");

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`📡 Received ${req.method} request to ${req.url}`);
  next();
});

// ✅ API Route: Store RFID Data
app.post("/rfid", async (req, res) => {
  try {
    console.log("📩 Incoming RFID data:", req.body);

    const { tagID } = req.body;
    if (!tagID) {
      console.warn("⚠️ RFID tag is missing in the request.");
      return res.status(400).json({ success: false, message: "RFID tag is required" });
    }

    const docRef = collectionRef.doc(tagID); // Document per tagID
    const doc = await docRef.get();

    const now = new Date();
    const date = now.toISOString().split("T")[0]; // YYYY-MM-DD format
    const timestamp = admin.firestore.Timestamp.now();

    let newStatus = "LOGGED IN";
    let timeIn = timestamp;
    let timeOut = null;

    if (doc.exists) {
      const currentData = doc.data();
      console.log(`🔄 Updating existing tag: ${tagID}, Previous status: ${currentData.status}`);

      newStatus = currentData.status === "LOGGED IN" ? "LOGGED OUT" : "LOGGED IN";

      if (newStatus === "LOGGED IN") {
        timeIn = timestamp;
      } else {
        timeOut = timestamp;
      }

      // Append to the status history (log entries)
      const logEntry = {
        date,
        timeIn: newStatus === "LOGGED IN" ? timestamp : null,
        timeOut: newStatus === "LOGGED OUT" ? timestamp : null,
        status: newStatus,
      };

      // Append the log entry without overwriting the existing document
      await docRef.update({
        status: newStatus, // Latest status
        history: admin.firestore.FieldValue.arrayUnion(logEntry), // Append to the history array
      });
    } else {
      console.log(`🆕 New RFID tag detected: ${tagID}. Creating entry...`);

      // If new tag, initialize the history with the first log entry
      await docRef.set({
        tagID,
        status: "LOGGED IN",
        history: [
          {
            date,
            timeIn: timestamp,
            timeOut: null,
            status: "LOGGED IN",
          },
        ],
      });
    }

    console.log(`✅ RFID tag ${tagID} updated to ${newStatus}`);
    res.status(200).json({ success: true, message: `RFID Data Updated: ${newStatus}`, tagID });
  } catch (error) {
    console.error("❌ Error processing RFID data:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ API Route: Get RFID Data (Latest status and history)
app.get("/rfid", async (req, res) => {
  try {
    console.log("📩 Fetching RFID data...");

    const snapshot = await collectionRef.get();
    const rfidData = [];

    snapshot.forEach((doc) => {
      const data = doc.data();

      // Convert Firestore timestamps to readable format for the status history
      const formattedHistory = data.history.map(entry => ({
        date: entry.date,
        timeIn: entry.timeIn ? entry.timeIn.toDate().toLocaleTimeString() : null,
        timeOut: entry.timeOut ? entry.timeOut.toDate().toLocaleTimeString() : null,
        status: entry.status,
      }));

      rfidData.push({
        tagID: data.tagID,
        status: data.status, // Latest status
        history: formattedHistory, // Full history
      });
    });

    if (rfidData.length === 0) {
      console.log("⚠️ No RFID data found.");
      return res.status(404).json({ success: false, message: "No RFID data found" });
    }

    console.log(`✅ Retrieved ${rfidData.length} RFID records.`);
    res.status(200).json({ success: true, data: rfidData });
  } catch (error) {
    console.error("❌ Error fetching RFID data:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
