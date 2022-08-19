// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.


// var fs = require('fs');
import fs from 'fs'
import pem from 'pem'
// var pem = require('pem');
// var chalk = require('chalk');
import chalk from 'chalk'
// var camelcase = require('camelcase');
import  camelcase from 'camelcase'
import pkg11 from 'azure-iot-provisioning-service';
console.log("--------------",pkg11)
const provisioningServiceClient = pkg11.ProvisioningServiceClient;
console.log("--------------",provisioningServiceClient)

// console.log("--------------",provisioningServiceClient);
// import  provisioningServiceClient from 'azure-iot-provisioning-service'
// console.log("--------------",provisioningServiceClient);


import   mqttPkg from 'azure-iot-device-mqtt';
const iotHubTransport = mqttPkg.Mqtt


import pkg from 'azure-iot-device';
const { Client ,Message } = pkg;

import pkg3 from 'azure-iot-provisioning-device-mqtt';
const Transport = pkg3.Mqtt;


// const {Transport} = pkgMqtt

import { X509Security}  from 'azure-iot-security-x509'
// const { X509Security}  = x509Sec


// You can change the following using statement if you would like to try another protocol.
// var Transport = require('azure-iot-provisioning-device-mqtt').Mqtt;
// var Transport = require('azure-iot-provisioning-device-amqp').Amqp;
// var Transport = require('azure-iot-provisioning-device-amqp').AmqpWs;
// var Transport = require('azure-iot-provisioning-device-http').Http;
// var Transport = require('azure-iot-provisioning-device-mqtt').MqttWs;

// var X509Security = require('azure-iot-security-x509').X509Security;
// var ProvisioningDeviceClient = require('azure-iot-provisioning-device').ProvisioningDeviceClient;
import pkg1 from 'azure-iot-provisioning-device';
const {ProvisioningDeviceClient} = pkg1;
import path from 'path';
import yargs  from "yargs";




var argv = yargs(process.argv.slice(2))
  .usage('Usage: $0 --deviceid <DEVICE ID>')
  .option('deviceid', {
    alias: 'd',
    describe: 'Unique identifier for the device that shall be created',
    type: 'string',
    demandOption: true
  })
.argv;

console.log("--------argv00000--------------", argv );



var commonName=argv.deviceid;


var connectionString = "HostName=dpsraspi.azure-devices-provisioning.net;SharedAccessKeyName=provisioningserviceowner;SharedAccessKey=1e9yFNRDbj9EYOZSLXOC4fN8h7IRNYnZk9494DNBJOA=";
var deviceID=commonName;

var certFile = path.join(path.resolve(),"./",argv.p, "./", deviceID + "_cert.pem");
var keyFile = path.join(path.resolve(),"./",argv.p, "./", deviceID + "_key.pem");

if (!fs.existsSync(certFile)) {
  console.log('Certificate File not found:' + certFile);
  process.exit();
} else {
    var certificate = fs.readFileSync(certFile, 'utf-8').toString();
   
}
var serviceClient = provisioningServiceClient.fromConnectionString(connectionString);
console.log("---------------certificate-------",certificate);
var enrollment = {
  registrationId: deviceID,
  deviceID: deviceID,
  attestation: {
    type: 'x509',
    x509: {
      clientCertificates: {
        primary: {
          certificate: certificate
        },
        secondary: {
          certificate: certificate
        }
      }
    }
  }
};

serviceClient.createOrUpdateIndividualEnrollment(enrollment, function (err, enrollmentResponse) {
  if (err) {
    console.log('error creating the individual enrollment: ' + err);
  } else {
    console.log("enrollment record returned: " + JSON.stringify(enrollmentResponse, null, 2));
  }
});
// serviceClient.createOrUpdateIndividualEnrollment(enrollment, function (err, enrollmentResponse) {
//   if (err) {
//     console.log('error creating the individual enrollment: ' + err);
//   } else {
//     console.log("enrollment record returned: " + JSON.stringify(enrollmentResponse, null, 2));
//   }
// });
var provisioningHost = "dpsraspi.azure-devices-provisioning.net";
var idScope = "0ne0026BBCD";
var registrationId =commonName;
var deviceCert = {
  cert: fs.readFileSync(certFile).toString(),
  key: fs.readFileSync(keyFile).toString(),
  pass_phrase:commonName
};

var transport = new Transport();
var securityClient = new X509Security(registrationId, deviceCert);
var deviceClient = ProvisioningDeviceClient.create(provisioningHost, idScope, transport, securityClient);

// Register the device.  Do not force a re-registration.
deviceClient.register(function(err, result) {
  if (err) {
    console.log("error registering device: " + err);
    process.exit(0);
  } else {
    console.log('registration succeeded');
    process.exit(1)
    // console.log('assigned hub=' + result.assignedHub);
    // console.log('deviceId=' + result.deviceId);
    // var connectionString = 'HostName=' + result.assignedHub + ';DeviceId=' + result.deviceId + ';x509=true';
    // var hubClient = Client.fromConnectionString(connectionString, iotHubTransport);
    // hubClient.setOptions(deviceCert);
    // hubClient.open(function(err) {
    //   if (err) {
    //     console.error('Failure opening iothub connection: ' + err.message);
    //   } else {
    //     console.log('Client connected');
    //     var message = new Message('Hello world');
    //     hubClient.sendEvent(message, function(err, res) {
    //       if (err) console.log('send error: ' + err.toString());
    //       if (res) console.log('send status: ' + res.constructor.name);
    //       process.exit(1);
    //     });
    //   }
    // });
  }
});
