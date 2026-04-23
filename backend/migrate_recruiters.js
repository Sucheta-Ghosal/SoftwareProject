const mongoose = require("mongoose");
require("dotenv").config();
const Recruiter = require("./models/Recruiter");

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const result = await Recruiter.updateMany(
            {}, 
            { $set: { status: "Pending" } }
        );
        console.log(`Updated ${result.modifiedCount} recruiters to Pending status.`);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
