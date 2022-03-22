const mongoose = require('mongoose')
const OrderSchema = mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        trim: true,
        ref: 'User'
    },
    items: [{
        name: {
            type:String,
        },
        count: {
            type: Number,
        },
        price:{
            type: Number
        }
    }],
    status:{
        type:String,
    },
    amount:{
        type: Number
    },
    payment_status:{
        type: String,
    },
    payment_mode: {
        type: String
    },
    seat:{
        type: Number
    }

})

const Order = mongoose.model('Order', OrderSchema)

module.exports = Order