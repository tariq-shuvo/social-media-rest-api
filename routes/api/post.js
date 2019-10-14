const express = require('express')
const router = express.Router()

const {check, validationResult} = require('express-validator')

// Load Middleware
const auth = require('../../middleware/auth')
// Load User model
const User = require('../../models/User')
// Load Post model
const Post = require('../../models/Post')

// @route api/post
// @description POST add post
// @access Private
router.post(
  '/',
  [
    auth,
    [
      check('text', 'Post should not be empty.')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const error = validationResult(req)

    if (!error.isEmpty()) {
      return res.status(400).json({
        errors: error.array()
      })
    }

    const {text} = req.body

    const newPost = {
      user: req.user.id,
      text
    }
    try {
      let post = new Post(newPost)
      await post.save()
      return res.json(post)
    } catch (error) {
      console.error(error.message)
      res.status(500).send('Server error')
    }
  }
)

// @route api/post/:post_id
// @description PUT update post
// @access Private
router.put(
  '/:post_id',
  [
    auth,
    [
      check('text', 'Post should not be empty.')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const error = validationResult(req)

    if (!error.isEmpty()) {
      return res.status(400).json({
        errors: error.array()
      })
    }
    const post_id = req.params.post_id

    const {text} = req.body

    try {
      let post = await Post.findById(post_id)

      if (post.user.toString() !== req.user.id) {
        return res.status(400).json({
          errors: [
            {
              msg: 'User authorization faild.'
            }
          ]
        })
      }
      post.text = text
      await post.save()
      res.json(post)
    } catch (error) {
      console.error(error.message)
      if (error.kind === 'ObjectId') {
        res.status(400).json({
          msg: 'Post not found'
        })
      }
      res.status(500).send('Server error')
    }
  }
)

// @route api/post/:post_id
// @description DELETE delete post
// @access Private
router.delete('/:post_id', auth, async (req, res) => {
  const post_id = req.params.post_id

  try {
    let post = await Post.findById(post_id)

    if (post.user.toString() !== req.user.id) {
      return res.status(400).json({
        errors: [
          {
            msg: 'User authorization faild.'
          }
        ]
      })
    }
    await post.remove()
    res.json({
      msg: 'Post removed successfully.'
    })
  } catch (error) {
    console.error(error.message)
    if (error.kind === 'ObjectId') {
      res.status(400).json({
        msg: 'Post not found'
      })
    }
    res.status(500).send('Server error')
  }
})

// @route api/post
// @description GET all post
// @access Private
router.get('/', auth, async (req, res) => {
  try {
    let posts = await Post.find()
      .populate('user', ['first_name', 'last_name', 'avatar'])
      .sort({
        date: -1
      })

    res.json(posts)
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server error')
  }
})

// @route api/post/:user_id
// @description GET all post
// @access Private
router.get('/:user_id', auth, async (req, res) => {
  const user_id = req.params.user_id

  try {
    let posts = await Post.find({
      user: user_id
    })
      .populate('user', ['first_name', 'last_name', 'avatar'])
      .sort({
        date: -1
      })

    res.json(posts)
  } catch (error) {
    console.error(error.message)
    if (error.kind === 'ObjectId') {
      res.status(400).json({
        msg: 'Post not found'
      })
    }
    res.status(500).send('Server error')
  }
})

// @route api/post/like/:post_id
// @description PUT like post
// @access Private
router.put('/like/:post_id', auth, async (req, res) => {
  const error = validationResult(req)

  if (!error.isEmpty()) {
    return res.status(400).json({
      errors: error.array()
    })
  }
  const post_id = req.params.post_id

  try {
    let post = await Post.findById(post_id)

    let liked_user_flag = post.likes.filter(
      value => value.user.toString() === req.user.id
    ).length

    if (liked_user_flag > 0) {
      post.likes = post.likes.filter(value => {
        return value.user.toString() !== req.user.id
      })
    } else {
      post.likes.unshift({
        user: req.user.id
      })
    }

    await post.save()

    res.json(post)
  } catch (error) {
    console.error(error.message)
    if (error.kind === 'ObjectId') {
      res.status(400).json({
        msg: 'Post not found'
      })
    }
    res.status(500).send('Server error')
  }
})

// @route api/post/alllike/:post_id
// @description GET all like of a post
// @access Private
router.get('/alllike/:post_id', auth, async (req, res) => {
  const error = validationResult(req)

  if (!error.isEmpty()) {
    return res.status(400).json({
      errors: error.array()
    })
  }
  const post_id = req.params.post_id

  try {
    let post = await Post.findById(post_id)

    let allLikedUser = []

    post.likes.map(value => {
      allLikedUser.push(value.user)
    })

    let users = await User.find({
      _id: {
        $in: allLikedUser
      }
    })
      .select('-password')
      .select('-email')

    res.json(users)
  } catch (error) {
    console.error(error.message)
    if (error.kind === 'ObjectId') {
      res.status(400).json({
        msg: 'Post not found'
      })
    }
    res.status(500).send('Server error')
  }
})

// @route api/post/comment/:post_id
// @description PUT Comment in a post
// @access Private
router.put(
  '/comment/:post_id',
  [
    auth,
    [
      check('text', 'Cooment should not be empty.')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const error = validationResult(req)

    if (!error.isEmpty()) {
      return res.status(400).json({
        errors: error.array()
      })
    }
    const post_id = req.params.post_id

    const {text} = req.body

    let user = await User.findById(req.user.id).select('-password')

    let newComment = {
      user: req.user.id,
      text,
      name: user.first_name + ' ' + user.last_name,
      avatar: user.avatar
    }

    try {
      let post = await Post.findById(post_id)

      post.comments.unshift(newComment)

      await post.save()

      res.json(post)
    } catch (error) {
      console.error(error.message)
      if (error.kind === 'ObjectId') {
        res.status(400).json({
          msg: 'Post not found'
        })
      }
      res.status(500).send('Server error')
    }
  }
)

// @route api/post/comment/update/:post_id/:comment_id
// @description PUT update a comment
// @access Private
router.put(
  '/comment/update/:post_id/:comment_id',
  [
    auth,
    [
      check('text', 'Cooment should not be empty.')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const error = validationResult(req)

    if (!error.isEmpty()) {
      return res.status(400).json({
        errors: error.array()
      })
    }
    const post_id = req.params.post_id
    const comment_id = req.params.comment_id

    const {text} = req.body

    try {
      let post = await Post.findById(post_id)

      let comments_user_flag = post.comments.filter(
        value => value.user.toString() === req.user.id
      ).length

      if (comments_user_flag === 0) {
        return res.status(400).json({
          errors: [
            {
              msg: 'User authorization faild.'
            }
          ]
        })
      }

      post.comments = post.comments.map(value => {
        if (value.id === comment_id && value.user.toString() === req.user.id) {
          value.text = text
        }
        return value
      })

      await post.save()

      res.json(post)
    } catch (error) {
      console.error(error.message)
      if (error.kind === 'ObjectId') {
        res.status(400).json({
          msg: 'Post not found'
        })
      }
      res.status(500).send('Server error')
    }
  }
)

// @route api/post/comment/:post_id/:comment_id
// @description Delete Comment in a post
// @access Private
router.delete('/comment/:post_id/:comment_id', auth, async (req, res) => {
  const post_id = req.params.post_id
  const comment_id = req.params.comment_id

  try {
    let post = await Post.findById(post_id)

    let comments_user_flag = post.comments.filter(
      value => value.user.toString() === req.user.id
    ).length

    if (comments_user_flag === 0) {
      return res.status(400).json({
        errors: [
          {
            msg: 'User authorization faild.'
          }
        ]
      })
    }

    post.comments = post.comments.filter(value => value.id !== comment_id)

    await post.save()

    res.json(post)
  } catch (error) {
    console.error(error.message)
    if (error.kind === 'ObjectId') {
      res.status(400).json({
        msg: 'Post not found'
      })
    }
    res.status(500).send('Server error')
  }
})

module.exports = router
