# Instagram Clone - Microservices Architecture

Ovo je moderna, skalabilna replika Instagrama izgrađena pomoću mikroservisne arhitekture. Projekat je podeljen na nezavisne servise koji komuniciraju preko API Gateway-a.

## 🏗️ Arhitektura sistema

Sistem se sastoji od sledećih komponenti:

| Servis | Port | Opis |
| :--- | :--- | :--- |
| **API Gateway** | `3000` | Ulazna tačka za sve klijentske zahteve. Vrši proxy-ovanje ka mikroservisima. |
| **Auth Service** | `3001` | Upravljanje korisnicima, registracija, login (JWT) i profili. |
| **Post Service** | `3002` | Kreiranje objava, upload medija i upravljanje sadržajem. |
| **Interaction Service** | `3003` | Lajkovi, komentari i brojači interakcija. |
| **React Frontend** | `3004` | Korisnički interfejs (podešen na port 3004). |

## 🚀 Tehnologije

- **Backend:** Node.js, Express.js
- **Frontend:** React, React Bootstrap, React Router
- **Baza podataka:** PostgreSQL
- **Testiranje:** Jest, Supertest (Unit/Integration), Cypress (E2E)
- **Komunikacija:** REST API, HTTP Proxy

## 🛠️ Instalacija i Podešavanje

### 1. Preduslovi
- Instaliran [Node.js](https://nodejs.org/) (20.18.1)
- Instaliran [PostgreSQL](https://www.postgresql.org/) (lokalno ili preko Dockera)

### 2. Kloniranje i instalacija zavisnosti
Iz korena projekta pokrenite komandu koja će instalirati zavisnosti za sve servise i frontend:
```bash
npm run install-all
```

### 3. Detaljna konfiguracija baze podataka

Svaki mikroservis je nezavisan i poseduje sopstvenu konfiguraciju za povezivanje sa PostgreSQL bazom preko varijable `DATABASE_URL` u `.env` fajlu.

#### Format konekcionog stringa:
```text
postgres://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE_NAME>
```
*Primer:* `postgres://nikola:lozinka123@localhost:5432/instagram_auth`

#### Gde se nalaze .env fajlovi?
Morate kreirati ili urediti `.env` fajl u svakom od sledećih direktorijuma:
- `microservices/auth-service/.env`
- `microservices/post-service/.env`
- `microservices/interaction-service/.env`

#### Primer sadržaja .env fajla (Auth Service):
```env
PORT=3001
DATABASE_URL=postgres://user:pass@localhost:5432/instagram_auth
JWT_SECRET=vasa_tajna_rec
INTERACTION_SERVICE_URL=http://localhost:3003
POST_SERVICE_URL=http://localhost:3002
```

#### Automatska inicijalizacija:
Možete koristiti skriptu `setup-dbs.sh` za automatsko kreiranje baza. Ona će pročitati šeme iz `microservices/*/schema.sql` i primeniti ih.
```bash
chmod +x setup-dbs.sh
./setup-dbs.sh
```

## 🏁 Pokretanje aplikacije

Aplikaciju možete pokrenuti jednom komandom iz korenskog direktorijuma:

```bash
npm start
```
Ova komanda koristi `concurrently` da istovremeno podigne:
1. API Gateway (Port 3000)
2. Auth Service (Port 3001)
3. Post Service (Port 3002)
4. Interaction Service (Port 3003)
5. Frontend (Port 3004)

## 🧪 Testiranje

### Mikroservisi (Unit & Integration)
Svaki servis ima svoje testove napisane u Jest-u. Da pokrenete sve backend testove odjednom:
```bash
npm run test-all
```

### Frontend E2E (Cypress)
Cypress testovi pokrivaju UI i API integraciju. Za pokretanje E2E testova, aplikacija mora biti pokrenuta (`npm start`).

U novom terminalu (u `frontend` folderu):
```bash
cd frontend
npm run test:e2e
```
Ova komanda će automatski sačekati da se frontend podigne na portu 3004 pre nego što pusti testove.

## 📁 Struktura direktorijuma
```text
.
├── microservices/
│   ├── api-gateway/          # Express Gateway & Proxy
│   ├── auth-service/         # User & Profile Management
│   ├── post-service/         # Posts & Media Upload
│   └── interaction-service/  # Likes & Comments
├── frontend/                 # React Application
├── database/                 # SQL Sheme i migracije
├── start-all.sh              # Bash skripta za pokretanje
└── test-all.sh               # Bash skripta za testove
```

## ⚠️ Rešavanje problema
Ako dobijete grešku `EADDRINUSE`, verovatno je port 3000 ili 3004 zauzet. Možete osloboditi port komandom:
```bash
fuser -k 3000/tcp
fuser -k 3004/tcp
```
