// create express server
const express = require('express');
const path = require('path');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const helmet = require('helmet');
const verifyJWT = require('./middlewares/verifyJWT');
const cookieParser = require('cookie-parser');
const credentials = require('./middlewares/credentials');
const morganMiddleware = require('./middlewares/morgan');
const fileUpload = require('express-fileupload');
require('dotenv').config();
const app = express();

const PORT = process.env.PORT || 5001;

app.use(helmet());

app.use(express.json());
app.use(morganMiddleware);

// Handle options credentials check - before cors
// and fetch cookies credentials requirement
app.use(credentials);

// Cross Origin Resource Sharing
app.use(cors(corsOptions));

// built-in middleware to handle urlencoded form data
app.use(express.urlencoded({ extended: false }));

app.use(express.json());

app.use(cookieParser());

//Serve static files...

// define routes
app.use('/auth', require('./routes/auth'));
app.use('/register', require('./routes/register'));
app.use('/refresh', require('./routes/refresh'));
app.use('/logout', require('./routes/logout'));
app.use('/verify-email', require('./routes/verifyEmail'));

// Protected Routes
app.use(verifyJWT);
app.use(
    fileUpload({
        limits: { fileSize: 50 * 1024 * 1024 },
        // 50MB
    })
);
app.use('/records', require('./routes/api/records'));
app.use('/users', require('./routes/api/users'));

app.all('*', (req, res) => {
    res.status(404);
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'));
    } else if (req.accepts('json')) {
        res.json({ error: '404 Not Found' });
    } else {
        res.type('txt').send('404 Not Found');
    }
});

// start server
app.listen(PORT, () => console.log(`Server listening on port ${PORT}!`));
