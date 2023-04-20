const MongoClient = require("mongodb").MongoClient;
const url =
  "mongodb+srv://sushmanaallaofc:tEB82m12W2PPonnp@cluster0.ei3qq09.mongodb.net/?retryWrites=true&w=majority";
MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
  if (err) {
    console.log(err, "error");
  } else {
    console.log("connected!");

    //db name
    const dbName = "badbank";
    const db = client.db(dbName);

    //new user
    let name = "user" + Math.floor(Math.random() * 1000);
    let email = name + "@mit.edu";
    let accountType = "";
    let balance = 0;
    const user = {
      name: name,
      email: email,
      accounttype: accountType,
      accountnumber: 12345678,
      balance: balance
    };

    //insert into customer collection
    const collection = db.collection("customers");
    const doc = { user };
    collection.insertOne(doc, { w: 1 }, (err, result) => {
      console.log("Document insert");
    });

    const customers = db
      .collection("customers")
      .find()
      .toArray((err, docs) => {
        console.log("Collection:", docs);
        client.close();
      });
  }
});
