const mongoose = require ('mongoose')

const recipieSchema = mongoose.Schema({
    name : {
        type : String,
        required : true,
        trim : true,
    },
    image:{
        type: String,
        required: true
    },
    description : {
        type : String,
        required : true,
        trim : true,
    },
    rating : {
        rated:{
            type: Number,
        },
        count:{
            type: Number
        }
    },
    price:{
        type: String,
        required: true
    },
    categories:[{
        type: String
    }]
})

const Recipie = mongoose.model('Recipie',recipieSchema)

module.exports = Recipie