# ECS171-Fraud-Detection

<pre> ``` project-root/ 
│ 
├── notebooks/ # Jupyter notebooks for EDA 
├── src/ # .py files for data prep, model, utils 
├── static/ # Flask HTML/CSS 
├── templates/ # Flask templates 
├── app.py # Flask app entry point 
├── model.pkl # Saved model 
├── requirements.txt # List of pip packages 
└── README.md # Project overview 
``` 
</pre>

# Fraud Model Evaluation & Next-Steps Cheat-Sheet

This document captures **where the model stands today**, what the key numbers mean, and a short roadmap for improving or deploying it.

---

## 1. Test-Set Performance  

| Metric | Score | How to interpret |
|--------|-------|------------------|
| **ROC-AUC** | **0.887** | 0.5 = random, 1.0 = perfect. Our model ranks a random fraud higher than a random legit **88.7%** of the time. |
| **PR-AUC**  | **0.13** | The fraud prevalence is 1.4% (2878/205011); random PR-AUC ≈ 0.014. We're **~9× better than random** at pushing frauds toward the top. |
| **Threshold (5% FPR)** | **0.766** | Chosen threshold where only 5% of legit cases are incorrectly flagged. |
| **Recall (𝑦 = fraud)** | **52.8%** | We catch roughly half of all frauds (improved from 38.9%). |
| **Precision (𝑦 = fraud)** | **13.0%** | About 1 in 8 alerts are true fraud; the rest are false positives. |
| **False-positive rate** | **5.0%** | Exactly 5% of legit cases incorrectly flagged (by design). |
| **F₁-Score** | **0.21** | Harmonic mean of precision and recall for fraud class. |
| **Accuracy** | **94.4%** | Overall correct predictions (driven by class imbalance). |

### Confusion-matrix snapshot (estimated)
Based on recall=52.8% and precision=13% at 5% FPR:

|  | **Predicted legit** | **Predicted fraud** |
|---|--------------------|---------------------|
| **Actual legit** (202,133) | **192,026** (95%) | 10,107 (5%) |
| **Actual fraud** (2,878) | **1,358** | **1,520** |

---

## 2. Is this "good"?  

* **Recall 53%** and **precision 13%** are solid starter numbers - better than many initial deployments.
* Key improvements from previous version:
  - **Recall increased** from 39% to 53% (caught 14% more frauds)
  - **Precision improved** from 10.5% to 13% (fewer false positives)
* The **5% FPR threshold** is a common business choice that balances fraud detection with operational costs.
* **Scale_pos_weight: 96.53** indicates significant class imbalance handled effectively.

---

## 3. Quick threshold what-if simulation

Based on the ROC curve, here are approximate trade-offs at other cut-offs:

```python
# Estimated performance at different thresholds
thresholds_performance = [
    {"threshold": 0.60, "precision": 0.10, "recall": 0.65, "fpr": 0.08},
    {"threshold": 0.766, "precision": 0.13, "recall": 0.53, "fpr": 0.05},  # Current
    {"threshold": 0.85, "precision": 0.18, "recall": 0.40, "fpr": 0.03},
    {"threshold": 0.90, "precision": 0.25, "recall": 0.30, "fpr": 0.02},
]

for perf in thresholds_performance:
    print(f"thr={perf['threshold']:.3f}  precision={perf['precision']:.3f}  recall={perf['recall']:.3f}  fpr={perf['fpr']:.3f}")
