# GUIDE UTILISATEUR - PLATEFORME GRACE
## Gestion de Patrimoine Immobilier & Audit Stratégique

Ce document présente l'intégralité des fonctionnalités de la solution **GRACE**, conçue pour la gestion optimisée des centres commerciaux et complexes immobiliers.

---

### 1. TABLEAU DE BORD (DASHBOARD)
Véritable tour de contrôle de votre patrimoine, le Dashboard offre une vision en temps réel :
*   **Indicateurs Clés (KPIs)** : Chiffre d'affaires mensuel, taux d'occupation global, croissance de la trésorerie et volume des charges.
*   **Flux Financiers** : Graphiques comparatifs des revenus vs dépenses.
*   **Alertes Flux** : Notifications intelligentes sur les contrats arrivant à échéance ou les incidents de maintenance.

### 2. GESTION DU PATRIMOINE (CENTRES)
L'application utilise une architecture hiérarchique à trois niveaux :
1.  **Centres Commerciaux** : Gestion des pôles géographiques.
2.  **Immeubles (Buildings)** : Segmentation structurelle au sein d'un centre.
3.  **Unités Locatives** : Boutiques ou bureaux individuels.
    *   *Fonctionnalité clé* : Suivi précis des statuts (Libre, Occupé, Maintenance) avec compteurs visuels.

### 3. RÉPÉRTOIRE DES LOCATAIRES
Centralisation des dossiers preneurs :
*   **Profils** : Distinction entre comptes particuliers et entreprises.
*   **Données Financières** : Fixation du loyer mensuel par défaut pour chaque locataire.
*   **Historique** : Accès direct aux détails et contrats associés.

### 4. GESTION DES BAUX (CONTRATS)
Le module de contrats intègre une logique de validation métier stricte :
*   **Sélection Intelligente** : Lors de la création d'un contrat, le système ne suggère que les unités **libres** appartenant au centre commercial sélectionné.
*   **Validations Automatiques** : Empêche l'enregistrement si les dates sont incohérentes (date de fin avant début) ou si les montants sont négatifs.
*   **Cycle de Vie** : Gestion de la résiliation (libération automatique de l'unité).

### 5. FINANCE & FACTURATION
*   **Paiements (Payments)** : Enregistrement des quittances et suivi des encaissements.
*   **Dépenses (Expenses)** : Comptabilisation des charges (Maintenance, Sécurité, Électricité) pour le calcul du profit net.
*   **Documents** : Module de rapports et facturation (Invoices) pour l'audit.

### 6. MAINTENANCE TECHNIQUE
*   **Tickets** : Création de demandes d'intervention pour les unités dégradées.
*   **États** : Suivi de l'évolution des travaux jusqu'à la remise en service des actifs.

### 7. ANALYTICS & DATA LAKEHOUSE
*   **Convergence des Données** : Module "Data Storage" expliquant l'architecture hybride de stockage.
*   **Analyses Pro** : Visualisations graphiques avancées pour la prise de décision stratégique.

### 8. PARAMÈTRES SYSTÈME
Section regroupant les configurations globales :
*   **Personnalisation** : Création de nouveaux statuts d'unités avec codes couleurs personnalisés.
*   **Interface** : Activation/Désactivation de modules (Maintenance, Comptage).
*   **Sécurité** : Outils d'exportation/importation de la base de données locale (Backup JSON).

---
*Document généré pour l'administration de GRACE - Audit & Patrimoine.*
