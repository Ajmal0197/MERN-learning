const mongoose = require('mongoose');
const config = require('config');
// DB Config
const db = config.get('mongoURI');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
    });
    console.log('MongoDB Connected...');
  } catch (error) {
    console.log(error.message);

    //exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
