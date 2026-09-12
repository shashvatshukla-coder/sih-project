import pandas as pd
from pathlib import Path

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib


# Load dataset
data_path = Path(
    "data/processed/ghaziabad/ml_training_dataset.csv"
)

df = pd.read_csv(data_path)


# Features
X = df[
    [
        "lulc_2005",
        "slope",
        "road_distance"
    ]
]

y = df["lulc_2011"]
# Target
y = df["lulc_2015"]


# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)


# Random Forest
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    n_jobs=-1,
    class_weight="balanced"
)


print("Training model...")

model.fit(X_train, y_train)


# Prediction
y_pred = model.predict(X_test)


# Evaluation
accuracy = accuracy_score(y_test, y_pred)

print("\n=== MODEL RESULTS ===")
print("Accuracy:", accuracy)

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        y_pred,
        zero_division=0
    )
)


# Feature importance
print("\nFeature Importance:")

for feature, importance in zip(
    X.columns,
    model.feature_importances_
):
    print(
        f"{feature}: {importance:.4f}"
    )


# Save model
model_path = Path(
    "ml/models/lulc_random_forest.pkl"
)

model_path.parent.mkdir(
    parents=True,
    exist_ok=True
)

joblib.dump(model, model_path)

print(
    f"\nModel saved to: {model_path}"
)
