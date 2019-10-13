const express = require('express')
const router = express.Router()

const {
  check,
  validationResult
} = require('express-validator')

// Load Middleware
const auth = require('../../middleware/auth')

// Load Profile Model
const Profile = require('../../models/Profile')
// Load User model
const User = require('../../models/User')
// Load Post model
const Post = require('../../models/Post')

// @route api/profile/me
// @description Fetch User Profile Info
// @access Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate('user', ['first_name', 'last_name', 'avatar'])

    if (!profile) {
      return res.status(400).json({
        errors: [{
          msg: 'There are no profile of this user.'
        }]
      })
    }
    return res.json(profile)
  } catch (error) {
    console.error(error.message)
    return res.status(500).send('Server error')
  }
})

// @route POST api/profile
// @description Crease or Update Profile
// @access Private
router.post(
  '/',
  [auth,
    [
      check('status', 'Status is required.')
      .not()
      .isEmpty(),
      check('skills', 'Skill is required')
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

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin
    } = req.body

    const profileField = {}

    profileField.user = req.user.id

    if (company) profileField.company = company
    if (website) profileField.website = website
    if (location) profileField.location = location
    if (bio) profileField.bio = bio
    if (githubusername) profileField.githubusername = githubusername
    if (status) profileField.status = status
    if (skills) profileField.skills = skills.split(',').map(skill => skill.trim())
    if (youtube) profileField.youtube = youtube
    if (facebook) profileField.facebook = facebook
    if (twitter) profileField.twitter = twitter
    if (instagram) profileField.instagram = instagram
    if (linkedin) profileField.linkedin = linkedin


    try {
      let profile = await Profile.findOne({
        user: req.user.id
      })

      if (profile) {
        profile = await Profile.findOneAndUpdate({
          user: req.user.id
        }, {
          $set: profileField
        }, {
          new: true
        })
        return res.json(profile)
      }

      profile = new Profile(profileField)
      await profile.save()

      res.json(profile)
    } catch (error) {
      console.error(error.message)
      res.status(500).send('Server error')
    }
  }
)

// @route api/profile
// @description GET all of profiles
// @access Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', [
      'first_name',
      'last_name',
      'avatar'
    ])

    if (!profiles) {
      return res.status(400).send({
        errors: [{
          msg: 'No profile information found.'
        }]
      })
    }
    return res.json(profiles)
  } catch (error) {
    console.log(error.message)
    res.status(500).send('Server error')
  }
})

// @route api/profile/:user_id
// @description GET specific profiles
// @access Public
router.get('/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate('user', ['first_name', 'last_name', 'avatar'])

    if (!profile) {
      return res.status(400).send({
        errors: [{
          msg: 'Profile information found.'
        }]
      })
    }
    return res.json(profile)
  } catch (error) {
    console.log(error.message)
    res.status(500).send('Server error')
  }
})

// @route api/profile/:user_id
// @description DELETE specific profile
// @access Private
router.delete('/', auth, async (req, res) => {
  try {
    await Post.deleteMany({
      user: req.user.id
    })

    await Profile.findOneAndRemove({
      user: req.user.id
    })

    await User.findOneAndRemove({
      _id: req.user.id
    })

    res.json({
      msg: 'User deleted successfully.'
    })
  } catch (error) {
    console.log(error.message)
    res.status(500).send('Server error')
  }
});

// @route api/profile/experience
// @description PUT Add new experience
// @access Private
// required title, company, from
router.put('/experience', [auth, [
  check('title', 'Title is required.').not().isEmpty(),
  check('company', 'Company is required.').not().isEmpty(),
  check('from', 'From date is required.').not().isEmpty()
]], async (req, res) => {
  const error = validationResult(req)

  if (!error.isEmpty()) {
    return res.status(400).json({
      errors: error.array()
    })
  }

  const {
    title,
    company,
    location,
    from,
    to,
    current,
    description
  } = req.body

  const newExp = {
    title,
    company,
    location,
    from,
    to,
    current,
    description
  }

  try {
    let profile = await Profile.findOne({
      user: req.user.id
    })

    profile.experience.unshift(newExp)

    await profile.save()
    res.json(profile)
  } catch (error) {
    console.log(error.message)
    res.status(500).send('Server error')
  }

})

