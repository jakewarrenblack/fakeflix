const mongoose = require("mongoose");

const connect = async () => {
  let db = null;

  try {
    await mongoose.connect(
      `${process.env.DB_ATLAS_URL}/CA?retryWrites=true&w=majority`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log("\n*Connected successfully to db*\n");
    db = mongoose.connection;
    //console.log(db);
  } catch (error) {
    console.log(error);
  } finally {
    if (db !== null && db.readyState === 1) {
      // await db.close();
      // console.log("Disconnected successfully from db");
    }
  }
};

module.exports = connect;
