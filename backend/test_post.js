const mongoose = require("mongoose");
require("dotenv").config();
const Internship = require("./models/Internship");
const Recruiter = require("./models/Recruiter");

async function create() {
    await mongoose.connect(process.env.MONGO_URI);
    const recruiter = await mongoose.model("Recruiter").findOne();
    if (!recruiter) {
        console.log("No recruiter found");
        process.exit(1);
    }
    const internship = new Internship({
        companyName: "Debug Corp",
        position: "Debug Intern",
        description: "Checking if fields save",
        requirements: "None",
        location: "Remote",
        stipend: "1000",
        duration: "3 months",
        deadline: new Date(Date.now() + 86400000 * 7), // 7 days from now
        minCgpa: 8.5,
        postedBy: recruiter._id
    });
    const saved = await internship.save();
    console.log("Saved Internship:", JSON.stringify(saved, null, 2));
    process.exit(0);
}
create();
