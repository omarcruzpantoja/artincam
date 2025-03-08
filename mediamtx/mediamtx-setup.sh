# create temporary directory
tmp=tmp-mediamtx
user=$(whoami)


# create directory
mkdir ${tmp}

# change working directory to the tmp directory
cd ${tmp}

# download file from internet
wget https://github.com/bluenviron/mediamtx/releases/download/v1.11.3/mediamtx_v1.11.3_linux_arm64v8.tar.gz

# decompress it and delete file
tar -xvzf mediamtx_v1.11.3_linux_arm64v8.tar.gz
rm mediamtx_v1.11.3_linux_arm64v8.tar.gz

# Create a copy of the configuration
cp ../mediamtx.yml mediamtx.yml

# Move file to binary (executable files)
sudo mv mediamtx /usr/local/bin/
# Give the executable file permission to run
sudo chmod +x /usr/local/bin/mediamtx

# Move config file to where configuration files live
# first create directory to store yaml
sudo mkdir -p /etc/mediamtx
# move the config file
sudo mv mediamtx.yml /etc/mediamtx/

# set mediamtx as a systemd service (this will help with turning it on/off)
echo "Setting up mediamtx as a service"
sudo tee /etc/systemd/system/mediamtx.service >/dev/null <<EOF
[Unit]
Description=MediaMTX Streaming Server
After=network.target

[Service]
ExecStart=/usr/local/bin/mediamtx /etc/mediamtx/mediamtx.yml
Restart=always
User=${user}
Group=${user}
WorkingDirectory=/home/${user}
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# go to previous working directory and delete tmp folder
cd ../

rm -r tmp-mediamtx

echo "Reload systemctl daemon"
sudo systemctl daemon-reload
echo "Enabling mediamtx"
sudo systemctl enable mediamtx
echo "Starting mediamtx service"
sudo systemctl start mediamtx

echo "DONE"

echo "Run ( sudo systemctl status mediamtx ) to check the status of the service"
