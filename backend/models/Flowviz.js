const mongoose = require('mongoose');

const { Schema } = mongoose;

// Define collection and schema
const Flowviz = new Schema({
  nodes: {
    type: [Object],
  },
  links: {
    type: [Object],
  },
  name: {
    type: String,
    unique: true,
  },
  on_error: {
    type: String,
  },
  desc: {
    type: String,
  },
  image: {
    type: String,
    required: false,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
}, {
  collection: 'flows_viz',
  timestamps: true,
  strictQuery: false,
  strict: false,
});

module.exports = mongoose.model('Flowviz', Flowviz);
