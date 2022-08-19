# -*- coding: utf-8 -*-
"""
Created on Tue Aug 31 10:43:53 2021

@author: chand
"""
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient
import json
host = "a3njal8wrtnp6k-ats.iot.eu-central-1.amazonaws.com"
port = 8883



CAPath="AmazonRootCA1.pem" 
dev_key_path="try_dev_1234.key"
dev_cert_path="try_dev_1234.crt"
test_client="try_dev_1234"
test_topic="try_dev_1234/test"
test_message={
    
    "test":"hello"
    
    }
def on_AWS_publish():
    print("on_publish")

def test_mqtt(client,rootCAPath,keypath,root_cert_path,topic):
     myAWSIoTMQTTClient = AWSIoTMQTTClient(client)
     myAWSIoTMQTTClient.configureEndpoint(host,port)
     myAWSIoTMQTTClient.configureCredentials(rootCAPath, keypath, root_cert_path)
    
    # AWSIoTMQTTClient connection configuration
     myAWSIoTMQTTClient.configureAutoReconnectBackoffTime(1, 32, 20)
     myAWSIoTMQTTClient.configureOfflinePublishQueueing(-1)  # Infinite offline Publish queueing
     myAWSIoTMQTTClient.configureDrainingFrequency(2)  # Draining: 2 Hz
     myAWSIoTMQTTClient.configureConnectDisconnectTimeout(10)  # 10 sec
     myAWSIoTMQTTClient.configureMQTTOperationTimeout(5)  
     myAWSIoTMQTTClient.connect()
     myAWSIoTMQTTClient.on_publish= on_AWS_publish
     aws_message=json.dumps(test_message)
     myAWSIoTMQTTClient.publish(topic,aws_message,1)   
     
#Client name,AmazonRootCA certificate, Devicekey path, device certificate path
test_mqtt(test_client,CAPath,dev_key_path,dev_cert_path,test_topic)