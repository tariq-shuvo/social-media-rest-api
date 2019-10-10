const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema({})

module.exports = Post = mongoose.model('post', PostSchema)
