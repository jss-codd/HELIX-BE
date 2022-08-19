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
from prophet import Prophet
from prophet.plot import plot_plotly,plot_components_plotly
from django.core.serializers.json import DjangoJSONEncoder
from django.forms.models import model_to_dict
import sys
import logging

logger = logging.getLogger('my-logger')
logger.propagate = False

def toilet_occupancy(device_id,date_start,date_end):

# def toilet_occupancy(request,template_name='iot_occupancy.html'):
    # x_1=['05/04/2021 10:18','05/04/2021 11:19','05/04/2021 12:19','05/04/2021 13:19','05/04/2021 14:19']
    # y_1=[0.2,0.3,0.4,0.15,0.16]
    # chart_1=get_plot_pir(x_1, y_1, "time", "value","pir")
    # x=['monday','tuesday','wednesday','Thursday','Friday','Saturday','Sunday']
    # y=[10,20,25,15,23,10,20]
    # chart=get_plot(x, y,"time","number of Occupants","peak occupancy")
    # x=['05/04/2021 10:18','05/04/2021 11:19','05/04/2021 12:19','05/04/2021 13:19','05/04/2021 14:19']
    # y=[25,30,27,29,25]
    # chart_2=get_plot_pir(x, y, "time", "value","odour")
    # return render(request,template_name)
  today=datetime.now().strftime("%Y-%m-%dT")
  print(device_id,date_start,date_end)

  start_date=date_start
  end_date=date_end
  device_id=device_id
  print(device_id)
  dynamodb=boto3.resource('dynamodb', region_name="eu-central-1",aws_access_key_id="AKIAR7BOSFJZ6ETKUF7R",aws_secret_access_key="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")
  table = dynamodb.Table('Occupancy')
  last_hour=datetime.now()-timedelta(hours=1)
  last_hour_time=last_hour.strftime("%m-%d-%Y-%H:%M")
  print(last_hour_time)
  last_hour=datetime.now().strftime("%m-%d-%Y-%H:%M")
  print(last_hour)
  # table_data=pd.DataFrame()

  response = table.query(
        KeyConditionExpression=Key('deviceid').eq(device_id)  & Key('timez').between(start_date, end_date)
        )

  # print(response['Items'])
  # & Key('timestamp').between(last_hour_time, last_hour)
  items = response['Items']
  test=json.dumps(items, cls=DjangoJSONEncoder)

  table_data=pd.DataFrame.from_records(items)
  json_data=pd.DataFrame.to_json(table_data)
  # print(json_data)
  table_data.to_csv("washroom_data.csv")
  # print(table_data)
  # table_data["timez"]=table_data["timez"].strftime("%m-%d-%Y-%H:%M")
  # print(table_data["timez"])
  # chart=get_plot_pir(table_data["timez"], table_data["occupancyCount"], "time", "occupancyCount","people_count")
  # table_data["occupancyCount"]=1
  total_occupancy=int(table_data["occupancyCount"].tail(1).values)
  time_spent=(table_data["occupancytime"].apply(pd.to_numeric))
  time_spent=time_spent.sum()

  print(time_spent)
  table_length=table_data.size
  data_json={

      "Total_occupancy":total_occupancy,
      "length":table_length,
      "timespent":time_spent,
      "device_id":device_id

      }


  table_data["iaq"]=table_data["iaq"].apply(pd.to_numeric)
  df=pd.DataFrame()

  df['ds']= pd.to_datetime(table_data["timez"])
  df['ds']=df['ds'].dt.tz_localize(None)
  df["y"]=table_data["iaq"].apply(pd.to_numeric)
  m = Prophet()
  m.fit(df)
  future = m.make_future_dataframe(periods=72,freq='H')
  forecast = m.predict(future)

  forecast.to_csv("Iaq_forecast.csv")
  test=forecast.to_json(orient="records")
  test=json.dumps(test)

  # ~ fig=m.plot(forecast)
  # ~ print(forecast.tail(10))
  fig= plot_plotly(m, forecast,xlabel='time', ylabel='people count')
  fig.write_image("fig1.png")
  df_2=pd.DataFrame()
  df_2['ds']= pd.to_datetime(table_data["timez"])
  df_2['ds']=df_2['ds'].dt.tz_localize(None)
  df_2["y"]=table_data["occupancylasthour"].apply(pd.to_numeric)
 # print(df)
  m_2 = Prophet()
  m_2.fit(df_2)
  future_2 = m_2.make_future_dataframe(periods=72,freq="H")
  forecast_2 = m_2.predict(future_2)
   # # print(m_2)
  fig_2= plot_plotly(m_2, forecast_2,xlabel='time', ylabel='people count')
  fig_2.write_image("fig2.png")
  forecast_2.to_csv("People_count.csv")
#toilet_occupancy("01-aa-bb-cc-dd-03-02-05","2021-08-09T","2021-08-20T")
toilet_occupancy(sys.argv[1], sys.argv[2], sys.argv[3])
