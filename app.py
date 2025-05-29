"""
app.py  –  Tiny REST API that wraps fraud_detector_v1.joblib
Run with:  python app.py
Then POST JSON to http://localhost:5000/predict
"""

# ─── top of app.py ──────────────────────────────────────────
from flask import Flask, request, jsonify, send_file   # ← send_file added
import pandas as pd
import joblib
import traceback
from io import StringIO
import tempfile
# ────────────────────────────────────────────────────────────


# ────────────────────────────────────────────────────────────
# 1. Load the trained pipeline exactly once, at startup
#    (contains preprocessing + HistGB model)
# ────────────────────────────────────────────────────────────
MODEL_PATH = "fraud_detector_v1.joblib"
pipe = joblib.load(MODEL_PATH)

# Optional: decide here which threshold counts as "fraud"
THRESHOLD = 0.343      # value we chose with the F2 criterion

app = Flask(__name__)

# added cors for api call 
from flask_cors import CORS 
CORS(app)

# ────────────────────────────────────────────────────────────
# 2. Simple health check endpoint
# ────────────────────────────────────────────────────────────
@app.route("/ping", methods=["GET"])
def ping():
    return {"status": "OK"}, 200


# ────────────────────────────────────────────────────────────
# 3. Prediction endpoint
#    Expects: JSON body describing **one** application
# ────────────────────────────────────────────────────────────
@app.route("/predict", methods=["POST"])
def predict():
    try:
        payload = request.get_json(force=True)  # raises 400 if body is not JSON

        # Build single-row DataFrame; columns can arrive in any order
        df_in = pd.DataFrame([payload])

        # Predict probability
        prob = pipe.predict_proba(df_in)[0, 1]

        # Convert to hard label using the chosen threshold
        label = int(prob >= THRESHOLD)

        return jsonify({
            "fraud_probability": round(float(prob), 6),
            "fraud_label": label,
            "threshold": THRESHOLD
        })

    except Exception as e:
        # Log the stack trace for debugging, but return safe message to caller
        traceback.print_exc()
        return jsonify({"error": str(e)}), 400


# ───────────────────────────────────────────────────────────
# POST /predict_csv   –   upload a CSV, get back predictions
# ───────────────────────────────────────────────────────────
@app.route("/predict_csv", methods=["POST"])
def predict_csv():
    """
    Expect: multipart/form-data with a file field called 'file'
            OR raw text/csv in the body with header line
    Return: JSON list of probabilities, OR a new CSV with an extra column
    """
    try:
        # ---- 1. Read the incoming CSV into a DataFrame ----
        if 'file' in request.files:                      # multipart upload
            file_obj = request.files['file']
            df_in = pd.read_csv(file_obj)
        else:                                            # raw text body
            csv_text = request.data.decode("utf-8")
            df_in = pd.read_csv(StringIO(csv_text))

        # ---- 2. Predict probabilities for the whole frame ----
        probs = pipe.predict_proba(df_in)[:, 1]
        df_out = df_in.copy()
        df_out["fraud_probability"] = probs
        df_out["fraud_label"] = (probs >= THRESHOLD).astype(int)

        # ---- 3. Stream back a new CSV (easy to load in Excel) ----
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".csv")
        df_out.to_csv(tmp.name, index=False)
        return send_file(tmp.name,
                         mimetype="text/csv",
                         download_name="scored_transactions.csv",
                         as_attachment=True)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 400

# ────────────────────────────────────────────────────────────
# 4. Launch the Flask development server
# ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # WARNING: dev-only; use gunicorn/uwsgi in production
    app.run(host="0.0.0.0", port=5000, debug=False)
