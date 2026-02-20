#!/bin/bash

DB_USER="enterwait_user"
DB_HOST="localhost"
DB_PORT="5433"
export PGPASSWORD='enterwait_dev_2024'

echo "Inicijalizacija tabela u bazama..."

# Auth Service DB
echo "Instaliranje Auth šeme..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d instagram_auth_db -f microservices/auth-service/schema.sql

# Post Service DB
echo "Instaliranje Post šeme..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d instagram_post_db -f microservices/post-service/schema.sql

# Interaction Service DB
echo "Instaliranje Interaction šeme..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d instagram_interaction_db -f microservices/interaction-service/schema.sql

echo "Sve šeme su uspešno instalirane."
