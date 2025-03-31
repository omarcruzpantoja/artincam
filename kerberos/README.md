# Kerberos Setup (DEPRECATED, no longer maintained)

## Install docker

### Install with script

```bash
chmod +x kerberos-setup.sh
sudo kerberos-setup.sh
```

### Install without script

Follow instructions from `https://docs.docker.com/engine/install/debian/#installation-methods`

Ideally install version `5:28.0.1-1~debian.12~bookworm` or latest

```bash
sudo mkdir agent/
sudo mkdir agent/config
sudo mkdir agent/recordings

# copy config json file to the agent config
cp config.json agent/config

```

## How to use

Use `make` to restart container (or start it up for the first time)

Alternatively, use `make up` to start the container, `make down` to stop the container.

Use `make logs` ( to be added ) to see container output log.

If you want to know whether the container is running or not use `sudo docker ps`, if there's no container active, it means its not runnig

## Configure
TODO:

## Troubleshooting

If having issues with having access to directories (kerberos does not save recordings). Run the following

```bash
chmod -R 755 ../kerberos/
chown 100:101 ../kerberos/ -R
```
