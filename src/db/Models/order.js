const mongoose = require('mongoose')
const OrderSchema = mongoose.Schema({
    user: {
        type:String,
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
    total_amount:{
        type: Number
    },
    payment_status:{
        type: String,
    },
    payment_mode: {
        type: String
    },
    seats:{
        type: Number
    }

})

const Order = mongoose.model('Order', OrderSchema)

module.exports = Order