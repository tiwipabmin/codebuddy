# Codebuddy
Online Collaborative Web Development Environment for Pair-Programming Technique

# Prerequisite on Localhost
### Node.js
* Download & Install [Node.js](https://redis.io/) version 8.x.x only.
### Redis.io
* Download & Install [Redis.io](https://redis.io/).
### Python3 && Pylint
* Download & Install [Python3](https://www.python.org/downloads/).
* Command for installing pylint on WINDOWS10 and OS X
```bash
pip install pylint
```
### MongoDB (Optional)
* Download & Install [MongoDB](https://www.mongodb.com/download-center/community) - you can use the another software to run mongodb.
### MySql Workbench
* Download & Install [MySql](https://www.mysql.com/products/workbench/).


# Installation on Server
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
