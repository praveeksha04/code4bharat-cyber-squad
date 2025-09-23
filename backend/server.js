require('dotenv').config();
const express = require('express')
const connectDB = require('./config/connectDB');
const cors = require('cors');
const path = require('path');
const app = express()

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mydbname';

app.use(cors());
app.use(express.json());
connectDB(MONGODB_URI)
app.use(express.json())

app.use('/api/transcribe', require('./routes/transcribe'));



app.listen(PORT , () => {
    console.log(`Server started on port ${PORT}`)
})