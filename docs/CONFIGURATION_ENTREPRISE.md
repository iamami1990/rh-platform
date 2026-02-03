## 🏢 Configuration Entreprise

Ce fichier contient les paramètres de configuration de votre entreprise pour la plateforme RH Olympia.

---

### Informations Générales

```javascript
{
  "company": {
    "name": "Votre Entreprise",
    "legal_name": "Votre Entreprise SARL",
    "tax_id": "123456789A",
    "cnss_id": "123456",
    "address": "123 Avenue Habib Bourguiba, Tunis",
    "postal_code": "1000",
    "city": "Tunis",
    "country": "Tunisie",
    "phone": "+216 71 123 456",
    "email": "contact@votre-entreprise.tn",
    "website": "https://www.votre-entreprise.tn"
  }
}
```

---

### Configuration Paie

```javascript
{
  "payroll_settings": {
    "currency": "TND",
    "working_days_per_month": 22,
    "working_hours_per_day": 8,
    "minimum_wage": 460.00,
    
    "social_contributions": {
      "cnss_employee_rate": 0.0918,
      "cnss_employer_rate": 0.1657,
      "css_rate": 0.005
    },
    
    "overtime_rates": {
      "normal": 1.25,
      "night_sunday": 1.50,
      "holiday": 2.00
    },
    
    "family_allowances": {
      "married": 300,
      "child": 100,
      "max_children": 4
    }
  }
}
```

---

### Configuration Congés

```javascript
{
  "leave_settings": {
    "annual_leave_days": 25,
    "sick_leave_days": 15,
    "maternity_leave_days": 90,
    "paternity_leave_days": 3,
    
    "accrual_method": "monthly",
    "carry_forward": true,
    "max_carry_forward_days": 10,
    
    "approval_workflow": {
      "auto_approve_threshold": 0,
      "requires_manager_approval": true,
      "requires_hr_approval": false
    }
  }
}
```

---

### Configuration Présence

```javascript
{
  "attendance_settings": {
    "require_biometric": true,
    "require_geolocation": true,
    "geofence_radius_meters": 500,
    
    "office_location": {
      "latitude": 36.8065,
      "longitude": 10.1815,
      "address": "123 Avenue Habib Bourguiba, Tunis"
    },
    
    "work_schedule": {
      "monday_friday": {
        "start": "08:00",
        "end": "17:00",
        "break_minutes": 60
      },
      "saturday": {
        "start": "08:00",
        "end": "13:00",
        "break_minutes": 0
      }
    },
    
    "late_tolerance_minutes": 15,
    "early_leave_tolerance_minutes": 15
  }
}
```

---

### Configuration Email

```javascript
{
  "email_settings": {
    "from_name": "RH Olympia",
    "from_email": "noreply@olympia-hr.tn",
    "reply_to": "rh@votre-entreprise.tn",
    
    "notifications": {
      "leave_approved": true,
      "leave_rejected": true,
      "payroll_generated": true,
      "overtime_approved": true,
      "sentiment_alert": true
    },
    
    "templates": {
      "language": "fr",
      "include_company_logo": true,
      "footer_text": "Cet email a été envoyé automatiquement par Olympia HR Platform"
    }
  }
}
```

---

### Configuration IA/ML

```javascript
{
  "ml_settings": {
    "enable_predictions": true,
    "sentiment_analysis_frequency": "monthly",
    "turnover_prediction_threshold": 0.7,
    
    "alerts": {
      "high_risk_employees": true,
      "notify_managers": true,
      "notify_hr": true
    },
    
    "data_retention_months": 24
  }
}
```

---

### Instructions d'Utilisation

#### Modifier la Configuration

1. Créer fichier `backend/config/company-settings.json`
2. Copier la configuration souhaitée
3. Adapter les valeurs à votre entreprise
4. Redémarrer le serveur backend

#### Exemple Complet

Voir fichier: `backend/config/company-settings.example.json`

#### Variables d'Environnement

Certains paramètres peuvent être surchargés via `.env`:

```env
COMPANY_NAME=Votre Entreprise
WORKING_DAYS_PER_MONTH=22
ANNUAL_LEAVE_DAYS=25
GEOFENCE_RADIUS=500
```

---

### Support

Pour toute question sur la configuration, consultez `CONFIG_GUIDE.md` ou contactez le support technique.

**Dernière mise à jour:** 30 Décembre 2025
