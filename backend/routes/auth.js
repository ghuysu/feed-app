const express = require("express");
const router = express.Router();
const {body} = require("express-validator");
const authController = require("../controllers/auth");
const User = require("../models/user");

router.put(
    "/signup",
    [
        body("email")
            .isEmail()
            .withMessage("Please enter a valid email")
            .custom((value, {req}) => {
                return User.findOne({email: value})
                        .then(user => {
                            if(user)
                            {
                                return Promise.reject("E-Mail address already exists");
                            }
                        })
            })
            .normalizeEmail(),

        body("name")
            .trim()
            .not().isEmpty()
            .withMessage("Please enter your name"),

        body("password")
            .trim()
            .isLength({min: 5})
            .withMessage("Password must have at least 5 characters")
    ], authController.signup);

router.post('/login', authController.login);
module.exports = router;