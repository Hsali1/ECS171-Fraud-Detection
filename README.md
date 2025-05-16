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
| **ROC-AUC** | **0.855** | 0.5 = random, 1.0 = perfect. Our model ranks a random fraud higher than a random legit **85 %** of the time. |
| **PR-AUC**  | **0.118** | The fraud prevalence is 1 %; random PR-AUC ≈ 0.01. We’re **~10× better than random** at pushing frauds toward the top. |
| **Chosen threshold** | **0.343** | Any score ≥ 0.343 is flagged as fraud (picked to maximise **F₂** → recall-oriented). |
| **Recall (𝑦 = fraud)** | **38.9 %** | We catch ~4 in 10 frauds. |
| **Precision (𝑦 = fraud)** | **10.5 %** | About 1 in 10 alerts are true fraud; the rest are false positives. |
| **False-positive rate** | **3.7 %** | Legit cases incorrectly flagged. |

### Confusion-matrix snapshot

|  | **Predicted legit** | **Predicted fraud** |
|---|--------------------|---------------------|
| **Actual legit** | **190 509** | 7 285 |
| **Actual fraud** | 1 347 | **859** |

---

## 2. Is this “good”?  

* **Recall 38 %** and **precision 10 %** are typical starter numbers in many lending / e-commerce fraud stacks.  
* Whether it’s *acceptable* depends on operational cost:  
  * If missing fraud is more expensive than reviewing extra cases → **lower the threshold** (gain recall, lose precision).  
  * If analyst time is scarce → **raise the threshold** (lose recall, gain precision).  

---

## 3. Quick threshold what-if simulation

Run this snippet to see the trade-off at other cut-offs:

```python
for thr in [0.25, 0.30, 0.40, 0.50]:
    y_alt = (y_prob >= thr).astype(int)
    tp = (y_alt & y_test).sum()
    fp = (y_alt & ~y_test).sum()
    fn = (~y_alt & y_test).sum()
    precision = tp / (tp + fp + 1e-9)
    recall    = tp / (tp + fn + 1e-9)
    print(f"thr={thr:>4}  precision={precision:5.3f}  recall={recall:5.3f}")
