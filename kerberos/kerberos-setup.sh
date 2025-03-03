# ----- SYSTEM UPDATE ------
# update package listing to latest
sudo apt update

# update package versions to latest
sudo apt upgrade

# ----- INSTALL DOCKER -----
# installation setup taken from https://docs.docker.com/engine/install/debian/

# 1. Set up Docker's apt repository.
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

# 2. 
# Installing latest version: 5:28.0.1-1~debian.12~bookworm. Choosing to use a specific version
# because we KNOW this is working. you may experiment with installing the latest version and if it works, then yay

VERSION_STRING=5:28.0.1-1~debian.12~bookworm
sudo apt-get install docker-ce=$VERSION_STRING docker-ce-cli=$VERSION_STRING containerd.io docker-buildx-plugin docker-compose-plugin


# You can optionally install the latest version. To install the latest version. Note: it is commented out ON PURPOSE
# sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo To verify installation successful you can run "sudo docker run hello-world"

# ----- ARTICAM SETUP -----

# Note: you will have to create the directories for each agent (the directories should be unique per agent)
# We're using sudo so that docker can write to the directories
sudo mkdir agent/
sudo mkdir agent/config
sudo mkdir agent/recordings

# copy config json file to the agent config
cp config.json agent/config


