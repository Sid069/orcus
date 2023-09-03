const { default: mongoose, Collection } = require("mongoose");

const newsSchema = new mongoose.Schema({
    name : {
        type:String,
        required:true
    },
    news : {
        type:String,
        required:true,
    },
    status : {
        type:String,
        required:true,
    }
    // ,
    // tokens:[{
    //     token:{
    //         type:String,
    //         required:true
    //     }
    // }]
});

// creating Collection


const News = new mongoose.model("News", newsSchema);

module.exports = News;