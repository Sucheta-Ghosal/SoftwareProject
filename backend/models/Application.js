const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    internshipId: { type: mongoose.Schema.Types.ObjectId, ref: "Internship" },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    status: { 
        type: String, 
        enum: ["Pending", "Shortlisted", "Rejected", "Selected"], 
        default: "Pending" 
    },
    appliedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Application", applicationSchema);
