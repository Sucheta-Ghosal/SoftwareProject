const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const studentSchema = new mongoose.Schema({
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
    admissionNumber: { type: String, unique: true, sparse: true },
    profilePhoto: { type: String },
    bio: { type: String },
    skills: [String],
    degree: { type: String, enum: ["B.Tech", "M.Tech"] },
    year: { type: Number },
    branch: { type: String },
    cgpa: { type: Number, min: 0, max: 10 },
    resumeUrl: { type: String }
}, { timestamps: true });

// Hash password before saving
studentSchema.pre("save", async function() {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
studentSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Student", studentSchema);
