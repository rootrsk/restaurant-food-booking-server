const express = require ('express')
const router = express.Router()
const User = require('./../db/Models/user')
const Cart = require('../db/Models/cart')
const Order = require('../db/Models/order')
const Recipie = require('../db/Models/recipie')
const userAuth = require('./../middlewares/userAuth')
const Stripe = require('stripe') 
const jwt = require('jsonwebtoken')
const stripe = Stripe(process.env.STRIPE_PUBLISHER_SECRET)
const aws = require( 'aws-sdk' );
const multerS3 = require( 'multer-s3' );
const multer = require('multer');
const path = require( 'path' );
const url = require('url')
const sendMail = require('../middlewares/mailer')
// S3 object 
const s3 = new aws.S3({
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
    Bucket: 'rootrskbucket1'
})
// Upload Function 
const profileImgUpload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'rootrskbucket1',
        acl: 'public-read',
        key: function (req, file, cb) {
            cb(null, path.basename( file.originalname, path.extname( file.originalname ) ) + '-' + Date.now() + path.extname( file.originalname ) )
        }
    }),
    limits:{ fileSize: 2000000 }, // In bytes: 2000000 bytes = 2 MB
    fileFilter: function( req, file, cb ){
        checkFileType( file, cb );
    }
}).single('img')
/**
 * 
 * @param {*} file image file 
 * @param {function } cb callback function 
 * @returns filetype with 
 */
function checkFileType( file, cb ){
    console.log("checking file type")
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif|pdf/;
    // Check ext
    const extname = filetypes.test( path.extname( file.originalname ).toLowerCase());
    // Check mime
    const mimetype = filetypes.test( file.mimetype );if( mimetype && extname ){
        return cb( null, true );
    } else {
        cb( 'Error: Images Only!' );
    }
}

router.get('/',(req,res)=>{
    res.json({
        status: 'Welcome to security rest api',
    })
})

//Router for new users to singup  
router.post('/signup',async(req,res) =>{
    try {
        console.log(req.body)
        const user = new User(req.body)
        const token = await user.getAuthToken()
        user.token = token
        await user.save()
        console.log(user)
        res.json({
            user,
            token
        })
    }catch(e){
        res.json({
            status : 'failed',
            error  : e.message
        })
    }
})
// for loggin user
router.post('/login',async(req,res) =>{
    console.log('login requiret is made')
    try {
        console.log(req.body)
        if (!req.body.id || !req.body.password){
            return res.json({
                status : 'failed',
                error : 'Email or Username and  Password is Required',
            })
        }
        const {user,error} = await User.findByCredentials({
            id : req.body.id,
            password : req.body.password,
        })
        if(error){
            return res.json({
                error : error,
                status : 'failed',
            })
        }
        console.log(user)
        const token = await user.getAuthToken()
        user.token = token
        await user.save()
        res.json({
            user,
            token,
        })
    } catch (e) {
        res.json({
            status : 'failed',
            error : e.message
        })
    }
})
// for getting all registered users
router.get('/users',async(req,res)=>{
    try {
        const users= await User.find()
        res.json(users)
    } catch (error) {
        res.json({
            status : 'failed',
            error : error.message
        })
    }
})
// For getting user details
router.get('/user/me',userAuth,async(req,res)=>{
    try {
        const user= req.user
        const token = user.token
        res.json({
            token,
            user
        })
    } catch (error) {
        res.json({
            status : 'failed',
            error : error.message
        })
    }
})
//Route for updating profile details
router.patch('/user/profile',userAuth,async(req,res) => {
    try {
        req.user.fullname = req.body.fullname
        req.user.email = req.body.email
        req.user.contact = req.body.contact
        await req.user.save()
        // const token = await req.user.getAuthToken()
        res.json({
            user: req.user,
            token:req.user.token,
            status:'success'
        })
    }catch(e){
        res.json({
            status : 'failed',
            error : e.message  
        })
    }
})
/**For genereting Otp  */
router.post('/user/generate-otp', async (req, res) => {
    try {
        if(!req.body.email){
            return res.json({
                status: 'failed',
                error: 'Please Enter a Valid Email!'
            })
        }
        const user = await User.findOne({email:req.body.email})
        if (!user) {
            return res.json({
                status: 'failed',
                error: 'Email is Not Registered!'
            })
        }
        const otp = Math.round(Math.random() * 10000000)
        user.otp = otp
        await user.save()
        await sendMail({
            text:'Please do not share this code with anyone.',
            to:user.email,
            subject:'Password Reset',
            html:`
                <p>Please do not share this code with anyone!</p>
                <h1>${otp}</h1>
                <img 
                    src='https://i.ibb.co/2Wnc5cG/Group-8.png' 
                    alt='cloud vision logo' 
                >
            `
        })
        res.json({
            status: 'success',
            message:`OTP has been send to ${user.email}`
        })
    } catch (e) {
        res.json({
            status: 'failed',
            error: e.message
        })
    }
})
// For changing password with otp
router.post('/user/reset-password', async (req, res) => {
    try {
        if(!req.body.email){
            return res.json({
                status: 'failed',
                error: 'Please Enter a Valid Email!'
            })
        }
        if(!req.body.password){
            return res.json({
                status: 'failed',
                error: 'Please Enter a Valid Password!'
            })
        }
        if (!req.body.otp) {
            return res.json({
                status: 'failed',
                error: 'Please Enter a Valid OTP!'
            })
        }
        const user = await User.findOne({email:req.body.email})
        if (!user) {
            return res.json({
                status: 'failed',
                error: 'Email is Not Registered!'
            })
        }
        console.log(user.otp,req.body.otp)
        if(parseInt(user.otp) === parseInt(req.body.otp)){
            user.password = req.body.password
            user.otp = null
            await user.save()
            return res.json({
                status:'success',
                message:'Your Password has been Changed.'
            })
        }
        const otp = Math.round(Math.random() * 10000000)
        user.otp = otp
        await user.save()
        await sendMail({
            text:'Please do not share this code with anyone.',
            to:user.email,
            subject:'Password Reset',
            html:`
                <p>Please do not share this code with anyone!</p>
                <h1>${otp}</h1>
                <img 
                    src='https://i.ibb.co/2Wnc5cG/Group-8.png' 
                    alt='cloud vision logo' 
                >
            `
        })
        res.json({
            status: 'failed',
            error:'You Have Entered Invalid OTP',
            message:`New OTP has been send to ${user.email}`
        })
    } catch (e) {
        res.json({
            status: 'failed',
            error: e.message
        })
    }
})

