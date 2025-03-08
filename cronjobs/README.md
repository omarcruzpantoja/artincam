# Cronjobs

Cronjobs are used to execute specific tasks are specified times. It is still not guaranteed we'll need all the jobs documented in `crontab` file, but some of them will. In the following instructions we will add those that are 100% needed or wanted.

Why cronjob?
Cronjob is being used to either get a process running at startup, or running a process every X minutes/hours/days. The use cases that might be used include

1. On startup, start the ssh service
2. On startup, get the camera process (recording) to start
3. Every 2-5 minutes, verify that the recording process is running, if it is not, then it restarts it.
   1. Goal of this is so that once the PI is set up, the only thing that has to be done is turning it on then it'll ensure that theres constant recording happening.

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

