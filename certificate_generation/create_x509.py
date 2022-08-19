# -*- coding: utf-8 -*-
"""
Created on Mon Aug 30 20:38:24 2021

@author: chand
"""




from OpenSSL import crypto
import os
import sys
from datetime import datetime,timedelta
import whois
import OpenSSL
import asyncio
from azure.iot.device import X509
from azure.iot.device.aio import ProvisioningDeviceClient
from azure.iot.device.aio import IoTHubDeviceClient
from azure.iot.device import Message
import uuid


TYPE_RSA = crypto.TYPE_RSA
TYPE_DSA = crypto.TYPE_DSA

FILE_DIRECTORY = os.path.dirname(os.path.realpath(__file__))



ca_file= FILE_DIRECTORY +"/deviceRootCA.pem"
root_cert_path=FILE_DIRECTORY + "/deviceRootCA.key"

ca_file_key=FILE_DIRECTORY + "/deviceRootCA.key"



#ca_file=FILE_DIRECTORY +"/deviceRootCA.pem"
#root_cert_path=FILE_DIRECTORY + "/deviceRootCA.key"

#ca_file_key=FILE_DIRECTORY + "/deviceRootCA.key"
def cat(outfilename, *infilenames):
    with open(outfilename, 'w') as outfile:
        for infilename in infilenames:
            with open(infilename) as infile:
                for line in infile:
                    if line.strip():
                        outfile.write(line)
                        
                        
                        
with open(ca_file, "r") as my_cert_file:
    my_cert_text = my_cert_file.read()
    ca_cert = crypto.load_certificate(crypto.FILETYPE_PEM, my_cert_text)



with open(ca_file_key, "r") as my_cert_file:
    my_cert_text = my_cert_file.read()
    ca_key = crypto.load_privatekey(crypto.FILETYPE_PEM, my_cert_text)



"""
Requirments
 *Libraries
 *pyOpenSSL
 *whois
Files
 *"deviceRootCA.key"(Genreated template key for our appilication)
 *"deviceRootCA.pem"
 *"AmazonRootCA1.pem"
Makes sure all the files are in same path as python code
Verfication 
    *After running of this python file connectTimeoutException() will come.
    To verify create certifaction registration
        *login to AWS IOT 
        * Go IOT Core service
        * Check Manage things, a new thing with the common name provided in this code will be availble
        * Check MQTT
            MQTT can be checked using
            host=host
            port=8883
            tls
            cert=commonname_cert +.pem
            key=commonname_key +.pem
        
            topic=anytopic
            Using this generated files from mqtt can be verified
        

Generates x509 certificates and registers AWS things using mqtt API call valid for 10 years
Input Parameters
cn=Comman_name(AWS Thingsname)
c=country(eg:EU)
st=state(eg:Hamburg)
l=location(city eg:Hamburg)
o=organization name
ou=organization Unit
emailAddress=email
exp_days=Validation period of certificate in days


Output

commonname +.key(Used for further Mqtt Communication)
commonname +.csr
commonname +.crt(Used for further Mqtt Communication)
"deviceROOT" + commonname+.crt(Used just for authentification)




"""

def generate_x509(output_path,cn, c,st,l,o,ou,emailAddress,exp_days):
     print("----------",cn, c,st,l,o,ou,emailAddress,exp_days)
     keypath =  output_path + '/' +  cn + '_key.pem'
     csrpath =  output_path + '/' +  cn  +  '.csr'
     crtpath = output_path + '/'+ cn  +  '_cert.pem'
     key = crypto.PKey()
     if os.path.exists(keypath):
        print ("Certificate file exists, aborting.")
        print (keypath)
        sys.exit(1)
    #Else write the key to the keyfile
     else:
        print("Generating Key Please standby")
        key.generate_key(TYPE_RSA, 2048)
        f = open(keypath, "wb")
        print(keypath)
        f.write(crypto.dump_privatekey(crypto.FILETYPE_PEM, key))
        f.close()
     
     req = crypto.X509Req()
     req.get_subject().CN = cn
     req.get_subject().C = c
     req.get_subject().ST = st
     req.get_subject().L = l
     req.get_subject().O = o
     req.get_subject().OU = ou
     req.get_subject().emailAddress = emailAddress
     req.set_pubkey(key)
     req.sign(key, "sha256")
     cert = crypto.X509()
     cert.get_subject().CN = cn
     cert.get_subject().C = c
     cert.get_subject().ST = st
     cert.get_subject().L = l
     cert.get_subject().O = o
     cert.get_subject().OU = ou
     cert.get_subject().emailAddress = emailAddress
     cert.set_serial_number(1000)
     cert.gmtime_adj_notBefore(0)
     cert.gmtime_adj_notAfter(exp_days*24*60*60)
     cert.set_issuer(ca_cert.get_subject())
     cert.set_pubkey(key)
     cert.sign(ca_key, "sha256")
     if os.path.exists(crtpath):
            print ("Certificate File Exists, aborting.")
            print (crtpath)
     else:
        f = open(crtpath, "wb")
        f.write(crypto.dump_certificate(crypto.FILETYPE_PEM, cert))
        f.close()
        root_cert_path=output_path + '/deviceROOT'+ cn  +  '.pem' #crt
        cat(root_cert_path,crtpath, crtpath,ca_file)
        print ("CRT Stored Here :" + crtpath)
        root_cert_path="deviceROOT" + crtpath
        print ("CRT +deviceRoot Stored Here :deviceROOT" + crtpath)
        


print("----------argv--------",sys.argv)     
#Please give new comman name(1st parameter) to before running code     
#generate_x509(sys.argv[1],sys.argv[2],sys.argv[3],sys.argv[4],sys.argv[5],sys.argv[6],sys.argv[6],3650)
generate_x509(sys.argv[1], sys.argv[2], sys.argv[3],"Hamburg","Hamburg","AMT","AMT-UNIT-1",sys.argv[4],3650)
