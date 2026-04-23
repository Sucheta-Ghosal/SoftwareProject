import { useState, useEffect } from "react";
import axios from "axios";
import "./AdminPage.css";

const AdminPage = () => {
    const [activeTab, setActiveTab] = useState("recruiters");
    const [recruiters, setRecruiters] = useState([]);
    const [stats, setStats] = useState({});
    const [detailedRecruiters, setDetailedRecruiters] = useState([]);
    const [selectedRecruiter, setSelectedRecruiter] = useState(null);
    const [selectedPosting, setSelectedPosting] = useState(null);
    const [trackingSubTab, setTrackingSubTab] = useState("shortlisted");
    const [postingApplicants, setPostingApplicants] = useState([]);

    useEffect(() => {
        fetchRecruiters();
        fetchStats();
        fetchDetailedRecruiters();
    }, []);

    const fetchRecruiters = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/admin/recruiters");
            setRecruiters(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/admin/stats/branch-wise");
            setStats(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchDetailedRecruiters = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/admin/recruiters-detailed");
            setDetailedRecruiters(res.data);
        } catch (err) { console.error(err); }
    };

    const updateStatus = async (id, newStatus) => {
        console.log("Updating status for:", id, "to:", newStatus);
        try {
            const res = await axios.patch(`http://localhost:5000/api/admin/recruiters/${id}/status`, { status: newStatus });
            console.log("Response:", res.data);
            setRecruiters(recruiters.map(r => r._id === id ? { ...r, status: newStatus } : r));
        } catch (err) { 
            console.error("Update failed:", err.response?.data || err.message); 
        }
    };

    const handleSelectPosting = async (post) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/applications/posting/${post._id}`);
            setPostingApplicants(res.data);
            setSelectedPosting(post);
        } catch (err) { console.error(err); }
    };

    return (
        <div className="admin-wrapper">
            <nav className="dashboard-nav glass-card">
                <div className="nav-brand">Admin Command Center</div>
                <div className="nav-links">
                    <button className={activeTab === "recruiters" ? "active" : ""} onClick={() => setActiveTab("recruiters")}>Recruiters</button>
                    <button className={activeTab === "tracking" ? "active" : ""} onClick={() => setActiveTab("tracking")}>Shortlist Tracking</button>
                    <button className={activeTab === "stats" ? "active" : ""} onClick={() => setActiveTab("stats")}>Statistics</button>
                    <button className="logout-btn" onClick={() => { localStorage.clear(); window.location.href = "/"; }}>Logout</button>
                </div>
            </nav>

            <main className="dashboard-main">
                {activeTab === "recruiters" && (
                    <div className="admin-section">
                        <div className="section-header"><h2>Recruiter Verification</h2></div>
                        <div className="list-grid">
                            {recruiters.map(r => (
                                <div key={r._id} className="glass-card recruiter-card">
                                    <div className="rec-info">
                                        <h3>{r.companyName}</h3>
                                        <p>{r.username} • {r.email}</p>
                                    </div>
                                    <div className="rec-actions">
                                        <span className={`status-tag ${r.status.toLowerCase()}`}>
                                            {r.status || "Pending"}
                                        </span>
                                        {r.status === "Pending" && (
                                            <div className="button-group">
                                                <button className="action-btn approve" onClick={() => updateStatus(r._id, "Approved")}>Approve</button>
                                                <button className="action-btn reject" onClick={() => updateStatus(r._id, "Rejected")}>Reject</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "tracking" && (
                    <div className="tracking-section">
                        {!selectedPosting ? (
                            <div className="tracking-grid">
                                <div className="tracking-column glass-card">
                                    <h3>Recruiters</h3>
                                    <div className="scroll-list">
                                        {detailedRecruiters.map(r => (
                                            <div 
                                                key={r._id} 
                                                className={`list-item ${selectedRecruiter?._id === r._id ? "active" : ""}`}
                                                onClick={() => { setSelectedRecruiter(r); setSelectedPosting(null); }}
                                            >
                                                {r.companyName}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="tracking-column glass-card">
                                    <h3>Openings</h3>
                                    <div className="scroll-list">
                                        {selectedRecruiter ? (
                                            <>
                                                {[...selectedRecruiter.jobs, ...selectedRecruiter.internships].map(post => (
                                                    <div key={post._id} className="list-item" onClick={() => handleSelectPosting(post)}>
                                                        {post.position} ({post.salary ? "Job" : "Internship"})
                                                    </div>
                                                ))}
                                            </>
                                        ) : <p className="hint">Select a recruiter to view posts</p>}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="applicants-detail glass-card">
                                <div className="detail-header">
                                    <button className="back-btn" onClick={() => setSelectedPosting(null)}>← Back to List</button>
                                    <h2>{selectedPosting.position} at {selectedRecruiter.companyName}</h2>
                                </div>
                                <div className="tabs-mini">
                                    <button className={trackingSubTab === "shortlisted" ? "active" : ""} onClick={() => setTrackingSubTab("shortlisted")}>Shortlisted / Selected</button>
                                    <button className={trackingSubTab === "rejected" ? "active" : ""} onClick={() => setTrackingSubTab("rejected")}>Rejected</button>
                                </div>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Student Name</th>
                                            <th>Branch</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {postingApplicants
                                            .filter(app => trackingSubTab === "shortlisted" ? (app.status === "Shortlisted" || app.status === "Selected") : app.status === "Rejected")
                                            .map(app => (
                                                <tr key={app._id}>
                                                    <td>{app.studentId.name}</td>
                                                    <td>{app.studentId.branch}</td>
                                                    <td><span className={`status-pill ${app.status.toLowerCase()}`}>{app.status}</span></td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "stats" && (
                    <div className="stats-section">
                        <div className="section-header"><h2>Placement & Internship Statistics</h2></div>
                        <div className="glass-card stats-card">
                            <table className="stats-table">
                                <thead>
                                    <tr>
                                        <th>Branch</th>
                                        <th>Total Students</th>
                                        <th>Placed</th>
                                        <th>Placement %</th>
                                        <th>Interns</th>
                                        <th>Internship %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(stats).map(([branch, data]) => (
                                        <tr key={branch}>
                                            <td><strong>{branch}</strong></td>
                                            <td>{data.total}</td>
                                            <td>{data.placed}</td>
                                            <td className="placed-cell">{((data.placed / data.total) * 100).toFixed(1)}%</td>
                                            <td>{data.interned}</td>
                                            <td className="intern-cell">{((data.interned / data.total) * 100).toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminPage;
