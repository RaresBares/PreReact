# Prereact — Medical Practice Management System

## English

**Prereact** is a modular **practice management system** for medical professionals.  
It integrates multiple services for **inventory tracking**, **billing**, and **appointment scheduling**, all within a unified, secure, and scalable architecture.

### Overview

Each module (inventory, scheduling, billing, authentication) is **fully containerized** and includes its own **frontend**, **backend**, and **database**.  
The system runs behind an **NGINX reverse proxy** with **automated SSL certification**, ensuring secure HTTPS communication for all services.

### Architecture

- **Frontend:** React, Bootstrap, Tailwind CSS, Vite, Node.js  
- **Backend:** FastAPI (Python)  
- **Databases:** PostgreSQL and MongoDB  
- **Proxy:** NGINX reverse proxy + automatic SSL (Certbot)  
- **Authentication:** Centralized service with token-based login and role management  
- **Deployment:** Docker / Docker Compose (fully modular per service)

### Features

- **Inventory Management System** — tracks medical supplies, stock levels, and consumption  
- **Billing System** — generates and manages invoices for patients and insurance  
- **Appointment Scheduler** — organizes patient bookings, staff availability, and daily planning  
- **Authentication Tool** — unified login across all modules with secure token validation  
- Automated SSL setup and renewal  
- Isolated databases and APIs for each subsystem

### Visual Overview

| Component | Screenshot |
|------------|-------------|
| **Inventory System** | ![Inventory System](images/inventory.png) |
| **Appointment Scheduling** | ![Appointment System](images/appointments.png) |
| **Main Dashboard** | ![Main Page](images/mainpage.png) |

---

## Deutsch

**Prereact** ist ein modulares **Praxisverwaltungssystem** für Ärztinnen und Ärzte.  
Es vereint **Inventur**, **Abrechnung** und **Terminvergabe** in einer sicheren, skalierbaren Umgebung.

### Übersicht

Jeder Dienst (Inventur, Terminplanung, Abrechnung, Authentifizierung) ist **vollständig dockerisiert** und besteht aus eigenem **Frontend**, **Backend** und **Datenbanksystem**.  
Ein **NGINX-Reverse-Proxy** mit **automatischer SSL-Zertifizierung** sorgt für verschlüsselte Verbindungen.

### Architektur

- **Frontend:** React, Bootstrap, Tailwind CSS, Vite, Node.js  
- **Backend:** FastAPI (Python)  
- **Datenbanken:** PostgreSQL und MongoDB  
- **Proxy:** NGINX (Reverse Proxy + automatische SSL-Erneuerung über Certbot)  
- **Authentifizierung:** Zentrales Tool mit Token-Login und Rollenverwaltung  
- **Deployment:** Docker / Docker Compose (modular je Service)

### Funktionen

- **Inventursystem** — Verwaltung medizinischer Bestände und Verbrauchsdaten  
- **Abrechnungssystem** — Erstellung und Verwaltung von Rechnungen  
- **Terminvergabesystem** — Planung von Patiententerminen und Praxisabläufen  
- **Authentifizierungsdienst** — Zentrales Login für alle Module  
- Vollautomatische SSL-Konfiguration und Zertifikatserneuerung  
- Separate Backends, Frontends und Datenbanken pro Modul

### Visuelle Darstellung

| Komponente | Screenshot |
|-------------|-------------|
| **Inventursystem** | ![Inventursystem](images/inventory.png) |
| **Terminvergabesystem** | ![Terminvergabesystem](images/appointments.png) |
| **Hauptseite** | ![Startseite](images/mainpage.png) |
