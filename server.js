const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();
const port = 3000;
require("dotenv").config();
const key = process.env.APP_KEY;
const { loginRequired } = require("./controllers/auth_controller");

require("./utils/db.js")();

app.use(express.json());

app.use(express.static("public"));

app.use((req, res, next) => {
  let header = req.headers?.authorization?.split(" ");

  if (header && header[0] === "Bearer")
    jwt.verify(header[1], key, (err, decoded) => !err && (req.user = decoded));

  next();
});

app.use((req, res, next) => {
  console.log(req.user);
  // it'd hang if we didn't tell it next() or give some response (which would end it)
  next();
});

app.use("/api/users", require("./routes/users"));
app.use("/api/festivals", require("./routes/festivals"));
app.use("/api/avatars", require("./routes/avatars"));

// Putting loginRequired here, because *every* Title route is protected
app.use("/api/titles", loginRequired, require("./routes/titles"));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
