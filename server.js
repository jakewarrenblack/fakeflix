const express = require('express');
const app = express();
const port = 3000;
require('dotenv').config();

require('./utils/db.js')();

app.use(express.json());

app.use(express.static('public'));


app.use('/api/users', require('./routes/users'));
app.use('/api/festivals', require('./routes/festivals'));


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});