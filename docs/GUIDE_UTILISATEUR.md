# GUIDE UTILISATEUR - PLATEFORME RH OLYMPIA

## 📚 Table des Matières
1. [Connexion](#connexion)
2. [Gestion Employés](#gestion-employés)
3. [Présence Biométrique](#présence-biométrique)
4. [Heures Supplémentaires](#heures-supplémentaires)
5. [Congés](#congés)
6. [Paie](#paie)
7. [Déclarations Légales](#déclarations-légales)

---

## 🔐 Connexion

### Administrateur
- **URL:** http://localhost:3000
- **Email:** admin@olympia-hr.tn
- **Mot de passe:** Voir avec votre administrateur

### Employé (Mobile)
- Télécharger Expo Go sur Play Store/App Store
- Scanner QR code fourni par l'administrateur
- Se connecter avec email professionnel

---

## 👥 Gestion Employés

### Créer un Employé
1. Menu → **Employés** → **Ajouter Employé**
2. Remplir formulaire:
   - Nom, Prénom, Email **obligatoires**
   - CIN (8 chiffres)
   - Département, Poste
   - Salaire brut
   - Type contrat (CDI, CDD, SIVP, KARAMA)
   - Date d'embauche
3. **Documents:**
   - CIN, Contrat, CV, Diplômes
   - Upload PDF/JPG max 5 MB

### Modifier un Employé
1. Liste employés → Cliquer sur ligne
2. Modifier infos
3. **Sauvegarder**

### Archiver un Employé
- Bouton **Archiver** → Statut = "inactive"
- Restera dans base de données (soft delete)

---

## ⏰ Présence Biométrique

### Check-in/Check-out Mobile
1. Ouvrir app mobile
2. Bouton **Check-in**
3. Autoriser caméra + localisation
4. Prendre photo visage
5. ✅ Confirmer

**Anti-fraude:**
- Localisation vérifiée (rayon 500m du lieu de travail)
- Photo obligatoire
- 1 seul check-in par jour

### Visualiser Présence (Admin)
- Menu → **Présence**
- Filtres: Date, Employé, Statut (présent, retard, absent)
- Export Excel disponible

---

## 🕐 Heures Supplémentaires

### Créer Demande HS
1. Menu → **Heures Sup** → **Nouvelle Demande**
2. Sélectionner:
   - Employé
   - Date
   - Nombre d'heures (max 12h/jour)
   - **Taux:**
     - 125%: Heures normales supplémentaires
     - 150%: Nuit, Dimanche
     - 200%: Jours fériés
   - Raison (obligatoire)
3. **Créer**

### Approuver/Rejeter (Manager/Admin)
1. Liste HS → Filtrer "En attente"
2. Cliquer ✅ **Approuver** ou ❌ **Rejeter**
3. Si rejet: Indiquer raison

**Important:**
- Seules les HS **approuvées** sont incluses dans la paie
- Montant calculé automatiquement selon salaire de base

---

## 🏖️ Congés

### Demander Congé (Employé)
1. App Mobile → **Demander Congé**
2. Choisir type:
   - Annuel (25 jours/an)
   - Maladie (justificatif requis)
   - Maternité (90 jours)
   - Sans solde
3. Dates début/fin
4. Upload justificatif si maladie
5. **Soumettre**

### Approuver Congé (Manager/Admin)
1. Web Admin → **Congés** → Filtre "En attente"
2. Vérifier solde employé
3. **Approuver** ou **Rejeter**

### Consulter Solde
- Mobile: Page **Profil** → Solde congés
- Web: Fiche employé → Onglet "Congés"

---

## 💰 Paie

### Générer Paie Mensuelle (Admin uniquement)
1. Menu → **Paie** → **Générer Paie**
2. Sélectionner mois (format: 2025-12)
3. **Générer** pour tous les employés actifs

**Calculs automatiques:**
- ✅ Heures supplémentaires approuvées  
- ✅ Primes (ancienneté, assiduité)
- ✅ CNSS (9.18%)
- ✅ IRPP 2025 (8 tranches progressives)
- ✅ CSS (0.5% de l'IRPP)
- ✅ Déductions absences

### Télécharger Bulletin (Employé)
- Mobile → **Mes Bulletins**
- Cliquer sur mois → **Télécharger PDF**

### Télécharger Bulletin (Admin)
- Web → **Paie** → Ligne employé → **PDF**

### Envoyer par Email
- Bouton **Envoyer Email** (nécessite config SMTP)

---

## 📄 Déclarations Légales

### Bordereau CNSS Mensuel
1. Menu → **Déclarations Légales**
2. Carte **CNSS** → Sélectionner mois
3. **Télécharger Excel**

**Contenu:**
- Liste tous employés
- Salaires bruts
- CNSS employé (9.18%) + employeur (16.57%)
- Total à payer

### Déclaration IR Annuelle
1. Carte **IR Annuel** → Sélectionner année
2. **Télécharger Excel**

**Contenu:**
- Revenus annuels par employé
- IRPP retenu à la source
- Conforme loi finances 2025

### Attestation de Travail
1. Carte **Attestation** → Entrer ID employé
2. **Télécharger PDF**

**Contenu:**
- Identité employé
- Poste, département
- Date embauche, ancienneté
- Cachet entreprise

### Certificat de Salaire
1. Carte **Certificat Salaire** → Entrer ID employé
2. **Télécharger PDF**

**Contenu:**
- Salaire net moyen 3 derniers mois
- Détail mensuel
- Signature employeur

---

## 🔍 Recherche & Filtres

Toutes les listes supportent:
- 🔎 Recherche par nom, email, matricule
- 📅 Filtres par date, département, statut
- 📊 Export Excel/CSV

---

## ❓ Questions Fréquentes

**Q: Comment récupérer mon mot de passe ?**  
R: Bouton "Mot de passe oublié" → Email avec lien reset (si SMTP configuré)

**Q: Pourquoi mon check-in est refusé ?**  
R: Vérifier localisation (rayon 500m) et autoriser caméra

**Q: Les heures sup non approuvées sont-elles payées ?**  
R: Non, seulement les HS **approuvées** sont incluses dans la paie

**Q: Comment calculer mon IRPP ?**  
R: Automatique selon barème 2025 (8 tranches 0% à 40%)

---

## 📞 Support

En cas de problème:
1. Vérifier connexion internet
2. Recharger la page (web) / Redémarrer app (mobile)
3. Contacter administrateur système

**Contact:** support@olympia-hr.tn
