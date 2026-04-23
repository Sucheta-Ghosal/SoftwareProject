const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const recruiterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    phoneNumber: { 
        type: String,
        match: [/^\d{10}$/, 'Please fill a valid 10-digit phone number']
    },
    companyName: { type: String, required: true },
    status: { 
        type: String, 
        enum: ["Pending", "Approved", "Rejected"], 
        default: "Pending" 
    },
    profilePhoto: { type: String }
}, { timestamps: true });

// Hash password before saving
recruiterSchema.pre("save", async function() {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
recruiterSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Recruiter", recruiterSchema);
