function cors (req, res, next) {

    // Website you wish to allow to connect
    const allowedOrigins = [
        "http://localhost:3000",
    ];
    const origin = req.headers.origin;
    if (allowedOrigins.indexOf(origin) > -1) {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Set-Cookie,Authorization,authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of 
    next();
}

module.exports = cors