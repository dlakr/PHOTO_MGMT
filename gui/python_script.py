# import os
# import sys
# import json
# import PIL
# import sqlite3
# from PIL import Image
# from pillow_heif import register_heif_opener as r_opener
# from db_gui import *
#
# from pathlib import Path
# r_opener()
# db_name = "photo_database.sqlite"
# conn = sqlite3.connect(db_name)
# tables = {"vol": "volume", "ext": 'extensions', "err": 'errors'}
# cols = {"path_file": "text NOT NULL UNIQUE", "path_rep": "text", "copied": "bool"}
# test_entry = {}
# d = ""
#
#
# def log(log):
#
#     path = os.path.join(origin + "_HEIC", "HEIC.log")
#     with open(path, 'a') as f:
#         f.write(f"{log}\n")
#
#
# def heic_destination(path):
#     d = os.path.dirname(path)
#     folder = d[1]
#     orig = d[0][1]
#     if not os.path.exists(folder):
#         os.mkdir(folder)
#     dest = os.path.join(folder, orig)
#
#     return dest
#
#
# def convert_heic_to_jpg(heic):
#
#
#     dest_folder = "temp"
#     if not os.path.exists(dest_folder):
#         os.mkdir(dest_folder)
#     else:
#         try:
#             os.remove(dest_folder)
#             os.mkdir(dest_folder)
#         except PermissionError:
#             pass
#     cwd = os.getcwd()
#
#     try:
#         with Image.open(heic) as img:
#             dest_filename = os.path.join(cwd, dest_folder, os.path.splitext(os.path.basename(heic))[0] + "jpeg")
#
#             ex = img.getexif()
#             # jpg_file_path = os.path.splitext(heic)[0] + ".jpg"
#             img.save(dest_filename, format='JPEG', exif=ex)
#             return dest_filename
#     except PIL.UnidentifiedImageError as error:
#         log(error)
#
# def test_existing_drive(directory):
#     # todo: test if the drive selected has been already imported
#     existing_path = query_db(conn, tables['vol'], )
#     pass
#
# def copy_images():
#     # todo:i think javascript will copy the files
#     #  but python will provide with the
#     #  html source name (rep_path) and html id (file_path).
#     #  the copy function must also delete all the temporary files
#     pass
#
#
# def is_image_file(filename):
#     # List of image file extensions you want to consider
#     image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.heic']
#     ext = os.path.splitext(filename)[1].lower()
#     return ext in image_extensions
#
#
# def get_image_paths(directory):
#     image_paths = []
#
#     for root, dirs, files in os.walk(directory):
#         for file in files:
#             path = os.path.join(root, file)
#             if is_image_file(file):
#                 image_paths.append(path)
#     return image_paths
#
#
# def create_paths_dict(paths):
#     colist = list(cols)
#     output = []
#     for p in paths:
#
#         ext = os.path.splitext(p)[1].lower()
#
#         if ext == '.heic':
#             jpg = convert_heic_to_jpg(p)
#             output.append({colist[0]: p, colist[1]: jpg, colist[2]: 'False'})
#         else:
#             output.append({colist[0]: p, colist[1]: p, colist[2]: 'False'})
#     return output
#
#
# def get_test_paths():
#     directory = "F:\Dropbox\_Programming\PHOTO_MGMT\sample_data"
#     image_paths = []
#
#     for root, dirs, files in os.walk(directory):
#         for file in files:
#             path = os.path.join(root, file)
#             if is_image_file(file):
#                 image_paths.append(path)
#     return image_paths
#
#
# path_list = create_paths_dict(get_test_paths())
#
# def write_database(path_list):
#
#     # todo: record the path to the selected folder in volumes, and save
#     create_tables(conn,
#                   tname="files",
#                   columns=cols,
#                   foreign_tables=tables
#                   )
#
# # sql = write_database(path_list)
#
# # create_file_entry(conn, path_list[0], cols, tables)
#
# if __name__ == '__main__':
#     import sys
#     directory = sys.argv[1]
#     image_paths = get_image_paths(directory)
#     paths_json = json.dumps(image_paths)
#     print(paths_json)
import os
import json
import PIL
import sqlite3
from PIL import Image
from pillow_heif import register_heif_opener as r_opener
from db_gui import *

from pathlib import Path
r_opener()
db_name = "photo_database.sqlite"
conn = sqlite3.connect(db_name)
tables = {"vol": "volume", "ext": 'extensions', "err": 'errors'}
cols = {"path_file": "text NOT NULL UNIQUE", "path_rep": "text", "copied": "bool"}
test_entry = {}
d = ""
def write_output(out):
    with open("output/js_out.log", 'w') as file:
        file.write(out)

def log(log):
    path = os.path.join(origin + "_HEIC", "HEIC.log")
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
        log(error)


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


def create_paths_dict(paths):
    colist = list(cols)
    output = []
    for p in paths:
        ext = os.path.splitext(p)[1].lower()
        js_p = p.replace('\\', """\\\\""")

        if ext == '.heic':
            jpg = convert_heic_to_jpg(p)
            js_jpg = jpg.replace('\\', """\\\\""")
            output.append({colist[0]: js_p, colist[1]: js_jpg, colist[2]: False})
        else:
            output.append({colist[0]: js_p, colist[1]: js_p, colist[2]: False})
    js = json.dumps(output, indent=2)
    # parsed_js = json.load(js)
    return js

# img_paths = get_image_paths("F:\Dropbox\_Programming\PHOTO_MGMT\sample_data")
# out = create_paths_dict(img_paths)
# print(json.dumps(out, indent=2))


if __name__ == '__main__':
    try:
        import sys

        directory = sys.argv[1]
        image_paths = get_image_paths(directory)
        paths_data = create_paths_dict(image_paths)
        print(paths_data)  # Ensure the output is printed to allow ipc to pick up the data
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)


    # write_output(paths_data)

# import os
# import json

# # Define the image file extensions to consider
# IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.heic']

# def is_image_file(filename):
#     ext = os.path.splitext(filename)[1].lower()
#     return ext in IMAGE_EXTENSIONS

# def register_heif(heic_file_path):
#     # Implement the register_heif method to convert HEIC to JPEG
#     # and return the path of the generated JPEG file.
#     # Make sure to handle any exceptions or errors.
#     pass

# def walk_directory(directory):
#     image_paths = []
#     for root, dirs, files in os.walk(directory):
#         for file in files:
#             if is_image_file(file):
#                 file_path = os.path.join(root, file)

#                 # Generate JPEG version and get its path
#                 jpeg_path = register_heif(file_path)

#                 image_paths.append({"path_file": file_path, "path_rep": jpeg_path, "copied": False})

#     return image_paths

# def save_to_database(image_paths):
#     # Implement database connection and table creation if needed
#     # Insert the image_paths into the database (file_path, rep_path, copied)
#     pass

# def get_image_paths(directory):
#     image_paths = walk_directory(directory)
#     save_to_database(image_paths)
#     print(image_paths)
#     # Return the JSON representation of the image_paths to the Electron app
#     # return json.dumps(image_paths)
#     return 'hello'

# if __name__ == '__main__':
#     import sys
#     directory = sys.argv[1]
#     image_paths_json = get_image_paths(directory)
#     print(image_paths_json)

