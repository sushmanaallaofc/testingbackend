const { MongoClient, ServerApiVersion } = require("mongodb");
const uri =
  "mongodb+srv://sushmanaallaofc:tEB82m12W2PPonnp@cluster0.ei3qq09.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1
});
let db = null;
client.connect(err => {
  db = client.db("badbank");
  //console.log("Connected successfully to db server!");
});

//create a account
const create = (name, email, password) => {
  return new Promise((resolve, reject) => {
    const collection = db.collection("accounts");
    const doc = { name, email, password, type: "Checking", balance: 0 };
    collection.insertOne(doc, { w: 1 }, (err, result) => {
      err ? reject(err) : resolve(doc);
    });
  });
};

//return all accounts
const all = () => {
  return new Promise((resolve, reject) => {
    const customers = db
      .collection("accounts")
      .find({})
      .toArray((err, docs) => {
        err ? reject(err) : resolve(docs);
      });
  });
};

// find a users accounts
const find = email => {
  return new Promise((resolve, reject) => {
    const customers = db
      .collection("accounts")
      .find({ email: email })
      .toArray(function(err, docs) {
        err ? reject(err) : resolve(docs);
      });
  });
};

// find a single user account
const findOne = email => {
  return new Promise((resolve, reject) => {
    const customers = db
      .collection("accounts")
      .findOne({ email: email })
      .then(doc => resolve(doc))
      .catch(err => reject(err));
  });
};

// update deposit and withdraw amounts
const update = (email, amount) => {
  return new Promise((resolve, reject) => {
    const customers = db
      .collection("accounts")
      .findOneAndUpdate(
        { email: email },
        { $inc: { balance: amount } },
        { returnOriginal: false },
        function(err, documents) {
          err ? reject(err) : resolve(documents);
        }
      );
  });
};

module.exports = { create, all, find, findOne, update };
