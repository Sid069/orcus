const { default: mongoose, Collection } = require("mongoose");

const answerSchema = new mongoose.Schema({
    user : {
        name : {
            type:String,
            required:true
        },
        email : {
            type:String,
            required:true,
            unique:true
        },
        phone: {
            type: String,
            required: true,
            unique:true
        }
    },
    attempt : {
        type: Number,
        required: true
    },
    answer : [{
        type:String,
        required:true,
    }]
    // ,
    // status : {
    //     type:String,
    //     required:true,
    // }
    // ,
    // tokens:[{
    //     token:{
    //         type:String,
    //         required:true
    //     }
    // }]
});

// creating Collection


const Answer = new mongoose.model("answers", answerSchema);

module.exports = Answer;