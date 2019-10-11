const express = require('express')
const router = express.Router()

// Load Express Validator
const {check, validationResult} = require('express-validator')
// Load User Model
const User = require('../../models/User')
// Load bcryptjs
const bcrypt = require('bcryptjs')
// Load Jsonwebtoken
const jwt = require('jsonwebtoken')
// Load Config
const config = require('config')
// Load Auth Middleware
const auth = require('../../middleware/auth')

// @route GET api/auth
// @description User Authentication Check
// @access Public
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    return res.json(user)
  } catch (error) {
    console.log(error.message)
    return res.status(500).send('Server error')
  }
})

// @routre POST api/auth/login
// @description User Registration
// @access Public
// Post variable email, password
router.post(
  '/login',
  [
    check('email', 'Email should be in email format.').isEmail(),
    check('password', 'Password should not be empty.')
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const error = validationResult(req)

    if (!error) {
      return res.status(400).json({
        errors: error.array()
      })
    }

    const {email, password} = req.body

    try {
      let user = await User.findOne({
        email
      })

      if (!user) {
        return res.status(400).json({
          errors: [
            {
              msg: 'Invalid credentials.'
            }
          ]
        })
      }

      const isMatch = await bcrypt.compare(password, user.password)

      if (!isMatch) {
        return res.status(400).json({
          errors: [
            {
              msg: 'Invalid credentials.'
            }
          ]
        })
      }

      const payload = {
        user: {
          id: user.id
        }
      }

      jwt.sign(
        payload,
        config.get('jwtSecrect'),
        {
          expiresIn: config.get('authTokenExpire')
        },
        (err, token) => {
          if (err) throw err
          res.json({
            token
          })
        }
      )
    } catch (error) {
      console.error(error.message)
      return res.status(500).send('Server error')
    }
  }
)

module.exports = router
