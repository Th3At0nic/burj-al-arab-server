const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const port = 5000;
const admin = require("firebase-admin");
const MongoClient = require("mongodb").MongoClient;
require("dotenv").config();
console.log(process.env.DB_PASS);

const app = express();

app.use(cors());
app.use(bodyParser.json());

const serviceAccount = require("./configs/burj-al-arab-th3at0nic-firebase-adminsdk-wmtd2-a67a6d54f4.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hz5rx.mongodb.net/burjalarab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const bookings = client.db("burjalarab").collection("bookings");
  // console.log("db connected successfully");
  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
      console.log(result);
    });
    console.log(newBooking);
  });

  app.get("/bookings", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      console.log({ idToken });
      // idToken comes from the client app
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          let tokenEmail = decodedToken.email;
          if (tokenEmail == req.query.email) {
            bookings
              .find({ email: req.query.email })
              .toArray((err, documents) => {
                res.send(documents);
              });
          } else {
            res.status(401).send("un-authorized access");
          }
          console.log({ uid });
          // ...
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      res.status(401).send("un-authorized access");
    }
  });
});

app.listen(port, () => {
  console.log("listening at port 5000");
});
