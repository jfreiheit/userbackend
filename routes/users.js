const express = require('express');
const router = express.Router();
const User = require('../models/users');
const bcrypt = require('bcrypt');

// get all users
router.get('/', async(req, res) => {
    const allUsers = await User.find();
    console.log(allUsers);
    res.send(allUsers);
});

// post one user - register
router.post('/register', async(req, res) => {
    const existingUsername = await User.findOne( {username: req.body.username});
    const existingEmail = await User.findOne( {email: req.body.email});
    if(!existingUsername && !existingEmail) {
        bcrypt.hash(req.body.password, 10).then(
            async (hash) => {
                const newUser = new User({
                    username: req.body.username,
                    password: hash,
                    email: req.body.email,
                    role: req.body.role
                })
                await newUser.save();
                res.send(newUser);
            })
            .catch( err => res.status(400).json({ error: 'user not created' }))
    } else {
        res.status(400).json({ error: 'username and/or email exist(s)' });
    }
});

// post username and password - login
router.post('/login', async(req, res) => {
    console.log('login req', req)
    const existingUsername = await User.findOne( {username: req.body.username});
    if(existingUsername) {
        bcrypt.compare(req.body.password, existingUsername.password)
        .then((result) => {
            if(result) {
                console.log('logged in')
                res.status(201).json({ message: 'logged in' });
            } else {
                console.log('wrong password')
                res.status(204).send(); // wrong password
            }
        })
        .catch( (err) => {
            console.log('something went wrong')
            res.status(400).json({ error: 'something went wrong' })
        }) // never happens
    } else {
        res.status(400).send({ error: 'username does not exist' });
    }
});

// update one user
router.put('/:id', async(req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id })
        if(user && req.body.password) {
            bcrypt.compare(req.body.password, user.password)
            .then( async(result) => 
            {
                if(result) {

                    if (req.body.newPassword) {
                        bcrypt.hash(req.body.newPassword, 10)
                        .then( 
                            async(hash) => {
                                console.log('new hash', hash)
                                await User.updateOne({ _id: req.params.id }, { password: hash });
                            }
                        );
                    }

                    if (req.body.username) {
                        const nameExists = await User.findOne({ username: req.body.username })
                        if(!nameExists) await User.updateOne({ _id: req.params.id }, { username: req.body.username });
                        else res.status(400).json({ error: 'username exists' });
                    }

                    if (req.body.email) {
                        const emailExists = await User.findOne({ email: req.body.email })
                        if(!emailExists) await User.updateOne({ _id: req.params.id }, { email: req.body.email });
                        else res.status(400).json({ error: 'email exists' });
                    }

                    if (req.body.role) {
                        await User.updateOne({ _id: req.params.id }, { role: req.body.role });
                    }

                    res.status(200).send()

                } else {
                    res.status(204).send(); // wrong password
                }

            })
        } else {
            res.status(204).send(); // wrong _id or no password
        }
    } catch {
        res.status(404)
        res.send({ error: "User does not exist!" })
    }
});

// get one user via username
router.get('/:name', async(req, res) => {
    const user = await User.findOne({ username: req.params.name });
    if(user)
        res.send(user);
    else {
        res.status(404);
        res.send({
            error: "User does not exist!"
        });
    }
})

// delete one user via id
router.delete('/:id', async(req, res) => {
    try {
        await User.deleteOne({ _id: req.params.id })
        res.status(204).send()
    } catch {
        res.status(404)
        res.send({ error: "User does not exist!" })
    }
});

module.exports = router;