const jwt = require('jsonwebtoken');
const config = require('config');

//Middleware functions are functions that have access to the request object ( req ), the response object ( res ), and the next function in
//the application's request-response cycle. The next function is a function in the Express router which, when invoked, executes the middleware 
//succeeding the current middleware.
module.exports = function (req, res, next) {

    //1)Get token from header
    const token = req.header('x-auth-token');

    //2)Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorisation denied' });
    }

    //3)Verify token
    try {

        const decoded = jwt.verify(token, config.get('jwtSecret'));
        req.user = decoded.user;    //take req obj. and assign val. to user, decoded.user is value we assigned to payload at registration time.
        next();     //move to next step



        /*  From token, fetching decoded user id that we set at user registration/login time and in client side stored inside header's x-auth-token //JWT.io
        {
        "user": { "id": "60145f6e0f385f20fc260ed6" }, 
        "iat": 1611947887, 
        "exp": 1612307887
        }
        */

    } catch (error) {
        res.status(401).json({ msg: 'Token is not valid' });
    }

};
