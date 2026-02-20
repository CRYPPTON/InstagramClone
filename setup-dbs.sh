#!/bin/bash

# Učitavanje varijabli ili korišćenje defaulta
DB_USER="enterwait_user"
DB_HOST="localhost"
DB_PORT="5433"

echo "Kreiranje baza podataka na portu $DB_PORT..."

# Povezivanje na default 'postgres' bazu da bi se kreirale ostale
# Koristimo PGPASSWORD da izbegnemo prompt, ali je sigurnije uneti je ručno ako nije u env
export PGPASSWORD='enterwait_dev_2024'

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -f create_databases.sql

echo "Baze podataka su uspešno kreirane."
