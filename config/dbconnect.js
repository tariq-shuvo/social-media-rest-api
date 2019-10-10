const mongoose = require('mongoose')
const config = require('config')
const dbLink = config.get('mongoURI')

const connectDB = async () => {
  try {
    await mongoose.connect(dbLink, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true
    })
    console.log('Database Connected')
  } catch (error) {
    console.log(error.message)

    process.exit(1)
  }
}

module.exports = connectDB
