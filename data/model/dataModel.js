var mongoose = require('mongoose')
   ,Schema = mongoose.Schema

var dataSchema = new Schema({
    fileName: String,
    index: Number,
    data: Array,
    zoomLevel: Number
});

module.exports = mongoose.model('Data', dataSchema);