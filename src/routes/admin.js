const express = require ('express')
const router = express.Router()
const User = require('./../db/Models/user')
const Cart = require('../db/Models/cart')
const Order = require('../db/Models/order')
const Recipie = require('../db/Models/recipie')
const userAuth = require('./../middlewares/userAuth')


const aws = require( 'aws-sdk' );
const multerS3 = require( 'multer-s3' );
const multer = require('multer');
const path = require( 'path' );
const url = require('url')
const sendMail = require('../middlewares/mailer')
// S3 object 
const s3 = new aws.S3({
    accessKeyId: 'AKIA3OYGIS7MBPLU7EO2',
    secretAccessKey: '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',
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

//Router for new Admin to singup  
router.post('/admin/signup',async(req,res) =>{
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
// for loggin Admin
router.post('/admin/login',async(req,res) =>{
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
router.get('/admin/me',userAuth,async(req,res)=>{
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
router.patch('/admin/profile',userAuth,async(req,res) => {
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

router.get('/admin/cart',userAuth,async(req,res)=>{
    try {
        let cart = await Cart.findOne({user:req.user._id})
        if(!cart){
            cart = await new Cart({
                user:req.user._id,
            })
            await cart.save()
        }
        res.json({
            cart
        })
    } catch (error) {
        res.json({
            error: error.message,
            status: 'failed'
        })
    }
})
/**
 * Routes for recipes 
 */

//get all recipies
router.get('/admin/recipie', async (req, res) => {
    try {
        const recipies = await Recipie.find({})
        res.json({
            status: 'Success',
            recipies
        })
    } catch (error) {
        res.json({
            error: error.message,
            status: 'failed'
        })
    }
})
// Create new Recipie
router.post('/admin/recipie',async(req,res)=>{
    try {
        const recipie = await new Recipie({
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            rating:{
                rated: 5,
                count: 1
            },
            price:req.body.price,
            categories: req.body.categories,
            image: req.body.image
        })
        await recipie.save()
        res.json({
            status:'Success',
            message: 'Recipe Created Successfully',
            recipie
        })
    } catch (error) {
        res.json({
            error: error.message,
            status: 'failed'
        })
    }
})
//update recipie
router.patch('/admin/recipie', async (req, res) => {
    try {
        if(!req.body._id){
            res.json({
                status: 'Falied',
                error:'Recipe Id is Required'
            })
        }
        const recipie = await Recipie.findByIdAndUpdate(req.body._id,{...req.body})
        if(!recipie){
            res.json({
                status:'Failed',
                error: 'No Such Recipie Found.'
            })
        }
        res.json({
            status: 'Success',
            message: 'Recipe Created Successfully',
            recipie
        })
    } catch (error) {
        res.json({
            error: error.message,
            status: 'failed'
        })
    }
})
//Delete Recipes
router.delete('/admin/recipie', async (req, res) => {
    try {
        if (!req.body._id) {
            res.json({
                status: 'Falied',
                error: 'Recipe Id is Required'
            })
        }
        const recipie = await Recipie.findByIdAndDelete(req.body._id)
        if (!recipie) {
            res.json({
                status: 'Failed',
                error: 'No Such Recipie Found.'
            })
        }
        res.json({
            status: 'Success',
            message: 'Recipe Deleted Successfully',
            recipie
        })
    } catch (error) {
        res.json({
            error: error.message,
            status: 'failed'
        })
    }
})


module.exports = router
