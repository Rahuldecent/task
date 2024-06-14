const mongoose = require("mongoose");

exports.connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.DATABASE_URL);
        console.log(
            "MongoDB is connected"
        );
    }
    catch (error) {
        console.log(`error in mongodb ${error}`)
    }
}