import datetime
import psutil
import pathlib

PID_STORE = "/tmp/articam.txt" #  TODO: make this shareable between scripts
SCRIPT_PATH = pathlib.Path(__file__).resolve().parent

def get_pid():
  with open(PID_STORE, 'r') as f:
    pid = int(f.read())
    f.close()
    return pid

def get_process():
    with open(SCRIPT_PATH / 'logger.txt', 'a') as f:
        try:
            process = psutil.Process(get_pid())
            f.write(
                f'health | {datetime.datetime.now().strftime("%d/%m/%Y %H:%M:%S")} | Process found and is running.\n'
            )
        except psutil.NoSuchProcess:
            f.write(f'health | {datetime.datetime.now().strftime("%d/%m/%Y %H:%M:%S")} | Process is not running.\n')
    f.close()

if __name__ == "__main__":
  get_process()