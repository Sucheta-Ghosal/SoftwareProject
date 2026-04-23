require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");


const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Create uploads folder if it doesn't exist
if (!fs.existsSync("./uploads")) {
    fs.mkdirSync("./uploads");
}

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

/* MongoDB Connection */
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

app.get("/", (req, res) => {
    res.send("Backend running");
});

const Student = require("./models/Student");
const Recruiter = require("./models/Recruiter");
const Admin = require("./models/Admin");
const Job = require("./models/Job");
const Internship = require("./models/Internship");
const Application = require("./models/Application");

app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        let user = await Student.findOne({ username });
        let role = "student";

        if (!user) {
            user = await Recruiter.findOne({ username });
            role = "recruiter";
        }
        if (!user) {
            user = await Admin.findOne({ username });
            role = "admin";
        }

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user._id, role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ token, role, username: user.username, id: user._id });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/api/students", async (req, res) => {
    try {
        const student = new Student(req.body);
        await student.save();
        res.status(201).json(student);
    } catch (err) {
        console.error("Error creating student:", err);
        res.status(400).json({ error: err.message });
    }
});

app.post("/api/recruiters", async (req, res) => {
    try {
        const recruiter = new Recruiter(req.body);
        await recruiter.save();
        res.status(201).json(recruiter);
    } catch (err) {
        console.error("Error creating recruiter:", err);
        res.status(400).json({ error: err.message });
    }
});

app.get("/api/students", async (req, res) => {
    try {
        const students = await Student.find();
        res.json(students);
    } catch (err) {
        console.error("Error fetching students:", err);
        res.status(500).json({ error: "Server error" });
    }
});

app.get("/api/students/:id", async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ error: "Student not found" });
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

