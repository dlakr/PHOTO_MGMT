
import os
import json
import sys
import PIL
import sqlite3
from PIL import Image
from pillow_heif import register_heif_opener as r_opener
# from db_gui import *

from pathlib import Path
r_opener()
db_name = "photo_database.sqlite"
conn = sqlite3.connect(db_name)
tables = {"vol": "volume", "ext": 'extensions', "err": 'errors'}
cols = {"path_file": "text NOT NULL UNIQUE", "path_rep": "text", "copied": "bool"}
test_entry = {}
d = ""

def dest():
    if sys == 'darwin':
        desktop = os.path.join(os.path.join(os.path.expanduser('~')), 'Desktop')
    else:
        desktop = os.path.join(os.path.join(os.environ['USERPROFILE']), 'Desktop')
    return desktop

def dest_log():
    output = os.path.join(dest(), 'logs')
    if not(os.path.exists(output)):
        os.mkdir(output)
    return output


def write_output(out):
    with open("output/js_out.log", 'w') as file:
        file.write(out)

def output_log(log):
    path = os.path.join(dest_log(), "HEIC.log")
    with open(path, 'a') as f:
        f.write(f"{log}\n")


def heic_destination(path):
    d = os.path.dirname(path)
    folder = d[1]
    orig = d[0][1]
    if not os.path.exists(folder):
        os.mkdir(folder)
    dest = os.path.join(folder, orig)

    return dest


def convert_heic_to_jpg(heic):
    dest_folder = "temp"
    if not os.path.exists(dest_folder):
        os.mkdir(dest_folder)
    else:
        try:
            os.remove(dest_folder)
            os.mkdir(dest_folder)
        except PermissionError:
            pass
    cwd = os.getcwd()

    try:
        with Image.open(heic) as img:
            dest_filename = os.path.join(cwd, dest_folder, os.path.splitext(os.path.basename(heic))[0] + ".jpeg")

            ex = img.getexif()
            img.save(dest_filename, format='JPEG', exif=ex)
            return dest_filename
    except PIL.UnidentifiedImageError as error:
        output_log(error)


def is_image_file(filename):
    image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.heic']
    ext = os.path.splitext(filename)[1].lower()
    return ext in image_extensions


def get_image_paths(directory):
    image_paths = []

    for root, dirs, files in os.walk(directory):
        for file in files:
            path = os.path.join(root, file)
            if is_image_file(file):
                image_paths.append(path)
    return image_paths

def f_paths(path):
    if sys.platform == "darwin":
        return path
    else:
        p = path.replace('\\', """\\\\""")
        return p


def create_paths_dict(paths):
    colist = list(cols)
    output = []
    for p in paths:
        ext = os.path.splitext(p)[1].lower()
        js_p = f_paths(p)

        if ext == '.heic':
            jpg = convert_heic_to_jpg(p)
            js_jpg = f_paths(jpg)
            output.append({colist[0]: js_p, colist[1]: js_jpg, colist[2]: False})
        else:
            output.append({colist[0]: js_p, colist[1]: js_p, colist[2]: False})
    js = json.dumps(output, indent=2)
    # parsed_js = json.load(js)
    return js

if __name__ == '__main__':
    try:
        import sys

        directory = sys.argv[1]
        image_paths = get_image_paths(directory)
        paths_data = create_paths_dict(image_paths)
        print(paths_data)  # Ensure the output is printed to allow ipc to pick up the data
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)


