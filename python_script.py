#!/usr/bin/python
# -*- coding: utf-8 -*-

import os
import sysconfig
import json
import PIL
import cv2
import sqlite3
from PIL import Image
from pillow_heif import register_heif_opener as r_opener
# from db_gui import *
import time
from pathlib import Path
import datetime
import platform
import sys
import threading
r_opener()
os_type = platform.system()
import os
import stat
import subprocess
import tempfile
dest_folder = tempfile.mkdtemp()

media_found = 0
def set_permissions(path, val):
    if os_type == 'Darwin':
        try:
            # Using chmod command to set permissions to 666
            subprocess.run(f'chmod -R {val} {path}', check=True)
            # print(f"Permissions of {path} set to {val}")
        except subprocess.CalledProcessError as er:
            print(f"Error setting permissions: {er}")


def desktop():
    if os_type == 'Darwin':
        desktop = os.path.join(os.environ['HOME'], 'Desktop')
    else:
        desktop = os.path.join(os.environ['USERPROFILE'], 'Desktop')
    return desktop


# db_name = "photo_database.sqlite"
# conn = sqlite3.connect(db_name)
tables = {"vol": "volume", "ext": 'extensions', "err": 'errors'}
cols = {"path_file": "text NOT NULL UNIQUE", "path_rep": "text", "copied": "bool", 'to_copy': 'bool'}



json_formats = {
    "videos": ["mpg", "mp2", "mp4", "mpeg", "mpe", "mpv", "mov"],
    "images": ["jpg", "jpeg", "heic", "png", "crw", "bmp"]
}

def get_formats():
    with open(json_formats) as f:
        data = json.load(f)
    return data


try:
    image_extensions = ['.' + i for i in json_formats["images"]]
    video_extensions = ['.' + i for i in json_formats["videos"]]

    # image_extensions = ['.'+i for i in  get_formats()["images"]]
    # video_extensions = ['.'+i for i in  get_formats()["videos"]]
    file_extensions = image_extensions + video_extensions
except Exception as e:
    print(e)


def thumbnail_path(file):
    dest_filename = os.path.join(dest_folder, os.path.splitext(os.path.basename(file))[0] + ".jpeg")
    return dest_filename


def write_output(out):
    with open(os.path.join(desktop(), "output", "js_out.log"), 'w') as file:
        file.write(out)


def log(log):
    path = os.path.join(desktop(), "HEIC.log")
    with open(path, 'a') as f:
        f.write(f"{log}\n")


def heic_destination(path, temp):
    d = os.path.dirname(path)
    folder = d[1]
    orig = d[0][1]
    if not os.path.exists(folder):
        os.mkdir(folder)
    dest = os.path.join(folder, orig)

    return dest


def convert_heic_to_jpg(heic):

    try:
        with Image.open(heic) as img:
            dest_filename = thumbnail_path(heic)

            ex = img.getexif()
            img.save(dest_filename, format='JPEG', exif=ex)
            return dest_filename
    except PIL.UnidentifiedImageError as error:
        log(error)


def is_image_file(filename):
    ext = os.path.splitext(filename)[1].lower()
    return ext in image_extensions


def is_valid_file(filename):
    ext = os.path.splitext(filename)[1].lower()
    present = ext in file_extensions

    return present


def get_image_paths(directory, fileCount):
    image_paths = []
    media_found = 0

    for root, dirs, files in os.walk(directory):
        for file in files:
            path = os.path.join(root, file)
            if is_valid_file(file):
                image_paths.append(path)
            media_found += 1
            # progress_update = json.dumps({'progress': media_found})
            # print(progress_update, flush=True)

    return image_paths


def get_vid_thumbnail(vid_path):
    vidcap = cv2.VideoCapture(vid_path)
    if not vidcap.isOpened():
        return
    succes, image = vidcap.read()

    if succes:

        dest = thumbnail_path(vid_path)
        cv2.imwrite(dest, image)
        return dest
    vidcap.release()


def js_path(path):
    p = str(Path(path))
    return p


def create_paths_dict(paths):
    colist = list(cols)
    output = []
    img_processed = 0
    for p in paths:

        ext = os.path.splitext(p)[1].lower()

        js_p = js_path(p)

        if ext == '.heic':
            # for heics
            jpg = convert_heic_to_jpg(p)
            js_jpg = js_path(jpg)
            output.append({colist[0]: js_p, colist[1]: js_jpg, colist[2]: False, colist[3]: True})
        elif ext in video_extensions:

            t_dest = get_vid_thumbnail(p)
            js_thumb = js_path(t_dest)
            output.append({colist[0]: js_p, colist[1]: js_thumb, colist[2]: False, colist[3]: True})
        else:
            # any other image file
            output.append({colist[0]: js_p, colist[1]: js_p, colist[2]: False, colist[3]: True})
        img_processed += 1
        progress_update = json.dumps({'progress': img_processed})
        print(progress_update, flush=True)
    js_paths = {'paths': output}
    js = json.dumps(js_paths, indent=2)
    # parsed_js = json.load(js)
    return js


def write_to_database(js):
    # Implement database connection and table creation if needed
    # Insert the image_paths into the database (file_path, rep_path, copied)
    pass


if __name__ == '__main__':

    try:
        directory = sys.argv[1]
        # dest_folder = sys.argv[1]
        fileCount = sys.argv[2]
        # fileCount = 0
        # dest_folder = os.path.join(r"C:\Users\dlaqu\OneDrive\Desktop", "temp")
        # os.mkdir(dest_folder)
        # directory = os.path.join(r"/Users/davidlaquerre/Desktop/sample_data")
        file_paths = get_image_paths(directory, fileCount)
        paths_data = create_paths_dict(file_paths)
        print(paths_data)


    except Exception as e:
        now = datetime.datetime.now()
        print(f"{now} - Final error: {e}\n")
        # with open(os.path.join(desktop(), "pm_log.log"), "a") as f:
        #     now = datetime.datetime.now()
        #     f.write(f"{now} - Final error: {e}\n")


