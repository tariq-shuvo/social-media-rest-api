var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')

var mongoConnection = require('./config/dbconnect')
mongoConnection()

var indexRouter = require('./routes/index')
var userRouter = require('./routes/api/users')
var authRouter = require('./routes/api/auth')
var profileRouter = require('./routes/api/profile')

var app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter)
app.use('/api/users', userRouter)
app.use('/api/auth', authRouter)
app.use('/api/profile', profileRouter)

module.exports = app
