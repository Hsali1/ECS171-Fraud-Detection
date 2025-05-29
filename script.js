document.getElementById("fraudForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Convert strings to numbers where applicable
    for (let key in data) {
        const num = parseFloat(data[key]);
        if (!isNaN(num)) data[key] = num;
    }

    try {
        const res = await fetch("http://localhost:5000/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const resultElement = document.getElementById("result");
        resultElement.classList.remove("hidden");

        if (res.ok) {
            const result = await res.json();
            const prob = (result.fraud_probability * 100).toFixed(2);
            const threshold = result.threshold.toFixed(2);
            const isFraud = result.fraud_label === 1;

            resultElement.innerHTML = `
          ✅ <strong>${isFraud ? "Fraudulent" : "Not Fraudulent"}</strong><br />
          Probability: <strong>${prob}%</strong><br />
          Threshold: <strong>${threshold}</strong>
        `;

            resultElement.className = isFraud
                ? "text-red-600 mt-4 text-center font-semibold"
                : "text-green-600 mt-4 text-center font-semibold";

        } else {
            resultElement.textContent = "❌ Prediction failed.";
            resultElement.className = "text-red-600 mt-4 text-center";
        }
    } catch (err) {
        console.error(err);
        alert("Something went wrong.");
    }
});
