#!/bin/bash

# Zaustavi sve pozadinske procese pri izlasku
trap "kill 0" EXIT

echo "--- Instalacija zavisnosti ---"
npm run install-all

echo "--- Pokretanje servisa ---"
npm start
