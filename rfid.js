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

// Firebase Admin SDK initialization with inline config
const serviceAccount = {
  type: "service_account",
  project_id: "rfid-937d8",
  private_key_id: "83f12f73081fd7bdfab79c016331c8d30a1d38e1",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCo1qElQWAYbFnP\nGLTTmOMbVYraWfBj5h2DTGnLN+2FflX560GFVFux7P0SbDI3pdIYf1q1UiwUau6m\nCBL8+E5sjWau/elOKwEbYPbNvbl5OY5ep+7JnVDW5Bb5SBZkBJhvqSXwGedQcDmN\nVD25lvvkkYtesNWDNJ7PE0IYEDAVhGXGsh7qlns35KjxYisdR4Utr9MD0whSRKl5\nqQvslRXWWo0SSMJpvNP21k4BE3X3pAtKaj1tq1VQXUd8qisJUF9OUaG9b3UzwLEM\nuirQj1zulbesz9hyQEnaWBeAwoWPq4KXghd0VeqCi3kF5KEaHrgF+UxwfD4iuJsl\nqzmU5adzAgMBAAECggEAGccbN2rx1wjD9YCaKyxOkF/RIWFV+Iqrut4x0NsrIpSV\nX+DxUf/9N/8s7GEkkaZ5m0/mc4SmQj/JTAQzkff/UUeNg+40bsDWHG4DgIoVBVMq\nT31oUdP5AbY1Y74D3SVueK3kovHxhTB9OPzBp9JLhyxJkR2Cm9Ou44LXNoFSNhaP\nBPPcDzpuEmiU23sXUxDx4pLyUyPIXM9wHINs5q8GdUXeEvGrINgsIldcgTz7CbLn\nRFW3hUtFSlbW0tNBR/WBRvAdnlX4ljO0cTk/Rb6/Q3AAMPoCrKvLgeQ0qinT0p9n\nw42Nu7sqhT0iaj0UHLuVtEJm4aGsJSP4hUKuA5IqEQKBgQDkyZcYL16xsNqzqZkY\nuXwqlNT3C7jyDP3G5f81p1EmWC496dymRoiNZdxTpwQswbyBEE1PGbvvfqAX81ET\nqV0//pA1D94Ns+shEZpn1XN5MzZ3ZLMxNolGPujNK2MDRn+35cnVQ/qQx0AHbrDx\npYf2OLl4kvgBt0F1dxS+kBMC9wKBgQC866Jk9RPveUH0xGJNo8zdWNIjMdFwd4e+\ngPKDKzjajpcQqNAKrPhHuuWkXz2wgQXBnJa3tFFfOnqv4LEmpLN8vEAAzTN8KtWl\n9cJdb4TCxjAIBYkXBU9XLLYyYHbXrQWpJ2AcszmShOka7QaYo4TWK8622fjBFLsB\noJZ/xWtkZQKBgQC22KoJ6SncB0Tym5PAn9UtTt9ZRaQcxuc3Q++QWNVRON5UGwh+\nVxahMwxAStXaU0etOnMeyalaga+/FHXyqcPd9jwYPEMyXl2Hg0MMwxnTfmuERhW0\nOirB2ltCRe+O2ZQPS/XfnMGvXZ69keiWZ73euXz5cTQGYwhMscwBdLHNBwKBgEtB\nKe1BWvGXwdg4qlf3GdJKYVq3q5A7bQ1L3E631uvoxPBT7ptyD2yzXGq/rZkzrBFV\nyQvgflGKv/hzbt3P2dekPXKUSx/5CCYV4ZjKpX3Y6KUpX1SWPuag3uruVijPuWOK\nVdTY5+QfoaOiK3B+IpoV1UAtT9PJ6Dxbtder0n2pAoGAU4KHLeD2xgyUA9+SkM2t\n8n0k1DqPrOVk8cvwViaJ3S0zaGESwr8l1ZROUtgZaj/Gi4vTmwd4XTxacABCMhm2\nP4yw2laoBjVSJBDdvwQBeOXU/KTWLHdPTQwx2+dxJmjV7DhtsMTxPrevKnlCbCGj\nNGDD0PXZ1+Q0rdxFbcwdZFg=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@rfid-937d8.iam.gserviceaccount.com",
  client_id: "106645196938329597057",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40rfid-937d8.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

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

// Start the server
app.listen(PORT, () => {
  console.log(`💻 Server running on port ${PORT}`);
});