app.get("/api/recruiter/profile/:id", async (req, res) => {
    try {
        const recruiter = await Recruiter.findById(req.params.id);
        if (!recruiter) return res.status(404).json({ error: "Recruiter not found" });
        res.json(recruiter);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

/* Jobs & Internships */
app.post("/api/jobs", async (req, res) => {
    try {
        const job = new Job(req.body);
        await job.save();
        res.status(201).json(job);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get("/api/jobs", async (req, res) => {
    try {
        const { cgpa } = req.query;
        const approvedRecruiters = await Recruiter.find({ status: "Approved" }).distinct("_id");
        let query = { 
            deadline: { $gte: new Date() }, 
            postedBy: { $in: approvedRecruiters } 
        };
        if (cgpa) query.minCgpa = { $lte: Number(cgpa) };
        const jobs = await Job.find(query).sort({ createdAt: -1 });
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/api/internships", async (req, res) => {
    try {
        const internship = new Internship(req.body);
        await internship.save();
        res.status(201).json(internship);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get("/api/internships", async (req, res) => {
    try {
        const { cgpa } = req.query;
        const approvedRecruiters = await Recruiter.find({ status: "Approved" }).distinct("_id");
        let query = { 
            deadline: { $gte: new Date() }, 
            postedBy: { $in: approvedRecruiters } 
        };
        if (cgpa) query.minCgpa = { $lte: Number(cgpa) };
        const internships = await Internship.find(query).sort({ createdAt: -1 });
        res.json(internships);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get all postings for a recruiter
app.get("/api/recruiter/postings/:recruiterId", async (req, res) => {
    try {
        const [jobs, internships] = await Promise.all([
            Job.find({ postedBy: req.params.recruiterId }),
            Internship.find({ postedBy: req.params.recruiterId })
        ]);
        res.json({ jobs, internships });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch postings" });
    }
});

/* Applications */
app.post("/api/applications", async (req, res) => {
    try {
        // Check for existing application
        const existing = await Application.findOne({ 
            studentId: req.body.studentId, 
            $or: [{ jobId: req.body.jobId }, { internshipId: req.body.internshipId }] 
        });
        if (existing) return res.status(400).json({ error: "Already applied" });

        const application = new Application(req.body);
        await application.save();
        res.status(201).json(application);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get("/api/student/applications/:studentId", async (req, res) => {
    try {
        const apps = await Application.find({ studentId: req.params.studentId })
            .populate("jobId")
            .populate("internshipId")
            .sort({ createdAt: -1 });
        res.json(apps);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Get applicants for a posting
app.get("/api/applications/posting/:postingId", async (req, res) => {
    try {
        const apps = await Application.find({ 
            $or: [{ jobId: req.params.postingId }, { internshipId: req.params.postingId }] 
        }).populate("studentId").populate("jobId").populate("internshipId").sort({ createdAt: -1 });
        res.json(apps);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch applicants" });
    }
});

// Update application status (Shortlist/Reject)
app.patch("/api/applications/:id", async (req, res) => {
    try {
        const { status } = req.body;
        const app = await Application.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
        res.json(app);
    } catch (err) {
        res.status(400).json({ error: "Failed to update status" });
    }
});

/* Admin Endpoints */
app.get("/api/admin/recruiters", async (req, res) => {
    try {
        const recruiters = await Recruiter.find().sort({ createdAt: -1 });
        res.json(recruiters);
    } catch (err) { res.status(500).json({ error: "Failed to fetch recruiters" }); }
});

app.patch("/api/admin/recruiters/:id/status", async (req, res) => {
    console.log("PATCH status hit for ID:", req.params.id, "Body:", req.body);
    try {
        const { status } = req.body;
        const recruiter = await Recruiter.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
        if (!recruiter) return res.status(404).json({ error: "Recruiter not found" });
        res.json(recruiter);
    } catch (err) { 
        console.error("Status update error:", err);
        res.status(400).json({ error: "Operation failed" }); 
    }
});

app.get("/api/admin/recruiters-detailed", async (req, res) => {
    try {
        const recruiters = await Recruiter.find().lean();
        const data = await Promise.all(recruiters.map(async (r) => {
            const [jobs, internships] = await Promise.all([
                Job.find({ postedBy: r._id }).lean(),
                Internship.find({ postedBy: r._id }).lean()
            ]);
            return { ...r, jobs, internships };
        }));
        res.json(data);
    } catch (err) { res.status(500).json({ error: "Failed to fetch details" }); }
});

app.get("/api/admin/stats/branch-wise", async (req, res) => {
    try {
        const students = await Student.find().lean();
        const applications = await Application.find({ status: "Selected" })
            .populate("studentId")
            .populate("jobId")
            .populate("internshipId")
            .lean();

        const stats = {};
        students.forEach(s => {
            const branch = s.branch || "Not Specified";
            if (!stats[branch]) stats[branch] = { total: 0, placed: 0, interned: 0 };
            stats[branch].total += 1;
        });

        applications.forEach(app => {
            if (app.studentId && app.studentId.branch) {
                const branch = app.studentId.branch;
                if (!stats[branch]) stats[branch] = { total: 0, placed: 0, interned: 0 };
                if (app.jobId) stats[branch].placed += 1;
                if (app.internshipId) stats[branch].interned += 1;
            }
        });

        res.json(stats);
    } catch (err) { res.status(500).json({ error: "Failed to fetch stats" }); }
});

/* Profile Update */
app.put("/api/student/profile/:studentId", async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.studentId)) {
        return res.status(400).json({ error: "Invalid user session. Please logout and login again." });
    }
    try {
        const student = await Student.findByIdAndUpdate(
            req.params.studentId, 
            { $set: req.body }, 
            { new: true, runValidators: true }
        );
        res.json(student);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/* Resume Upload */
app.post("/api/student/upload-resume/:studentId", upload.single("resume"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        
        const resumeUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        await Student.findByIdAndUpdate(req.params.studentId, { $set: { resumeUrl } });
        res.json({ message: "Resume uploaded", resumeUrl });
    } catch (err) {
        res.status(500).json({ error: "Upload failed" });
    }
});

/* Photo Upload */
app.post("/api/student/upload-photo/:studentId", upload.single("photo"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        
        const profilePhoto = `http://localhost:5000/uploads/${req.file.filename}`;
        await Student.findByIdAndUpdate(req.params.studentId, { $set: { profilePhoto } });
        res.json({ message: "Photo uploaded", profilePhoto });
    } catch (err) {
        res.status(500).json({ error: "Upload failed" });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});