const User = require("../models/user");

const {validationResult} = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res, next) =>
{
    const errors = validationResult(req);

    if(!errors.isEmpty())
    {
        const error = new Error("Validation failed");
        error.statusCode = 422;
        error.data = errors.array();
        return next(error);
    }
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;

    try{
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
            email: email,
            password: hashedPassword,
            name: name
        })
        const result = await user.save();
        res.status(201).json({
            message: "User created",
            userId: result._id
        })
    }
    catch(err){
        if(!err.statusCode)
        {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.login = async (req, res, next) =>
{
    const email = req.body.email;
    const password = req.body.password;
    let checkUser;
    try{
        const user = await User.findOne({email: email});
        if(!user)
        {
            const error = new Error("A user with this email could not be found");
            error.statusCode = 401;
            throw error;
        }
        checkUser = user;
        const isEqual = await bcrypt.compare(password, user.password);
        if(!isEqual)
        {
            const error = new Error("Wrong password");
            error.statusCode = 401;
            throw error;
        }
        const token = await jwt.sign(
            {
                email: checkUser.email,
                userId: checkUser._id.toString()
            },
            'somesupersecretsecret',
            { expiresIn: '1h'}
        );
        res.status(200).json({
            message: "Login successfully",
            token: token, 
            userId: checkUser._id.toString()})
    }
    catch(err)
    {
        if(!err.statusCode)
        {
            err.statusCode = 500;
        }
        next(err);
    }
}