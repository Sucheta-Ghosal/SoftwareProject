const mongoose = require("mongoose");
require("dotenv").config();
const Student = require("./models/Student");

async function addAmit() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // Remove existing if any to avoid unique constraint issues
        await Student.deleteMany({ username: "amit" });

        const amit = new Student({
            name: "Amit Ghosh",
            username: "amit",
            password: "amit", // Will be hashed by pre-save hook
            email: "amit.ghosh@example.com",
            admissionNumber: "ADM12345",
            degree: "B.Tech",
            branch: "CSE",
            year: 3,
            cgpa: 8.5
        });

        await amit.save();
        console.log("Successfully created student: Amit Ghosh");
        console.log("Credentials -> Username: amit, Password: amit");
        
        // Also reset teststudent password for the user
        const testStudent = await Student.findOne({ username: "teststudent" });
        if (testStudent) {
            testStudent.password = "test1234";
            await testStudent.save();
            console.log("Reset teststudent credentials -> Username: teststudent, Password: test1234");
        } else {
            // Create teststudent if not exists
            const newTS = new Student({
                name: "Test Student",
                username: "teststudent",
                password: "test1234",
                email: "teststudent@example.com",
                admissionNumber: "ADM00001",
                degree: "B.Tech",
                branch: "CSE",
                year: 4,
                cgpa: 9.0
            });
            await newTS.save();
            console.log("Created missing teststudent -> Username: teststudent, Password: test1234");
        }

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

addAmit();
