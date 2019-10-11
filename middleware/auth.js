const jwt = require('jsonwebtoken')
const config = require('config')

module.exports = (req, res, next) => {
  // Get x auth token
  const token = req.header('x-auth-token')

  if (!token) {
    return res.status(401).json({
      errors: [
        {
          msg: 'No token, authorization denied.'
        }
      ]
    })
  }

  try {
    const decode = jwt.verify(token, config.get('jwtSecrect'))

    req.user = decode.user

    next()
  } catch (error) {
    console.error(error.message)
    return res.status(401).json({
      msg: 'Authorization not valid.'
    })
  }
}
