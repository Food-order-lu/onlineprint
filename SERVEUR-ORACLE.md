# 🚀 Serveur Oracle Cloud - Guide de connexion

## Informations du serveur

| Paramètre | Valeur |
|-----------|--------|
| **IP Publique** | `141.253.116.210` |
| **Utilisateur** | `ubuntu` |
| **OS** | Ubuntu 22.04 |
| **Clé SSH** | `~/.ssh/oracle-rivego.key` |
| **URL du site** | http://141.253.116.210:3000 |

---

## 🔐 Connexion SSH

```bash
ssh -i ~/.ssh/oracle-rivego.key ubuntu@141.253.116.210
```

---

## 📂 Emplacement du projet

```bash
cd ~/Rivego
```

---

## ▶️ Lancer le serveur de dev

```bash
cd ~/Rivego
npm run dev -- --hostname 0.0.0.0
```

Le site sera accessible sur : **http://141.253.116.210:3000**

---

## 🔄 Synchronisation Mutagen (Mac → Serveur)

### Installation (une seule fois)
```bash
brew install mutagen-io/mutagen/mutagen
mutagen daemon start
```

### Configuration SSH
Ajoute dans `~/.ssh/config` :
```
Host oracle
  HostName 141.253.116.210
  User ubuntu
  IdentityFile ~/.ssh/oracle-rivego.key
```

### Créer le sync
```bash
mutagen sync create \
  "/Users/tiagoribeiro/.gemini/antigravity/scratch/Rivego automation system" \
  oracle:~/Rivego \
  --name=rivego \
  --ignore="node_modules,.next,.git"
```

### Commandes utiles
```bash
mutagen sync list          # Voir le statut
mutagen sync pause rivego  # Mettre en pause
mutagen sync resume rivego # Reprendre
mutagen sync terminate rivego # Arrêter définitivement
```

---

## 🔥 Pare-feu Oracle Cloud

Port 3000 ouvert via Security List :
- Source: `0.0.0.0/0`
- Protocol: TCP
- Port: `3000`

---

## 🛠️ Commandes utiles sur le serveur

```bash
# Mettre à jour le code depuis GitHub
cd ~/Rivego && git pull origin main && npm install

# Voir les processus Node
ps aux | grep node

# Tuer le serveur dev
pkill -f "next dev"

# Redémarrer le serveur
sudo reboot
```

---

## 📅 Créé le 27/12/2025
