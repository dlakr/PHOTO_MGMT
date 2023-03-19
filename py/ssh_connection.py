import paramiko
import json
import os

from requests import get
"""this script downloads and uploads files from/to a remote location using ssh and  a PEM (open rsa) key"""

ip = get('https://api.ipify.org').content.decode('utf8')

with open("sftp_info.json", "r") as f:
    info = json.load(f)

# direction to move file: 0 = copy to local, 1 = copy to remote
direction = info["direction"][0]


def connection():
    remote_ip= info["ip"]
    username = info["username"]
    path_to_key = info["path_to_key"]
    remote = info["remote_loc"]
    local = os.path.join(info['local_loc'])
    port = info["port"]
    if not os.path.exists(local):
        os.mkdir(local)
    # connect ssh
    # with paramiko.SSHClient() as ssh_client:
    #     # ssh_client = paramiko.SSHClient()
    #     ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    #     ssh_client.connect(remote_ip, username=username, key_filename=path_to_key, port=port)
    #     return ssh_client

    ssh_client = paramiko.SSHClient()
        # ssh_client = paramiko.SSHClient()
    ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh_client.connect(remote_ip, username=username, key_filename=path_to_key, port=port)

        # with ssh_client.open_sftp() as sftp_client:
        #     sftp_client.chdir(remote)
        #     if direction == info["direction"][0]:
        #         files = sftp_client.listdir()
        #     else:
        #         files = os.listdir(local)
        #     print(files)
        #
        #     for file in files:
        #         try:
        #             lc = os.path.join(local, file)
        #             if direction == info["direction"][0]:
        #                 sftp_client.get(file, lc)
        #             else:
        #                 sftp_client.put(file, os.path.basename(file))# not working yet
        #         except OSError as error:
        #             print(f'skipped {lc}')
    return ssh_client
ssh_c = connection()

