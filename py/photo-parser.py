#!/usr/bin/env python
import os
import json
from processor import PhotoProcessor as Processor
from db import create_connection
test_pc = {"test_data": r'C:\Users\DL\Desktop\sample_data',
           "test_copied_path": r'C:\Users\DL\Desktop\copied'}
volumes_status = '/etc/PHOTO_MGMT/vars/volumes.json'
vols = {
    "volumes": {
        "excluded": [],
        "inprogress": "",
        "acquired": []
    }
}


def load_json(path):

    with open(path, 'r') as f:
        data = json.load(f)
        return data


# data = load_json(volumes_status)


def write_json(path, data):
    with open(path, 'w') as f:
        json.dump(data, f)


def list_initial_mounted_volumes():
    #todo: make test

    excluded = os.listdir('/volumes')
    return excluded


processor = Processor()
processor.vol_path = test_pc['test_data']
processor.get_paths_to_DB()
# processor.copy_from_json(test_pc["test_copied_path"])




#todo: the list initial volumes has to be run manually once to establish a normal state

# write_json(volumes_status, data)
# vol_name = os.path.split("/Volumes/mac_programs/sample_data/IMG_4742.HEIC ")[0].split('/')[2]
# print(vol_name)







