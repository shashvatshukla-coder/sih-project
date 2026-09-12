import pandas as pd
from pathlib import Path

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib


# Load dataset
data_path = Path(
    "data/processed/ghaziabad/ml_training_dataset.csv"
)

df = pd.read_csv(data_path)


def train_model(input_year, output_year, model_name):

    print(f"\n{'=' * 50}")
    print(f"Training {input_year} -> {output_year}")
    print(f"{'=' * 50}")

    X = df[
        [
            f"lulc_{input_year}",
            "slope",
            "road_distance"
        ]
    ]

    y = df[f"lulc_{output_year}"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=100,
        random_state=42,
        n_jobs=-1,
        class_weight="balanced"
    )

    print("Training...")

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)

    print(f"\nAccuracy: {accuracy:.4f}")

    print("\nClassification Report:")
    print(
        classification_report(
            y_test,
            y_pred,
            zero_division=0
        )
    )

    print("Feature Importance:")

    for feature, importance in zip(
        X.columns,
        model.feature_importances_
    ):
        print(
            f"{feature}: {importance:.4f}"
        )

    # Save separate model
    model_path = Path(
        f"ml/models/{model_name}.pkl"
    )

    model_path.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    joblib.dump(model, model_path)

    print(f"\nSaved: {model_path}")


# Train both historical transitions

train_model(
    "2005",
    "2011",
    "lulc_2005_to_2011"
)

train_model(
    "2011",
    "2015",
    "lulc_2011_to_2015"
)

print("\n=== BOTH MODELS CREATED ===")