const mongoose = require("mongoose");
require("dotenv").config();
const Internship = require("./models/Internship");

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const latest = await Internship.findOne().sort({ createdAt: -1 });
    console.log("Latest Internship:", JSON.stringify(latest, null, 2));
    process.exit(0);
}
check();
