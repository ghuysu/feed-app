const jwt = require('jsonwebtoken');

module.exports = (req, res, next) =>{
    const authHeader = req.get('Authorization');
    if(!authHeader)
    {
        const error = new Error('Not authenticated');
        error.statusCode = 401;
        return next(error);
    }
    // console.log(authHeader);
    const token = authHeader.split(" ")[1];
    let decodedToken;

    try{
        decodedToken = jwt.verify(token, 'somesupersecretsecret');
    }
    catch(err){
        err.statusCode = 500;
        next(err);
    }
    if(!decodedToken)
    {
        const error = new Error('Not authenticated');
        error.statusCode = 401;
        next(err);
    }
    req.userId = decodedToken.userId;
    next();
}