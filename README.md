# Prereact — Medical Practice Management System

## English

**Prereact** is a modular **practice management system** designed for medical professionals.  
It integrates multiple core services to support **inventory tracking**, **billing**, and **appointment scheduling** within a unified platform.

### Overview

Each service (inventory, scheduling, billing, authentication) is fully **dockerized** and includes its own **frontend**, **backend**, and **database** component.

The system runs behind an **NGINX reverse proxy** and uses an **automated SSL certification service** for secure communication.

### Architecture

- **Frontend:** React  
- **Backend:** Node.js / Express  
- **Databases:** PostgreSQL and MongoDB  
- **Proxy:** NGINX (reverse proxy + SSL automation via Certbot)  
- **Auth Service:** Centralized authentication and role-based access control  
- **Deployment:** Fully containerized (Docker, Docker Compose)

### Features

- Inventory management system for tracking medical supplies  
- Billing and invoice generation tools  
- Appointment scheduling interface with real-time updates  
- Unified authentication across all modules  
- Separate backend, frontend, and database per service  
- Secure HTTPS setup with automated certificate renewal

### Visual Overview

- **Inventory System:** Tracks stock and supply flow  
- **Appointment Scheduler:** Manages patient bookings and calendars  
- **Main Page:** Central dashboard integrating all services

---

## Deutsch

**Prereact** ist ein modulares **Praxisverwaltungssystem** für Ärztinnen und Ärzte.  
Es kombiniert **Inventur**, **Abrechnung** und **Terminvergabe** in einer einheitlichen Umgebung.

### Übersicht

Jeder Dienst (Inventur, Terminvergabe, Abrechnung, Authentifizierung) ist vollständig **dockerisiert** und besitzt ein eigenes **Frontend**, **Backend** und eine **Datenbank**.

Das System läuft hinter einem **NGINX-Reverse-Proxy** mit einem **automatisierten SSL-Zertifizierungsdienst** für sichere Kommunikation.

### Architektur

- **Frontend:** React  
- **Backend:** Node.js / Express  
- **Datenbanken:** PostgreSQL und MongoDB  
- **Proxy:** NGINX (Reverse Proxy + automatische SSL-Zertifizierung über Certbot)  
- **Auth Service:** Zentrales Authentifizierungs- und Rollenmanagement  
- **Deployment:** Komplett containerisiert mit Docker / Docker Compose

### Funktionen

- Inventur- und Lagerverwaltung medizinischer Materialien  
- Abrechnungssystem für Rechnungen und Belege  
- Terminvergabesystem mit Echtzeit-Übersicht  
- Zentrale Authentifizierung über alle Module hinweg  
- Eigenständige Backend-, Frontend- und Datenbankschichten je Service  
- HTTPS durch automatisierte SSL-Erneuerung

### Visuelle Darstellung

- **Inventursystem:** Überblick über Bestände und Materialfluss  
- **Terminvergabesystem:** Verwaltung von Patienten- und Terminplänen  
- **Startseite:** Zentrales Dashboard aller Dienste
