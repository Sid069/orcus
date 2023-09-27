const { default: mongoose, Collection } = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logger = require('../../logger.js'); // Import your logger module

const userSchema = new mongoose.Schema({
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
    },
    password : {
        type:String,
    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }]
});

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        try {
            this.password = await bcrypt.hash(this.password, 10);
            logger.info("Password hashed successfully");
        } catch (error) {
            logger.error(`Error hashing password: ${error}`);
        }
    }
    next();
});

userSchema.methods.generateAuthToken = async function () {
    try {
        const token = jwt.sign({ _id: this._id.toString() }, process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({ token });
        await this.save();
        logger.info("Token generated successfully");
        return token;
    } catch (error) {
        logger.error(`Error generating token: ${error}`);
    }
}

const Register = new mongoose.model("User", userSchema);

module.exports = Register;