const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();
const port = 3000;
require("dotenv").config();

require("./utils/db.js")();

app.use(express.json());

app.use(express.static("public"));

app.use((req, res, next) => {
  if (
    req.headers &&
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    jwt.verify(
      req.headers.authorization.split(" ")[1],
      process.env.APP_KEY,
      (err, decoded) => {
        if (err) {
          req.user = undefined;
          next();
        } else {
          req.user = decoded;
          next();
        }
      }
    );
  } else {
    req.user = undefined;
    next(); // move onto the next middleware
  }
});

app.use((req, res, next) => {
  console.log(req.user);
  // it'd hang if we didn't tell it next() or give some response (which would end it)
  next();
});

app.use("/api/users", require("./routes/users"));
app.use("/api/festivals", require("./routes/festivals"));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
