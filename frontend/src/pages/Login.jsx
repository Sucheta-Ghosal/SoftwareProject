import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState("student");
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        password: "",
        email: "",
        phoneNumber: "",
        companyName: ""
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            if (isLogin) {
                const res = await axios.post("http://localhost:5000/api/login", {
                    username: formData.username,
                    password: formData.password
                });
                localStorage.setItem("token", res.data.token);
                localStorage.setItem("role", res.data.role);
                if (res.data.role === "student") localStorage.setItem("studentId", res.data.id);
                if (res.data.role === "recruiter") localStorage.setItem("recruiterId", res.data.id);
                
                if (res.data.role === "admin") navigate("/admin");
                else if (res.data.role === "recruiter") navigate("/recruiter");
                else navigate("/student");
            } else {
                // Frontend validation
                const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
                if (!emailRegex.test(formData.email)) {
                    setError("Please enter a valid email address.");
                    return;
                }
                if (formData.phoneNumber && !/^\d{10}$/.test(formData.phoneNumber)) {
                    setError("Phone number must be exactly 10 digits.");
                    return;
                }

                const endpoint = role === "student" ? "students" : "recruiters";
                await axios.post(`http://localhost:5000/api/${endpoint}`, {
                    ...formData,
                    role: role
                });
                setSuccess(`${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully! Please login.`);
                setIsLogin(true);
            }
        } catch (err) {
            setError(err.response?.data?.error || "Operation failed. Please try again.");
        }
    };

    return (
        <div className="glass-card auth-container">
            <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
            <p className="subtitle">{isLogin ? "Login to access your dashboard" : "Join our platform today"}</p>
            
            <form onSubmit={handleSubmit}>
                {!isLogin && (
                    <>
                        <div className="role-selector">
                            <button 
                                type="button"
                                className={role === "student" ? "active" : ""} 
                                onClick={() => setRole("student")}
                            >Student</button>
                            <button 
                                type="button"
                                className={role === "recruiter" ? "active" : ""} 
                                onClick={() => setRole("recruiter")}
                            >Recruiter</button>
                        </div>
                        <input name="name" placeholder="Full Name" onChange={handleChange} required />
                        <input name="email" type="email" placeholder="Email Address" onChange={handleChange} required />
                        <input name="phoneNumber" placeholder="Phone Number (Optional)" onChange={handleChange} />
                        {role === "recruiter" && (
                            <input name="companyName" placeholder="Official Company Name" onChange={handleChange} required />
                        )}
                    </>
                )}
                
                <input name="username" placeholder="Username" onChange={handleChange} required />
                <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
                
                <button type="submit" className="main-btn">
                    {isLogin ? "Login" : "Sign Up"}
                </button>
            </form>

            <p className="toggle-text">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <span onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? " Sign Up" : " Login"}
                </span>
            </p>

            {error && <p className="error-msg">{error}</p>}
            {success && <p className="success-msg">{success}</p>}
        </div>
    );
};

export default Login;
