// Everything in Mongoose starts with a Schema. Each schema maps to a MongoDB collection and
// defines the shape of the documents within that collection.

//to interact with DB we need to create modal

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

//mongoose.model(modelName, schema)
//user will be users in mongo client
module.exports = User = mongoose.model('user', UserSchema);
