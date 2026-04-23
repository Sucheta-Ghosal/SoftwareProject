const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const Student = require("./models/Student");
const Recruiter = require("./models/Recruiter");
const Job = require("./models/Job");
const Internship = require("./models/Internship");
const Application = require("./models/Application");

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for seeding...");

        // Wipe data
        await Promise.all([
            Recruiter.deleteMany({}),
            Job.deleteMany({}),
            Internship.deleteMany({}),
            Application.deleteMany({})
        ]);
        console.log("Existing recruitment data cleared.");

        // Create Recruiters
        const microsoft = new Recruiter({
            name: "Microsoft Recruitment Team",
            username: "microsoft",
            password: "1234", 
            email: "jobs@microsoft.com",
            companyName: "Microsoft"
        });

        const google = new Recruiter({
            name: "Google Talent Acquisition",
            username: "google",
            password: "5678",
            email: "careers@google.com",
            companyName: "Google"
        });

        await Promise.all([microsoft.save(), google.save()]);
        console.log("Recruiters created: microsoft/1234 and google/5678");

        // Seed Postings
        const weekLater = new Date(Date.now() + 86400000 * 7);
        const monthLater = new Date(Date.now() + 86400000 * 30);

        const jobs = [
            {
                companyName: "Microsoft",
                position: "Software Engineer II",
                description: "Developing large-scale distributed systems on Azure.",
                requirements: "Experience with C#, .NET, and cloud architecture.",
                location: "Hyderabad / Remote",
                salary: "35 LPA",
                deadline: weekLater,
                minCgpa: 8.5,
                postedBy: microsoft._id
            },
            {
                companyName: "Google",
                position: "SRE (Site Reliability Engineer)",
                description: "Ensuring high availability and scalability of Google services.",
                requirements: "Strong understanding of Linux, Python, and distributed systems.",
                location: "Bangalore",
                salary: "45 LPA",
                deadline: monthLater,
                minCgpa: 9.0,
                postedBy: google._id
            }
        ];

        const internships = [
            {
                companyName: "Microsoft",
                position: "SWE Intern",
                description: "Summer internship for final year students.",
                requirements: "Strong DSA and problem solving skills.",
                location: "Noida",
                stipend: "80,000 / month",
                duration: "2 Months",
                deadline: weekLater,
                minCgpa: 8.0,
                postedBy: microsoft._id
            },
            {
                companyName: "Google",
                position: "STEP Intern",
                description: "Development program for first and second year students.",
                requirements: "Foundational computer science knowledge.",
                location: "Mumbai",
                stipend: "1,20,000 / month",
                duration: "3 Months",
                deadline: monthLater,
                minCgpa: 9.5,
                postedBy: google._id
            }
        ];

        await Promise.all([
            Job.insertMany(jobs),
            Internship.insertMany(internships)
        ]);
        console.log("Sample jobs and internships seeded.");

        console.log("Seeding complete!");
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
}

seed();