router.post( '/user/profile-img',userAuth,async(req,res)=>{
    try{
        console.log(req.files)
        console.log("Incoming request to server")
        profileImgUpload( req, res, ( error ) => {
            if(error){
                return res.json({
                    error: error
                })
            }
            console.log('Before checkgin file')
            if(req.file === undefined){
                return res.json({
                    error:'No File Selected.',
                    status:'failed'
                })
            }
            console.log('Before  upload')
            const imageName = req.file.key;
            const imageLocation = req.file.location;// Save the file name into database into profile model
            console.log(req.user)
            if(req.user.profile && req.user.profile.key){
                // deleting 
                console.log('deleing')
                s3.deleteObject({ Bucket: 'rootrskbucket1', Key: req.user.profile.key }, (err, data) => {
                    console.error(err);
                    console.log(data);
                });
            }
            
            req.user.profile = {
                avatar: imageLocation,
                key: imageName
            };
            req.user.save()
            res.json({
                image: imageName,
                location: imageLocation,
                status:'success',
                error:null,
                user: req.user,
                token:req.user.token
            });

        });
    }catch(e){
        console.log(e)
        res.json({
            error:e.message,
            status:'failed'
        })
    }
})
router.get('/user/cart',userAuth,async(req,res)=>{
    try {
        let cart = await Cart.findOne({user:req.user._id}).populate('items.recipie')
        if(!cart){
            cart = await new Cart({
                user:req.user._id,
            })
            await cart.save()
        }
        res.json({
            status:'Success',
            cart
        })
    } catch (error) {
        res.json({
            error: error.message,
            status: 'failed'
        })
    }
})
router.post('/user/cart',userAuth,async(req,res)=>{
    try {
        let cart = await Cart.findOne({user:req.user._id})
        if(!cart){
            cart = await new Cart({
                user:req.user._id,
            })
            await cart.save()
        }
        cart= await Cart.findOne({user:req.user._id}).populate('items.recipie')
        res.json({
            status: 'Success',
            cart
        })
    } catch (error) {
        res.json({
            error: error.message,
            status: 'failed'
        })
    }
})
router.patch('/user/cart',userAuth,async(req,res)=>{
    try {
        let cart = await Cart.findOne({user:req.user._id})
        if (!cart) {
            cart = await new Cart({
                user: req.user._id,
            })
            await cart.save()
        }
        const { recipie_id }  = req.body
        const { operation } = req.query
        const recipie = await Recipie.findById(recipie_id) 
        if(!recipie){
            return res.json({
                status:'Failed',
                error:'Currently Item is Not Available'
            })
        }
        console.log(cart)
        const recipieIndex = cart.items.findIndex(item=> item.recipie.toString() === recipie_id.toString())
        console.log(recipieIndex)
        if(operation === 'add'){
            if (recipieIndex> -1) {
                cart.items[recipieIndex].count = cart.items[recipieIndex].count+1
            }else{
                console.log(recipie_id)
                cart.items = cart.items.concat({
                    recipie: recipie_id,
                    count: 1
                })
            }
        }
        if(operation === 'remove'){
            if (recipieIndex>-1){
                count = cart.items[recipieIndex].count
                if(count > 1){
                    cart.items[recipieIndex].count = cart.items[recipieIndex].count - 1
                }else{
                    await Promise.resolve(cart.items = cart.items.filter((item)=>{
                        return item.recipie.toString() !== recipie_id.toString()
                    }))
                }
            }
        }
        if (operation === 'removeAll') {
            if (recipieIndex > -1) {
                await Promise.resolve(cart.items = cart.items.filter((item) => {
                    return item.recipie.toString() !== recipie_id.toString()
                }))
            }
        }
        if (operation === 'clear') {
            cart.items = []
        }
        await cart.save()
        cart = await Cart.findOne({user:req.user._id}).populate('items.recipie')
        res.json({
            cart
        })
    } catch (error) {
        console.log(error)
        res.json({
            error: error.message,
            status: 'failed'
        })
    }
})
router.post('/user/order',userAuth,async(req,res)=>{
    try {
        const { seats } = req.body
        const cart = await Cart.findOne({user:req.user._id}).populate('items.recipie')
        let total_amount = 0
        let items = []
        cart.items.forEach((item)=>{
            total_amount += item.recipie.price * item.count
            items.push({
                _id:item.recipie._id,
                name: item.recipie.name,
                price: item.recipie.price,
                count: item.count
            })
        })
        const order_token = jwt.sign({
            items,
            total_amount,
            seats:seats || 1
        }, process.env.JWT_SECRET)
        const user_token = jwt.sign({
            user: req.user
        }, process.env.JWT_SECRET)
        res.json({
            status:'Success',
            total_amount,
            items,
            seats:seats ||1,
            order_token,
            user_token
        })
    } catch (error) {
        res.json({
            status:'failed',
            error:error.message
        })
    }
})