// @route api/profile/experience/:experience_id
// @description DELETE remove experience
// @access Private
router.delete('/experience/:experience_id', auth, async (req, res) => {
  const experience_id = req.params.experience_id
  try {
    let profile = await Profile.findOne({
      user: req.user.id
    })
    profile.experience = profile.experience.filter((value) => value.id !== experience_id)
    profile.save()
    res.json(profile)
  } catch (error) {
    console.log(error.message)
    res.status(500).send('Server error')
  }
})

// @route api/profile/experience/update/:experience_id
// @description PUT experience
// @access Private
// required title, company, from
router.put('/experience/update/:experience_id', [auth, [
  check('title', 'Title is required.').not().isEmpty(),
  check('company', 'Company is required.').not().isEmpty(),
  check('from', 'From date is required.').not().isEmpty()
]], async (req, res) => {
  const experience_id = req.params.experience_id

  const error = validationResult(req)

  if (!error.isEmpty()) {
    return res.status(400).json({
      errors: error.array()
    })
  }
  const {
    title,
    company,
    location,
    from,
    to,
    current,
    description
  } = req.body

  const updatedExp = {
    title,
    company,
    location,
    from,
    to,
    current,
    description
  }
  try {
    let profile = await Profile.findOne({
      user: req.user.id
    })
    profile.experience = profile.experience.map((value) => {
      if (value.id === experience_id) {
        updatedExp.id = value.id
        return updatedExp
      }
      return value;
    })

    profile.save()
    res.json(profile)
  } catch (error) {
    console.log(error.message)
    res.status(500).send('Server error')
  }
})

// @route api/profile/education
// @description PUT Add new education
// @access Private
// required school, degree, fieldofstudy, from
router.put('/education', [auth, [
  check('school', 'School is required.').not().isEmpty(),
  check('degree', 'Degree is required.').not().isEmpty(),
  check('fieldofstudy', 'Field of study date is required.').not().isEmpty(),
  check('from', 'From date is required.').not().isEmpty()
]], async (req, res) => {
  const error = validationResult(req)

  if (!error.isEmpty()) {
    return res.status(400).json({
      errors: error.array()
    })
  }

  const {
    school,
    degree,
    fieldofstudy,
    from,
    to,
    current,
    description
  } = req.body

  const newEdu = {
    school,
    degree,
    fieldofstudy,
    from,
    to,
    current,
    description
  }

  try {
    let profile = await Profile.findOne({
      user: req.user.id
    })

    profile.education.unshift(newEdu)

    await profile.save()
    res.json(profile)
  } catch (error) {
    console.log(error.message)
    res.status(500).send('Server error')
  }

})

// @route api/profile/education/:education_id
// @description DELETE remove education
// @access Private
router.delete('/education/:education_id', auth, async (req, res) => {
  const education_id = req.params.education_id
  try {
    let profile = await Profile.findOne({
      user: req.user.id
    })
    profile.education = profile.education.filter((value) => value.id !== education_id)
    profile.save()
    res.json(profile)
  } catch (error) {
    console.log(error.message)
    res.status(500).send('Server error')
  }
})

// @route api/profile/education/update/:education_id
// @description PUT education
// @access Private
// required school, degree, fieldofstudy, from
router.put('/education/update/:education_id', [auth, [
  check('school', 'School is required.').not().isEmpty(),
  check('degree', 'Degree is required.').not().isEmpty(),
  check('fieldofstudy', 'Field of study date is required.').not().isEmpty(),
  check('from', 'From date is required.').not().isEmpty()
]], async (req, res) => {
  const experience_id = req.params.education_id

  const error = validationResult(req)

  if (!error.isEmpty()) {
    return res.status(400).json({
      errors: error.array()
    })
  }
  const {
    school,
    degree,
    fieldofstudy,
    from,
    to,
    current,
    description
  } = req.body

  const updateEdu = {
    school,
    degree,
    fieldofstudy,
    from,
    to,
    current,
    description
  }
  try {
    let profile = await Profile.findOne({
      user: req.user.id
    })
    profile.education = profile.education.map((value) => {
      if (value.id === experience_id) {
        updateEdu.id = value.id
        return updateEdu
      }
      return value;
    })

    profile.save()
    res.json(profile)
  } catch (error) {
    console.log(error.message)
    res.status(500).send('Server error')
  }
})

module.exports = router