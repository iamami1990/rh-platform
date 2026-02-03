# Service ML Olympia HR

Service Python Flask pour prédictions ML en temps réel.

## Fonctionnalités

- **Analyse Sentiment:** Prédiction score satisfaction employé (0-5)
- **Prédiction Turnover:** Probabilité de départ employé
- **Batch Processing:** Prédictions multiples simultanées

## Installation

```bash
cd ml-service
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

## Démarrage

```bash
python app.py
# Service démarre sur http://localhost:5001
```

## Endpoints API

### Health Check
```
GET /health
```

### Prédiction Sentiment
```
POST /predict/sentiment
Content-Type: application/json

{
  "employee": {
    "salary_brut": 2000,
    "hireDate": "2020-01-15",
    "department": "IT",
    "attendance": {
      "rate": 0.95,
      "absences": 2,
      "late_days": 1
    },
    "performance": {
      "score": 4.2,
      "objectives": 0.85
    }
  }
}
```

Réponse:
```json
{
  "success": true,
  "sentiment_score": 4.15,
  "risk_level": "low",
  "message": "Employé satisfait et engagé"
}
```

### Prédiction Turnover
```
POST /predict/turnover
Content-Type: application/json

{
  "employee": { ... }
}
```

Réponse:
```json
{
  "success": true,
  "turnover_probability": 0.234,
  "turnover_percentage": 23.4,
  "risk_level": "low"
}
```

## Features Utilisées

1. **Salaire:** brut, net
2. **Ancienneté:** années de service
3. **Présence:** taux, absences, retards
4. **Performance:** score, objectifs
5. **Congés:** pris, maladie
6. **Heures sup:** total
7. **Démographiques:** âge, département, contrat

## Modèles

- **Sentiment:** XGBoost Regressor
- **Turnover:** XGBoost Classifier
- **Preprocessing:** Standard Scaler

Modèles entraînés dans `ml-training/train_sentiment_ml.py`

## Integration Backend

Le backend Olympia HR peut appeler ce service:

```javascript
const axios = require('axios');

const predictSentiment = async (employee) => {
  const response = await axios.post('http://localhost:5001/predict/sentiment', {
    employee
  });
  return response.data;
};
```

## Production

Pour déploiement production, utiliser Gunicorn:

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5001 app:app
```

Ou containeriser avec Docker.
