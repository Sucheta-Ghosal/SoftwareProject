require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("./models/Admin");

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for re-seeding...");

        const adminData = {
            name: "Sucheta",
            username: "Sucheta",
            password: "1234", // This will be hashed by the pre-save hook in Admin model
            email: "sucheta@admin.com"
        };

        // Delete existing to ensure clean seed with new bcrypt model
        await Admin.deleteOne({ username: "Sucheta" });
        
        const admin = new Admin(adminData);
        await admin.save();
        console.log("Admin user 'Sucheta' re-created with encrypted password!");

        mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error("Error seeding admin:", err);
        process.exit(1);
    }
};

seedAdmin();
