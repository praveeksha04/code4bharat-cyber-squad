const express = require('express')
const connectDB = require('./config/connectDB');
const app = express()

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mydbname';

connectDB(MONGODB_URI)
app.use(express.json())


app.listen(PORT , () => {
    console.log("😁 server")
})