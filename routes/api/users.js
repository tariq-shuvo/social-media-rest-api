const express = require('express')
const router = express.Router()

// Load express validator
const {check, validationResult, body} = require('express-validator')
// Load User Model
const User = require('../../models/User')
// Load Bryptjs
const bcrypt = require('bcryptjs')
// Load jsonwebtoken
const jwt = require('jsonwebtoken')
// Load config
const config = require('config')
// Load gravatar
const gravatar = require('gravatar')

// @routre POST api/users
// @description User Registration
// @access Public
// Post variable first_name, last_name, email, password
router.post(
  '/',
  [
    check('first_name', 'First name shoud not be empty')
      .not()
      .isEmpty(),
    check('last_name', 'Last name shoud not be empty')
      .not()
      .isEmpty(),
    check('email', 'Email should be in email format.').isEmail(),
    check('password', 'Password should be 6 or more character.').isLength({
      min: 6
    }),
    check(
      'confirm_password',
      'Password confirmation does not match password.'
    ).custom((value, {req}) => {
      if (value !== req.body.password && req.body.password !== null) {
        return false
      } else {
        return true
      }
    })
  ],
  async (req, res) => {
    const error = validationResult(req)

    if (!error.isEmpty()) {
      return res.status(400).json({
        errors: error.array()
      })
    }

    const {first_name, last_name, email, password} = req.body

    try {
      let user = await User.findOne({
        email
      })

      if (user) {
        return res.status(400).send({
          errors: [
            {
              msg: 'User already exists.'
            }
          ]
        })
      }

      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm'
      })

      user = new User({
        first_name,
        last_name,
        email,
        password,
        avatar
      })

      const salt = await bcrypt.genSalt(10)

      user.password = await bcrypt.hash(password, salt)

      await user.save()

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
      res.status(500).send('Server error')
    }
  }
)

module.exports = router
