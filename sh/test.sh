#!/usr/bin/env bash
date=$(date)
#echo "new device: $date" >> /etc/photo_mgmt/temp_data/out.log
system_profiler SPUSBDataType | grep "Serial Number" >> /etc/photo_mgmt/temp_data/out.log
#system_profiler SPUSBDataType | grep "uuid"