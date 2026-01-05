## 🚨 COMMANDES ESSENTIELLES (À retenir)

> [!IMPORTANT]
> Voici les 3 commandes que tu utiliseras le plus souvent :
> 
> 1. **`ssh oracle`** : Pour te connecter au serveur depuis ton Mac.
> 2. **`screen -r rivego`** : Pour reprendre le contrôle du serveur s'il tourne déjà.
> 3. **`npm run dev -- --hostname 0.0.0.0`** : Pour lancer le site (à faire dans le dossier `~/Rivego`).
> 4. **`mutagen sync list`** : Pour vérifier que tes changements se synchronisent bien.

---

## 📡 Informations du serveur

| Paramètre | Valeur |
|-----------|--------|
| **IP Publique** | `141.253.116.210` |
| **Utilisateur** | `ubuntu` |
| **Lien d'accès** | **[http://141.253.116.210:3000](http://141.253.116.210:3000)** |
| **Clé SSH** | `~/.ssh/oracle-rivego.key` |


---

## 🔐 Connexion SSH

### Méthode simple (après configuration)

```bash
ssh oracle
```

### Méthode complète (avec clé)

```bash
ssh -i ~/.ssh/oracle-rivego.key ubuntu@141.253.116.210
```

### Configuration SSH (~/.ssh/config)

Cette configuration permet d'utiliser `ssh oracle` au lieu de la commande complète :

```
Host oracle
  HostName 141.253.116.210
  User ubuntu
  IdentityFile ~/.ssh/oracle-rivego.key
```

---

## ▶️ Lancer le serveur de développement

### Étape 1 : Se connecter au serveur

```bash
ssh oracle
```

### Étape 2 : Aller dans le projet

```bash
cd ~/Rivego
```

### Étape 3 : Lancer le serveur

```bash
npm run dev -- --hostname 0.0.0.0
```

### Étape 4 : Accéder au site

Ouvre dans ton navigateur : **http://141.253.116.210:3000**

---

## 🔄 Mutagen - Synchronisation automatique

Mutagen synchronise automatiquement les fichiers entre ton Mac et le serveur Oracle.

### Comment ça fonctionne

```
┌─────────────────────────────┐          ┌─────────────────────────────┐
│         TON MAC             │   sync   │      SERVEUR ORACLE         │
│                             │ ◄──────► │                             │
│  📁 Fichiers locaux         │  auto    │  📁 Fichiers copiés         │
│  🤖 Antigravity édite       │          │  🚀 npm run dev tourne      │
│                             │          │  🌐 Port 3000 accessible    │
└─────────────────────────────┘          └─────────────────────────────┘
```

### Installation de Mutagen (une seule fois)

```bash
brew install mutagen-io/mutagen/mutagen
```

### Démarrer le daemon Mutagen

```bash
mutagen daemon start
```

### Créer la synchronisation

```bash
mutagen sync create \
  "/Users/tiagoribeiro/.gemini/antigravity/scratch/Rivego automation system" \
  oracle:~/Rivego \
  --name=rivego \
  --ignore="node_modules,.next,.git"
```

### Vérifier le statut

```bash
mutagen sync list
```

Tu devrais voir :
```
Name: rivego
Alpha: Connected ✅
Beta: Connected ✅
Status: Watching for changes
```

### Commandes Mutagen

| Commande | Description |
|----------|-------------|
| `mutagen sync list` | Voir le statut de toutes les syncs |
| `mutagen sync pause rivego` | Mettre en pause la sync |
| `mutagen sync resume rivego` | Reprendre la sync |
| `mutagen sync terminate rivego` | Arrêter définitivement |
| `mutagen sync flush rivego` | Forcer la synchronisation |
| `mutagen daemon start` | Démarrer le daemon |
| `mutagen daemon stop` | Arrêter le daemon |

---

## 🛠️ Commandes utiles

### Sur le serveur Oracle

```bash
# Mettre à jour le code depuis GitHub
cd ~/Rivego && git pull origin main && npm install

# Voir les processus Node.js
ps aux | grep node

# Tuer le serveur de dev
pkill -f "next dev"

# Redémarrer le serveur Ubuntu
sudo reboot

# Voir l'espace disque
df -h

# Voir la mémoire
free -h
```

### Garder le serveur actif avec Screen

```bash
# Créer une session screen
ssh oracle
screen -S rivego

# Lancer le serveur
cd ~/Rivego
npm run dev -- --hostname 0.0.0.0

# Détacher la session (Ctrl+A, puis D)
# Le serveur continue de tourner !

# Se rattacher à la session plus tard
screen -r rivego

# Lister les sessions screen
screen -ls
```

### Sur ton Mac

```bash
# Vérifier la connexion SSH
ssh oracle "echo 'Connexion OK'"

# Voir le statut Mutagen
mutagen sync list

# Forcer la sync
mutagen sync flush rivego
```

---

## 🔧 Dépannage

### Le site n'est pas accessible

1. **Vérifie que le serveur tourne** :
   ```bash
   ssh oracle
   cd ~/Rivego
   npm run dev -- --hostname 0.0.0.0
   ```

2. **Vérifie le pare-feu Ubuntu** :
   ```bash
   ssh oracle
   sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
   ```

3. **Vérifie Oracle Security Lists** :
   - Oracle Console → Networking → VCN → Security Lists
   - Port 3000 doit être ouvert (Ingress Rule)

### SSH "Permission denied"

1. **Vérifie les permissions de la clé** :
   ```bash
   chmod 400 ~/.ssh/oracle-rivego.key
   ```

2. **Vérifie le fichier config** :
   ```bash
   cat ~/.ssh/config
   ```

### Mutagen ne synchronise pas

1. **Vérifie le statut** :
   ```bash
   mutagen sync list
   ```

2. **Redémarre le daemon** :
   ```bash
   mutagen daemon stop
   mutagen daemon start
   ```

3. **Recrée la sync** :
   ```bash
   mutagen sync terminate rivego
   mutagen sync create \
     "/Users/tiagoribeiro/.gemini/antigravity/scratch/Rivego automation system" \
     oracle:~/Rivego \
     --name=rivego \
     --ignore="node_modules,.next,.git"
   ```

### Erreur "node_modules not found"

```bash
ssh oracle
cd ~/Rivego
npm install
```

---

## 📅 Historique

- **Créé le** : 27/12/2025
- **Serveur** : Oracle Cloud Free Tier (Ubuntu 22.04)
- **Projet** : Rivego Automation System

---

## 🔗 Liens rapides

- **Site** : http://141.253.116.210:3000
- **GitHub** : https://github.com/Food-order-lu/Rivego
- **Oracle Cloud** : https://cloud.oracle.com
