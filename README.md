# Codebuddy
Online Collaborative Web Development Environment for Pair-Programming Technique

# Prerequisite Technology
## Node.js
## Redis
* Install [redis] (https://redis.io/)


# Installation On Server
## Initial Nginx
> https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-18-04

```bash
cd ~
curl -sL https://deb.nodesource.com/setup_8.x -o nodesource_setup.sh
sudo bash nodesource_setup.sh
sudo apt install nodejs
```
## Install Python
> https://www.digitalocean.com/community/tutorials/how-to-install-python-3-and-set-up-a-programming-environment-on-ubuntu-18-04-quickstart
```bash
sudo apt update
sudo apt -y upgrade
sudo apt install -y python3-pip #install pip
```

## Install MySQL
> https://www.digitalocean.com/community/tutorials/how-to-install-mysql-on-ubuntu-18-04
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
# Need to setup user
```

## Install MongoDB
> https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-18-04
```bash
sudo apt install -y mongodb
```
```bash
sudo systemctl status mongodb
sudo systemctl stop mongodb
sudo systemctl start mongodb
sudo systemctl restart mongodb
sudo systemctl disable mongodb
sudo systemctl enable mongodb

sudo ufw allow 27017
```
