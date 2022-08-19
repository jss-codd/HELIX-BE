import mqtt from "mqtt";
import fs from "fs";
import uuid4 from "uuid4";
import path from 'path'
// const dta=require("./dta.json")
// var cert="ca.crt";
let __dirname = path.join(path.resolve(),"../../certificate_generation")
console.log("--------------",path.join(path.resolve(),"../../certificate_generation"))
var caFile = fs.readFileSync(`${__dirname}/AmazonRootCA1.pem`);
//if using client certificates
var KEY = fs.readFileSync(`${__dirname}/test_device.key`);
var CERT = fs.readFileSync(`${__dirname}/test_device.crt`);
// const dta = require("./dta.json")


// mqtt://a3njal8wrtnp6k-ats.iot.eu-central-1.amazonaws.com:8883



var options2 = {
  clientId:"test" + uuid4(),
  clean: true,
  connectTimeout: 4000,
  //port:8883,
  //host:'192.168.1.71',
  //protocol:'mqtts',
  rejectUnauthorized: false,
  //if using client certificates
  key: KEY,
  cert: CERT,
  //
  ca: caFile

}


// })



// const host = '3.125.248.157';
// const port = '8883'


const host = 'a3njal8wrtnp6k-ats.iot.eu-central-1.amazonaws.com';
const port = '8883'
// import uuid4 from "uuid4";

const connectUrl = `mqtt://${host}:${port}`
//
// var options={
// clientId: "test" + uuid4(),
// clean: true,
// connectTimeout: 4000,

// }


var message={
  "_id": "6283b2c93679657c7e4a80ad",
  "device_id": "eeee",
  "code": "627cca6e2179f0a93ed9591a",
  "description": "Wellness",
  "gateway": {
    "_id": "6283b1b53679657c7e4a7f9e",
    "gateway_id": "dca632d93183",
    "region": "eu",
    "city": "Harburg",
    "state": "Hamburg",
    "company": "AMT",
    "company_unit": "AMT",
    "washroom": {
      "sensors": [
        "6283b1b53679657c7e4a7fa1",
        "6283b2ab3679657c7e4a808e",
        "6283b2c93679657c7e4a80ad"
      ],
      "_id": "6283b1b53679657c7e4a7f95",
      "type": "female",
      "createdAt": "2022-05-17T14:31:17.135Z",
      "updatedAt": "2022-05-17T14:35:53.686Z",
      "__v": 0
    },
    "createdAt": "2022-05-17T14:31:17.145Z",
    "updatedAt": "2022-05-17T14:31:17.145Z",
    "__v": 0,
    "floor": {
      "washrooms": [
        "6283b1b53679657c7e4a7f95"
      ],
      "rooms": [],
      "_id": "6283b1b53679657c7e4a7f97",
      "sign": "B1",
      "description": "Wellness",
      "index": -1,
      "createdAt": "2022-05-17T14:31:17.136Z",
      "updatedAt": "2022-05-17T14:35:53.679Z",
      "__v": 0
    },
    "infrastructure": {
      "floors": [
        "6283b1b53679657c7e4a7f97"
      ],
      "_id": "6283b1b53679657c7e4a7f99",
      "name": "spn spn",
      "location": "indore",
      "type": "building",
      "createdAt": "2022-05-17T14:31:17.138Z",
      "updatedAt": "2022-05-17T14:35:53.681Z",
      "__v": 0
    }
  },
  "createdAt": "2022-05-17T14:35:53.684Z",
  "updatedAt": "2022-05-17T14:35:53.684Z",
  "__v": 0,
  "washroom": {
    "sensors": [
      "6283b1b53679657c7e4a7fa1",
      "6283b2ab3679657c7e4a808e",
      "6283b2c93679657c7e4a80ad"
    ],
    "_id": "6283b1b53679657c7e4a7f95",
    "type": "female",
    "createdAt": "2022-05-17T14:31:17.135Z",
    "updatedAt": "2022-05-17T14:35:53.686Z",
    "__v": 0
  },
  "floor": {
    "washrooms": [
      "6283b1b53679657c7e4a7f95"
    ],
    "rooms": [],
    "_id": "6283b1b53679657c7e4a7f97",
    "sign": "B1",
    "description": "Wellness",
    "index": -1,
    "createdAt": "2022-05-17T14:31:17.136Z",
    "updatedAt": "2022-05-17T14:35:53.679Z",
    "__v": 0
  },
  "infrastructure": {
    "floors": [
      "6283b1b53679657c7e4a7f97"
    ],
    "_id": "6283b1b53679657c7e4a7f99",
    "name": "spn spn",
    "location": "indore",
    "type": "building",
    "createdAt": "2022-05-17T14:31:17.138Z",
    "updatedAt": "2022-05-17T14:35:53.681Z",
    "__v": 0
  },
  "sensor_configuration": [
    {
      "label": "Temperature",
      "defaultValue": 25,
      "unit": "C",
      "startRange": -100,
      "endRange": 100,
      "description": "Temperature",
      "selectedValue": 25
    },
    {
      "label": "Atm Pressure",
      "defaultValue": 1000,
      "unit": "Hpa",
      "startRange": 0,
      "endRange": 2000,
      "description": "Atm Pressure",
      "selectedValue": 1000
    },
    {
      "label": "Humidity",
      "defaultValue": 50,
      "unit": "%",
      "startRange": 0,
      "endRange": 100,
      "description": "Humidity",
      "selectedValue": 50
    },
    {
      "label": "IAQ",
      "defaultValue": 200,
      "unit": "Index",
      "startRange": 0,
      "endRange": 500,
      "description": "Indoor Air Quality",
      "selectedValue": 200
    },
    {
      "label": "eCo2",
      "defaultValue": 400,
      "unit": "ppm",
      "startRange": 400,
      "endRange": 5000,
      "description": "eCo2",
      "selectedValue": 400
    }
  ],
  "Device_id": "01aabbccdd030402",
  "occupancyStatus": "0",
  "occupancyCount": "0",
  "iaq": "53.6",
  "staticIaqValue": "37.5",
  "co2Value": "550.0",
  "voc": "0.6",
  "gasValue": "243346",
  "temperature": "23.9",
  "pressure": 1022,
  "humidity": "44.4",
  "lux": "20.0",
  "batVolt": "0",
  "timestamp": new Date()
}


var topic="washroom/wewe/pub";

let count =0




var client  = mqtt.connect(connectUrl,options2);

// console.log("-----------client----",client);
console.log("connected flag  " + client.connected);
client.on("connect",function(){	
console.log("connected  "+ client.connected);
// client.subscribe(topic)
 client.publish(topic,JSON.stringify(message))

 setInterval(()=>{message.iaq = count ; message.timestamp= new Date(); count = count +1   ;client.publish(topic,JSON.stringify(message)); console.log("---dta publish")}, 5000);

})



client.on('message',function(topic, message, packet){
	console.log("message is "+ JSON.stringify(JSON.parse(message.toString())));
	console.log("topic is "+ topic);
});
