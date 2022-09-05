
#!m_venv\Scripts\python3
from bs4 import BeautifulSoup
import os
import re
import csv
import json
import ffmpeg
import pandas as pd
import PIL
from PIL import Image, ImageFile
from pillow_heif import register_heif_opener
from PIL.ExifTags import TAGS
import sys

with open('format.json', 'r') as f:
    formats = json.load(f)['formats']
all_formats = formats['images'] + formats['videos']
images = formats['images']
videos = formats['videos']
ImageFile.LOAD_TRUNCATED_IMAGES = True
register_heif_opener()
location = ''
temp_csv = 'temp.csv'
temp_loc = os.path.abspath(os.path.join(os.getcwd(), '..', "temp_data"))
temp_json_loc = os.path.join(temp_loc, 'temp.json')
temp_csv_loc = os.path.join(temp_loc, temp_csv)

# test_location = r'F:\Dropbox\pictures_sorted'
test_location = r'C:\Users\DL\Desktop\2022-02-19'
if os.name == 'nt':
    desktop = os.path.join(os.path.join(os.environ['USERPROFILE']), 'Desktop')
else:
    desktop = os.path.join(os.path.join(os.path.expanduser('~')), 'Desktop')
try:
    output_folder = os.mkdir(os.path.join(desktop, 'photo_analysis'))
except FileExistsError as error:
    output_folder = os.path.join(desktop, 'photo_analysis')


