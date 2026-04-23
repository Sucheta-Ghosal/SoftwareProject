const testPatch = async () => {
    try {
        const id = "69e917fc8897814a58ec1d4d";
        const url = `http://localhost:5000/api/admin/recruiters/${id}/status`;
        console.log("Testing PATCH:", url);
        const res = await fetch(url, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Approved" })
        });
        console.log("Response Status:", res.status);
        const data = await res.json();
        console.log("Data:", data);
    } catch (err) {
        console.error("Failed:", err.message);
    }
};

testPatch();
