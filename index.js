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
const passport = require("passport");
const CLIENTID = "776399895709-3ddui6f51u8capadvdlsh0nejmk2ph8f.apps.googleusercontent.com";
const SECERET ="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";
const callBACKURL ="http://localhost:3000/auth/google/callback";
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: CLIENTID,
      clientSecret: SECERET,
      callbackURL: callBACKURL,
    },
    function (accessToken, refreshToken, profile, cb) {
      // In this function, you can verify the user's Google profile
      // and create or update a user account in your database.
      // The profile object contains the user's Google profile information.
      // Call cb(null, user) to return the user object to Passport.
      // Call cb(null, false) to indicate authentication failure.
    }
  )
);

// Initialize Passport.js and enable session support
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

// Define routes for authentication
app.get(
  "/auth/google/:id_token",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);
// Example of a route that requires authentication
app.get("/protected-route", passport.authenticate("google"), function(req, res) {
  // This route is accessible only if the user is authenticated with Google
  res.send("Welcome to the protected route!");
});
// Example of a route that retrieves the user's information
app.get("/user-info", passport.authenticate("google"), function(req, res) {
  // This route is accessible only if the user is authenticated with Google
  const name = req.user.displayName;
  const email = req.user.emails[0].value;
  res.send(`Hello ${name}, your email is ${email}`);
});



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
