# -*- coding: utf-8 -*-
"""
Created on Tue Jun 22 18:56:06 2021

@author: chand
"""

import pandas as pd
from datetime import datetime,timedelta
import boto3
from boto3.dynamodb.conditions import Key, Attr
import numpy as np
import json
import sys
import logging

logger = logging.getLogger('my-logger')
logger.propagate = False

def toilet_occupancy(date_start, date_end):
  dynamodb=boto3.resource('dynamodb', region_name="eu-central-1",aws_access_key_id="AKIAR7BOSFJZ6ETKUF7R",aws_secret_access_key="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")
  table = dynamodb.Table('Occupancy')

  scan_kwargs = {
    'FilterExpression': Key('timez').between(date_start, date_end),
  }

  done = False
  start_key = None
  data = []
  while not done:
    if start_key:
      scan_kwargs['ExclusiveStartKey'] = start_key
    response = table.scan(**scan_kwargs)
    data.extend(response.get('Items', []))
    start_key = response.get('LastEvaluatedKey', None)
    done = start_key is None

  # print(response['Items'])
  # & Key('timestamp').between(last_hour_time, last_hour)

  table_data = pd.DataFrame.from_records(data)
  # print(json_data)
  table_data.to_csv("washroom_statistic.csv")
#toilet_occupancy("01-aa-bb-cc-dd-03-02-05","2021-08-09T","2021-08-20T")
toilet_occupancy(sys.argv[1], sys.argv[2])
