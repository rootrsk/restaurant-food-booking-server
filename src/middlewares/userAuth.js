const User = require("../db/Models/user")
const jwt = require('jsonwebtoken')
const ObjectId = require('mongoose').Types.ObjectId
const JWT_SECRET = 'kfhfhaiqwoubncbxzj'

const userAuth = async(req,res, next)=>{
try {
        const {authorization} = req.headers
        console.log(authorization)
        if(!authorization) throw new Error('Login to continue')
        console.log(authorization)
        const {_id} = await jwt.verify(authorization,process.env.JWT_SECRET)
        if(!_id) throw new Error('Login to continue')
        if (!ObjectId.isValid(_id)) throw new Error('Login to continue')
        const user = await User.findById(_id)
        if (!user) throw new Error('Login to continue')
        req.user = user
        next()
    } catch (e) {
        //const {error,status_code} = authError(e.message)
        console.log(e)
        res.json({
            error : e.message,
        })
    }
}
module.exports = userAuth