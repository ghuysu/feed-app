const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');   
const multer = require("multer");

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const app = express();
console.log(process);
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images");
    },
    filename: (req, file, cb) =>{
        cb(null, new Date().toISOString() + "-" + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if(
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/jpeg"
    )
        cb(null, true);
    else
        cb(null, false);
}

app.use(bodyParser.json());
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes); 

app.use((error, req, res, next) =>{
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({message: message, data: data});
})

mongoose.connect(`mongodb+srv://${process.env.USERNAME}}:${process.env.PASSWORD}@cluster0.ibftatx.mongodb.net/${process.env.DATAABSE}`)
    .then(result =>
        {
            console.log("Connect MongooseDB successfully!");
            const server = app.listen(process.env.PORT);
            const io = require('./socket').init(server)               
            io.on('connection', socket => {
                console.log("Client connected");
            });
        })
    .catch(err => console.log(err));