// for payment method
const Razorpay = require('razorpay')
const razorpay = new Razorpay({
    key_id: prcoess.env.RAZORPAY_KEY_ID,
    key_secret: prcoess.env.RAZORPAY_SECRET_KEY
})
const queryString =require('query-string')
const OrderToken = require('../db/Models/tempOrder')
router.post('/user/razorpay-order',async(req,res)=>{
    console.log(req.body)
    console.log(req.body.asPath)
    const body = req.body.asPath
    if (!body){
        return res.json({
            error:'something went wrong'
        })
    }
    const query = queryString.parse(body)
    const user_token = query.user_token
    const order_token = query['/payment?order_token']
    try {
        const user = jwt.verify(user_token,process.env.JWT_SECRET)
        const order_details = jwt.verify(order_token,process.env.JWT_SECRET)
        console.log(user)
        if(!user || !order_details){
            return res.json({
                error: 'Something went wrong.'
            })
        }
        console.log(order_details)
        const options = {
            amount: 100 * order_details.total_amount,
            currency: 'INR',
            receipt: Math.random()*10000,
            payment_capture:1,
        }
        const prefill = {
            email:"rootrsk@gmail.com",
            contact: '6201004131',
            name : 'rootrsk'
        }
        const temp_order = new OrderToken({
            user_token,
            order_token,
            user_id: user._id
        })
        await temp_order.save()
        const order = await razorpay.orders.create(options)
        order.key= key_id
        order.prefill = prefill
        order.notes = [temp_order._id]
        
        res.json({
            order
        })
    } catch (error) {
        res.json({
            error:error.message,
            status:'failed'
        })
    }
})

router.post('/verify-payment',async(req,res)=>{
    try {
        console.log(req.body)
        console.log('afetr boay')
        const temp_id =req.body.payload.payment.entity.notes[0]
        const temp_order = await OrderToken.findById(temp_id)
        const user = jwt.verify(temp_order.user_token, process.env.JWT_SECRET)
        const order = jwt.verify(temp_order.order_token, process.env.JWT_SECRET)
        console.log(user,order)

        const final_order = new Order({
            ...order,
            payment_status:'Success',
            payment_mode: req.body.payload.payment.entity.method,
            status:"booked",
            user:user.user._id
        })
        await final_order.save()
        res.json({
            final_order,
            status:'success'
        })
    } catch (error) {
        console.log(error)
        res.json({
            error:error.message,
            
        })
    }
})
router.get('/user/orders',userAuth,async(req,res)=>{
    try {
        const orders = await Order.find({user:req.user._id}).sort({_id: -1})
        res.json({
            orders
        })
    } catch (error) {
        res.json({
            error:error.message
        })
    }
})
module.exports = router
