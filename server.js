//npm run server to start nodemon

const express = require('express');
const connectDB = require('./config/db');

const app = express();

//Call Connect to MongoDB
connectDB();

//Init Middleware
//Returns middleware that only parses json and only looks at requests where the Content-Type header matches the type option.
app.use(express.json({ extended: false }));

//Define routes //LHS route will replace route in RHS file
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

app.get('/', (req, res) =>
  res.send('http://localhost:5000/  -->  is my home page')
);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));
