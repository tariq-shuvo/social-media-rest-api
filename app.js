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
var postRouter = require('./routes/api/post')

var app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({
    extended: true
}))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader(
        'Access-Control-Allow-Methods',
        'OPTIONS, GET, POST, PUT, PATCH, DELETE'
    )
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    next()
})

app.use('/', indexRouter)
app.use('/api/users', userRouter)
app.use('/api/auth', authRouter)
app.use('/api/profile', profileRouter)
app.use('/api/post', postRouter)

module.exports = app