class PhotoAnalysis:

    def __init__(self):
        self.directory = ''
        self.buffer = []
        self.counter = 0
        self.open_type = 'w'
        self.fieldnames = ['METADATA', 'PATH']
        self.append = False
        self.dict_update = 0
        self.size_dump = True
        self.date_sorted_csv_output = os.path.join(output_folder, 'date_sorted.csv')
        self.no_date_csv_output = os.path.join(output_folder, 'no_date.csv')
        self.xlsx_index = os.path.join(output_folder, 'index.xlsx')
        self.sorted_result = {}
        self.html_addresses = []
        if os.path.exists(temp_csv_loc):

            c = input('continue where you left off?(y/n)')
            if c.lower() == 'y':
                self.continue_analysis()
            else:
                self.start_analysis()
        else:
            self.start_analysis()

    def check_temp_csv(self, temporary_csv_loc):
        """checks if temp_csv exists and returns its latest entry parent"""

    def start_analysis(self):
        """starts a new analysis at the given path"""

        while self.directory != 'q':

            print('s = sort entries and output xlsx index')
            print('r = generate report (csv)')
            print('e = end aquiring process')
            print('j = json')
            print('t = test unit')
            print('q = quit')
            self.directory = input('Enter directory:')
            if self.directory == '':
                self.directory = test_location
                self.get_paths(self.directory)
                # self.output_csv(temp_csv_loc, self.buffer)
            if self.directory == 'e':
                self.end_aquisition()
                self.generate_report(self.sorted_result)
            elif self.directory == 's':
                self.end_aquisition()
                self.sorted_result = self.sort_temp_csv()
                to_html = self.split_sorted_result_dated(self.sorted_result)

                self.write_multipage_html(data=to_html)
            elif self.directory == 'j':
                js = self.csv_to_json(temp_csv_loc)
                self.output_json(js, temp_json_loc)
            elif self.directory == 'r':
                self.end_aquisition()
            elif self.directory == "t":
                break
            else:
                self.get_paths(self.directory)
                # self.output_csv(temp_csv_loc, self.buffer)

        # self.end_aquisition()

    def end_aquisition(self):
        self.output_csv(temp_csv_loc, self.buffer, self.open_type)

        with open('dir_to_analyse.txt', 'w') as f:
            f.write(self.directory)

    def read_csv(self, csv_loc):
        with open(csv_loc, encoding='utf-8', newline='') as f:
            reader = csv.DictReader(f, delimiter=',')
            result = list(reader)
            return result

    def csv_to_json(self, csv_path):
        """organises the paths by extension type, preparing them to have their metadata retrieved"""
        files_dict = {'images': {}, 'videos': {}}
        with open(csv_path, 'r') as f:
            for line in f:
                l = line.strip()
                ext = os.path.splitext(l)[1][1:].lower()

                if ext in images:
                    if ext not in files_dict['images']:
                        files_dict['images'].update({ext: {l: ext}})
                    else:
                        files_dict['images'][ext].update({l: ext})
                else:
                    if ext not in files_dict['videos']:
                        files_dict['videos'].update({ext: {l: ext}})
                    else:
                        files_dict['videos'][ext].update({l: ext})
        return files_dict


    
    def sort_temp_csv(self):
        """sorts out entries by date to a desktop file and"""
        print('sorting')

        data = self.read_csv(temp_csv_loc)
        sorted_list = sorted(data, key=lambda d: d[self.fieldnames[0]])
        undated = []
        dated = []
        undated_count = 0
        dated_count = 0
        pattern = r'^.*(\.photoslibrary\/originals)'
        for i in sorted_list:
            if i[self.fieldnames[0]] == '-not_dated-' or i[self.fieldnames[0]] == 'UNKNOWN FORMAT':
                undated.append(i)
                # undated_count += 1

                if re.findall(pattern, i[self.fieldnames[1]]):
                    print(i[self.fieldnames[1]])
                    undated_count += 1

            else:
                dated.append(i)
                if re.findall(pattern, i[self.fieldnames[1]]):
                    print(i[self.fieldnames[1]])
                    dated_count += 1
        print(f'dated: {dated_count}')
        print(f'undated: {undated_count}')
        sorted_result = {'dated': dated, 'undated': undated}


        return sorted_result




    def append_year_address(self, year):
        """append the location of the html page created"""
        output_path = {year: os.path.join(output_folder, 'pages', f'{year}.html')}

        return output_path

    def generate_report(self, sorted_data):
        """generates a report counting files by month"""

        report_dict = {}
        if sorted_data:
            data = sorted_data
        else:
            path = input('what is the sorted data location (enter to use default)')
            if path == '':
                path = self.date_sorted_csv_output
            data = self.read_csv(path)

        for i in data:
            pattern = r'^\d{4}:\d{2}'
            value = i[self.fieldnames[0]]
            month = re.findall(pattern, value)
            if not month:
                month = ['NOT DATED']
            if month[0] in report_dict:
                report_dict[month[0]] += 1
            else:
                report_dict[month[0]] = 1

        output_path = os.path.join(output_folder, 'report.csv')

        with open(output_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            for i in report_dict.items():

                writer.writerow(i)

    def continue_analysis(self):
        """continues an existing analysys at existing location"""
        self.append = True
        self.dict_update = 1
        self.start_analysis()

    def output_json(self, data, loc):
        with open(loc, 'w') as f:
            json.dump(data, f, indent=4)

    def load_json(self, path):
        with open(path, 'r') as f:
            js = json.load(f)
        return js

    def get_metadata(self, path):
        """retrieves date metadata if file is in HEIC format"""
        # the files are now stored in a json file

        json_data = self.load_json(temp_json_loc)
        # try:
        #     for category, format in json_data.items():
        #         for img, ext in format.items():

            img = Image.open(path)
            img_exif = img.getexif()

            if img_exif:
                exif = {TAGS[k]:v for k, v in img_exif.items() if k in TAGS and type(v) is not bytes}
                pattern = r'\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}'
                exif_date = re.findall(pattern, str(exif.get('DateTime')))
                if exif_date:
                    date = exif_date[0]
                else:
                    date = '-not_dated-'
            else:
                date = '-not_dated-'
            return {self.fieldnames[0]: date, self.fieldnames[1]: path}
        except PIL.UnidentifiedImageError as error:
            return r
        except OSError as error:
            r_os = r
            r_os[self.fieldnames[0]] = 'Truncated File'
            return r_os

    def get_paths(self, directory):
        """get absolute path of image file in the given formats"""

        # pattern = r'\.(jpg|jpeg|heic|png)$'
        pattern = r'\.('
        for index, value in enumerate(all_formats):
            if index < len(all_formats)-1:

                pattern += f'{value}|'
            else:
                pattern += f'{value})$'
        if os.path.exists(directory):
            count = 0

            for root, d_names, f_names in os.walk(directory):
                for file in f_names:
                    count += 1
                    path = os.path.join(root,file)
                    ext = re.findall(pattern, str(file).lower())
                    if ext:
                        self.buffer.append(path)
                        if count == 1000:
                            count = 0
                            self.dict_update += 1
                            if self.dict_update > 1:
                                self.open_type = 'a'
                            self.output_temp(temp_csv_loc, self.buffer, self.open_type)

                self.output_temp(temp_csv_loc, self.buffer, self.open_type)

        # buff = self.remove_duplicate(self.read_csv(temp_csv_loc))
        # return buff

    def remove_duplicate(self, dictionary):
        new_list = [dict(t) for t in {tuple(d.items()) for d in dictionary}]
        return new_list

    def output_csv(self, file_loc, buffer, open_type):


        with open(file_loc, open_type, encoding='UTF-8') as f:
            # writer = csv.writer(f, delimiter=',')
            for i in buffer:

                f.write(f'{i}\n')
            f.close()

    def output_temp(self, file_loc, buffer, append):
        self.output_csv(file_loc, buffer, append)
        self.buffer = []
        self.counter = 0

    # def write_csv(self, file_loc, dictionnary, size_dump):
    #     if size_dump:
    #         if sys.getsizeof(dictionnary) >= 10000:
    #             self.dict_update += 1
    #             if self.dict_update == 1:
    #                 print('overwriting')
    #                 self.append = False
    #             else:
    #                 print('appending')
    #                 self.append = True
    #             self.output_temp(file_loc, dictionnary, self.append)
    #     else:
    #         self.output_temp(file_loc, dictionnary, self.append)

    # def __exit__(self, exc_type, exc_val, exc_tb):
    #     # the dump is not linked buffer_dict size
    #     self.write_csv(temp_csv_loc, self.buffer, size_dump=False)

    def split_sorted_result_dated(self, lod):
        """group the dated entries by year when supplied a lod (list of dictionaries)"""
        years_dict = {}
        years = []

        for e in lod['dated']:
            # for k, v in dictionary.items():
            year = e[self.fieldnames[0]][:4]

            if year not in years:
                years.append(year)
                years_dict[year] = [e]
                self.html_addresses += self.append_year_address(year)
            else:
                years_dict[year].append(e)


        return years_dict

    def write_html(self, name, data, headers):
        """writes out html page containing links to images"""
        link = """<ul>
        """
        for i in data:

            link = link + f"""<li><b>{i[headers[0]]}</b><a 
            href="{i[headers[1]]}">{i[headers[1]]}
            </a></li>\n"""
        link += "</ul>"
        html_folder = 'HTML'
        soup = BeautifulSoup(link, 'html.parser')
        if  not os.path.exists(os.path.join(output_folder, html_folder)):
            os.mkdir(os.path.join(output_folder, html_folder))
        output_loc = os.path.join(output_folder, html_folder, f"{name}.html")
        with open(output_loc, "w", encoding='utf-8') as file:
            file.write(str(soup.prettify()))

    def write_multipage_html(self, data):
        """writes html pages and indexes for entries in """
        years = []
        i_headers = ['disp', 'link']
        for k, v in data.items():
            self.write_html(name=k, data=v, headers=self.fieldnames)
            years.append({i_headers[0]: k, i_headers[1]: f"{k}.html"})
        self.write_html(name='INDEX', data=years, headers=i_headers)
        
        
if __name__ == "__main__":
    pa = PhotoAnalysis()