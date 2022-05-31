const mongoose = require('mongoose')
const OrderSchema = mongoose.Schema({
    user_token: {
        type:String,
    },
    order_token:{
        type:String
    },
    user_id:{
        type:String
    }
})

const OrderToken = mongoose.model('OrderToken', OrderSchema)

module.exports = OrderToken