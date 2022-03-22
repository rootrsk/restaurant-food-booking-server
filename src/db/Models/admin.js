const mongoose = require ('mongoose')
const bcrypt = require ('bcrypt')
const jwt = require ('jsonwebtoken')
const JWT_SECRET = 'kfhfhaiqwoubncbxzj'

const userSchema = mongoose.Schema({
    username : {
        type : String,
        required : true,
        lowercase : true,
        trim : true,
        unique : true,
    },
    fullname : {
        type : String,
        required : true,
        trim : true,
    },
    email : {
        type : String,
        required : true,
        trim : true,
        lowercase : true,
        unique : true,
    },
    contact:{
        type:String
    },
    password : {
        type : String,
        required : true,
        trim : true,
    },
    profile:{
        avatar:{
            type: String,
            default: 'https://i.ibb.co/2Wnc5cG/Group-8.png'
        },
        key: {
            type: String,
            defalut:Math.round(Math.random()*10000000)
        }
    },
    token:{
        type:String
    },
    otp:{
        type: Number
    }
})

userSchema.pre('save',async function(next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password,8)
    }
    next()
})

userSchema.methods.getAuthToken = async function(){
    return token = await jwt.sign({_id: this._id},JWT_SECRET)
}

userSchema.statics.findByCredentials = async function({id,password}){
    let user
    user = await User.findOne({email: id})
    if(!user) user =  await User.findOne({username: id})
    if(!user) return {user: null,error:'No Such User Found.'}
    console.log(password)
    const isMatched = await bcrypt.compare(password.toString(),user.password)
    console.log(isMatched)
    if(!isMatched){
        return {user:null,error:'Password is not Correct.'}
    }
    return {user,error:null}
}

const Admin = mongoose.model('Admin',userSchema)

module.exports = Admin