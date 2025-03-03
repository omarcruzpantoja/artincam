# Cronjobs

Cronjobs are used to execute specific tasks are specified times. It is still not guaranteed we'll need all the jobs documented in `crontab` file, but some of them will. In the following instructions we will add those that are 100% needed or wanted.

```bash
# After initial setup ( selecting the editor )
sudo crontab -e

# After this opens, we want to add this to the file

# This will allow ssh to be turned on at reboot
@reboot systemctl start ssh
```

## Cheatseet

`crontab -e ` => add a new cronjob
`crontab -l ` => list all cronjobs

## Readings (to learn about cronjobs)

https://bc-robotics.com/tutorials/setting-cron-job-raspberry-pi/?srsltid=AfmBOor1pNMdaLtLdXfvzs4i2TcMeHdUVO6Pg37Xl8xwbf0EiWQYIj02

