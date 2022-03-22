const mongoose = require ('mongoose')

const cartSchema = mongoose.Schema({
    user:{
        type: mongoose.Types.ObjectId,
        trim: true,
        ref:'User'
    },
    items:[{
        recipie:{
            type: mongoose.Types.ObjectId,
            ref:'Recipie'
        },
        count:{
            type: Number, 
        }
    }],

})

const Cart = mongoose.model('Cart',cartSchema)

module.exports = Cart