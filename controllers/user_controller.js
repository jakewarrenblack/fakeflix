const User = require('../models/user_schema');
const bcrypt = require('bcryptjs');

const register = (req, res) => {
    let newUser = new User(req.body);
    newUser.password = bcrypt.hashSync(req.body.password, 10);

    console.log(newUser);

    newUser.save((err, user) => {
        if(err){
            return res.status(400).json({
                msg: err
            });
        }
        else {
            user.password = undefined;
            return res.status(201).json(user);
        }
    });


};

const login = (req, res) => {
    User.findOne({
        email: req.body.email
    })
    .then((user) => {

        if(!user || !user.comparePassword(req.body.password)){
            res.status(401).json({
                msg: 'Authentication failed. Invalid user or password'
            });
        }
        else {
            // generate a token
            res.status(200).json({
                msg: 'All good'
            });
        }
    })
    .catch((err) => {
        throw err;
    })
};


module.exports = {
    register,
    login
};


