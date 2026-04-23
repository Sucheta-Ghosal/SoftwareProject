const mongoose = require("mongoose");

const internshipSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    position: { type: String, required: true },
    description: { type: String, required: true },
    requirements: { type: String, required: true },
    location: { type: String },
    stipend: { type: String },
    duration: { type: String },
    deadline: { type: Date, required: true },
    minCgpa: { type: Number, default: 0, min: 0, max: 10 },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Recruiter", required: true }
}, { timestamps: true });

module.exports = mongoose.model("Internship", internshipSchema);
