function uploadCsv() {
    const fileInput = document.getElementById("csvFile");
    const file = fileInput.files[0];
    const messageEl = document.getElementById("message");

    if (!file) {
        alert("Please select a CSV file.");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    fetch("http://localhost:5000/predict_csv", {
        method: "POST",
        body: formData,
    })
        .then(res => res.blob())
        .then(blob => blob.text())
        .then(text => {
            Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                complete: function (result) {
                    const data = result.data;
                    if (data.length === 0) {
                        messageEl.textContent = "⚠️ No data found in CSV.";
                        messageEl.className = "text-red-600 mb-4";
                        messageEl.classList.remove("hidden");
                        return;
                    }

                    showPreview(data);
                    messageEl.textContent = "✅ CSV uploaded and predictions loaded.";
                    messageEl.className = "text-green-600 mb-4";
                    messageEl.classList.remove("hidden");
                },
            });
        })
        .catch(err => {
            console.error("Upload failed:", err);
            messageEl.textContent = "❌ Upload failed.";
            messageEl.className = "text-red-600 mb-4";
            messageEl.classList.remove("hidden");
        });
}

function showPreview(data) {
    const table = document.getElementById("previewTable");
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");

    thead.innerHTML = "";
    tbody.innerHTML = "";

    const headers = Object.keys(data[0]);

    // Create table head
    const headRow = document.createElement("tr");
    headers.forEach(h => {
        const th = document.createElement("th");
        th.textContent = h.replace(/_/g, " ");
        th.className = "p-2 border text-left";
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);

    // Fill table body
    data.forEach(row => {
        const tr = document.createElement("tr");
        const isFraud = row.fraud_label == 1;

        tr.className = isFraud ? "bg-red-100" : "";

        headers.forEach(h => {
            const td = document.createElement("td");
            let value = row[h];

            // Format float values
            if (h === "fraud_probability" || h === "threshold") {
                value = parseFloat(value).toFixed(3);
            }

            td.textContent = value;
            td.className = "p-2 border";

            // Highlight fraud label
            if (h === "fraud_label" && isFraud) {
                td.classList.add("text-red-600", "font-bold");
            }

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    table.classList.remove("hidden");
}
