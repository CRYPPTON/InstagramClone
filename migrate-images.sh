#!/bin/bash

echo "--- Migracija slika u mikroservise ---"

# Kreiranje foldera ako ne postoje
mkdir -p microservices/auth-service/uploads
mkdir -p microservices/post-service/uploads

# Kopiranje profilnih slika (stari i novi format)
echo "Kopiranje profilnih slika u Auth Service..."
cp backend/uploads/profile_picture-* microservices/auth-service/uploads/ 2>/dev/null
cp backend/uploads/profile-* microservices/auth-service/uploads/ 2>/dev/null

# Kopiranje slika postova
echo "Kopiranje slika postova u Post Service..."
cp backend/uploads/media-* microservices/post-service/uploads/ 2>/dev/null

echo "Slike su prebačene. Proveri foldere u microservices/*/uploads/"
