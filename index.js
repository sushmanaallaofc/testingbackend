const path = require("path");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dal = require("./dal.js");
const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 5050;

const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client(process.env.CLIENT_ID)
app.post("/api/v1/auth/google", async (req, res) => {
    const { token }  = req.body
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.CLIENT_ID
    });
    const { name, email, picture } = ticket.getPayload();    
    const user = await db.user.upsert({ 
      where: { email: email },
      update: { name, picture },
      create: { name, email, picture }
  })
req.session.userId = user.id
res.status(201)
res.json(user)
})
app.use(async (req, res, next) => {
  const user = await db.user.findFirst({where: { id:  req.session.userId }})
  req.user = user
  next()
})
app.delete("/api/v1/auth/logout", async (req, res) => {
  await req.session.destroy()
  res.status(200)
  res.json({
      message: "Logged out successfully"
  })
})
app.get("/me", async (req, res) => {
  res.status(200)
  res.json(req.user)
})
// create user account
app.get("/account/create/:name/:email/:password", function(req, res) {
  // check if account exists
  dal.find(req.params.email).then(accounts => {
    // if account exists, return error message
    if (accounts.length > 0) {
      res.send("Account already in exists");
    } else {
      // else create account
      const hash = bcrypt.hashSync(req.params.password, 10);
      dal.create(req.params.name, req.params.email, hash).then(account => {
        //console.log(account);
        res.send(account);
      });
    }
  });
});

// login user
app.get("/account/login/:email/:password", function(req, res) {
  dal.find(req.params.email).then(account => {
    // if account exists, check password and create token
    if (account.length > 0) {
      if (bcrypt.compareSync(req.params.password, account[0].password)) {
        const token = jwt.sign(
          {
            name: account[0].name,
            email: account[0].email,
            balance: account[0].balance,
            password: account[0].password
          },
          "topsecret"
        );
        res.send({ status: "ok", account: token });
      } else {
        res.send("Login failed: wrong password");
      }
    } else {
      res.send("Login failed: account not found");
    }
  });
});

// find user account using token
app.get("/account/find", function(req, res) {
  const token = req.headers["x-access-token"];
  try {
    const token_decoded = jwt.verify(token, "topsecret");
    const email = token_decoded.email;
    dal.find(email).then(account => {
      //console.log(account);
      res.send(account);
    });
  } catch (error) {
    //console.log(error);
    res.json({ status: "error", error: "invalid token" });
  }
});

// find one account by email - alternative to find
app.get("/account/findOne", function(req, res) {
  const token = req.headers["x-access-token"];
  try {
    const token_decoded = jwt.verify(token, "topsecret");
    const email = token_decoded.email;
    dal.findOne(email).then(account => {
      //console.log(account);
      res.send(account);
    });
  } catch (error) {
    //console.log(error);
    res.json({ status: "error", error: "invalid token" });
  }
});

// update - deposit/withdraw amount
app.get("/account/update/:amount", function(req, res) {
  const token = req.headers["x-access-token"];
  const amount = Number(req.params.amount);
  try {
    const token_decoded = jwt.verify(token, "topsecret");
    const email = token_decoded.email;
    dal.update(email, amount).then(response => {
      //console.log(response);
      res.send(response);
    });
  } catch (error) {
    //console.log(error);
    res.json({ status: "error", error: "invalid token" });
  }
});

// all accounts
app.get("/account/all", function(req, res) {
  const token = req.headers["x-access-token"];
  try {
    const token_decoded = jwt.verify(token, "topsecret");
    const email = token_decoded.email;
    if (email) {
      dal.all().then(docs => {
        //console.log(docs);
        res.send(docs);
      });
    }
  } catch (error) {
    //console.log(error);
    res.json({ status: "error", error: "invalid token" });
  }
});

// used to serve static files from build directory
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

app.listen(PORT, () => console.log(`Running on port: ${PORT}`));
