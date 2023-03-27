#!/usr/bin/env python
import os
import json
from processor import PhotoProcessor as Processor
from db import DB
test_pc = {"test_data": r'F:\Dropbox\_ARCHITECTURAL',
           "test_copied_path": r'C:\Users\DL\Desktop\copied'}

# python -m webbrowser file:///usr/share/doc/python/FAQ.html
database = "pm_database.db"
db = DB()
conn = db.create_connection(database)
db.create_tables(conn)
processor = Processor()


def list_initial_mounted_volumes():
    #todo: run on mac

    conn = db.create_connection(database)
    excluded = os.listdir('/volumes')
    for vol in excluded:
        db.create_foreign_entry_volumes(conn, vol, True)
    return excluded


def check_for_device_in_db(device):
    conn = db.create_connection(database)
    vol = processor.get_vol_name(device)
    ignored = db.query_LIKE_db(conn, "volumes", 'vol', vol)


    if not ignored:
        processor.vol_path = device
        processor.get_paths_to_DB()
        processor.copy()

    # todo: must check if volume is in database, if so load data in buffer - check is done at plugin
    else:
        print("already scraped or ignored")


# check_for_device_in_db(test_pc["test_data"])
processor.vol_path = test_pc['test_data']
processor.get_paths_to_DB()
report = processor.copy()
print(report)




#todo: the list initial volumes has to be run manually once to establish a baseline

# write_json(volumes_status, data)
# vol_name = os.path.split("/Volumes/mac_programs/sample_data/IMG_4742.HEIC ")[0].split('/')[2]
# print(vol_name)







