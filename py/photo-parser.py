#!/usr/bin/env python
import os
import json

json_path = '/etc/PHOTO_MGMT/vars/volumes.json'
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


data = load_json(json_path)


def write_json(path, data):
    with open(path, 'w') as f:
        json.dump(data, f)



def list_initial_mounted_volumes():
    #todo: make test
    volumes = os.listdir('/volumes')

    excluded = data['volumes']['excluded']
    for i in volumes:
        excluded.append(i) if i not in excluded else excluded

    data['volumes']['excluded'] = excluded
    return excluded






#todo: the list initial volumes has to be run manually once to establish a normal state

write_json(json_path, data)
vol_name = os.path.split("/Volumes/mac_programs/sample_data/IMG_4742.HEIC ")[0].split('/')[2]
print(vol_name)






