const mongoose = require('mongoose');
(async()=>{
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('DB connected')
    } catch (error) {
        console.log(error.message)
    }
})()