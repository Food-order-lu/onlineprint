#!/bin/bash
# Script de configuration Mutagen pour Rivego - CORRIGÉ

echo "🧹 Nettoyage de l'ancienne config SSH..."
# Supprime les anciennes entrées oracle si elles existent
sed -i '' '/Host oracle/,/IdentityFile/d' ~/.ssh/config 2>/dev/null

echo "🔧 Configuration SSH avec la NOUVELLE IP..."
cat >> ~/.ssh/config << 'EOF'

Host oracle
  HostName 141.253.116.210
  User ubuntu
  IdentityFile /Users/tiagoribeiro/Documents/Antigravity_Rivego_plateform/docs/oracle-rivego.key
EOF

echo "✅ SSH configuré avec IP: 141.253.116.210"

echo "🚀 Démarrage Mutagen..."
mutagen daemon start

echo "🔄 Suppression ancien sync si existant..."
mutagen sync terminate rivego 2>/dev/null

echo "🔄 Création du nouveau sync..."
mutagen sync create \
  "/Users/tiagoribeiro/Documents/Antigravity_Rivego_plateform" \
  oracle:~/Rivego \
  --name=rivego \
  --ignore="node_modules,.next,.git"

echo "📋 Statut:"
mutagen sync list

echo ""
echo "✅ Terminé !"
