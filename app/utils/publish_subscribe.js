// import mqtt from 'mqtt'
// import db from "../models/index.js";
// import fs from "fs";
// import uuid4 from "uuid4";
// // import { pool } from "../../index.js";
// // import { createConnectionWithCertficates,createConnectionwithoutCertificates } from './mqtt_utilities.js';

// const PublishData = db.publish_data
// const SensorData = db.sensor_data;

// export const pub_sub_method = async (gateway_id,topicname,hosturl,port,keyFileName,crtFileName,rootCAFileName,device_id) => {




//   var caFile = fs.readFileSync("certificate_generation/AmazonRootCA1.pem");
//   //if using client certificates
//   var KEY = fs.readFileSync(`certificate_generation/test_device.key`);
//   var CERT = fs.readFileSync(`certificate_generation/test_device.crt`);

//   var options = {
//     clientId: "test" + uuid4(),
//     clean: true,
//     connectTimeout: 4000,
//     //port:8883,
//     //host:'192.168.1.71',
//     //protocol:'mqtts',
//     rejectUnauthorized: false,
//     //if using client certificates
//     key: KEY,
//     cert: CERT,
//     ca: caFile,
//   };

//   var client = mqtt.connect(
//     "mqtt://a3njal8wrtnp6k-ats.iot.eu-central-1.amazonaws.com:8883",
//     options
//   );

//   let topic = `washroom/${gateway_id}/pub`;

//   let client2 = "";
//   let client3 = "";


//   client.on("connect", async function () {
  
//   });
// //   //
// //   let data_exits = await SensorData.exists({ topic: topic });
//   let data_exits = false


//   client.on("connect", async function () {
//     console.log("---gatway connetcetd");
//   });

//     client.subscribe(topic, function () {
//       console.log("--sub-1--", topic);
//     });


//   // clinet 2-----------------------------------
//   // if cert file are prestent---------------

//   // if (
//   //   keyFileName !== "undefined" &&
//   //   crtFileName !== "undefined" &&
//   //   rootCAFileName !== "undefined" &&
//   //   hosturl !== "undefined" &&
//   //   topicname !== "undefined" &&
//   //   port !== "undefined"
//   // ) {
//   //   var caFile2 = fs.readFileSync(`upload/${rootCAFileName}`);
//   //   //if using client certificates
//   //   var KEY2 = fs.readFileSync(`upload/${keyFileName}`);
//   //   var CERT2 = fs.readFileSync(`upload/${crtFileName}`);

//   //   const host = hosturl;

//   //   const connectUrl = `mqtt://${host}:${port}`;
//   //   console.log("----con url", connectUrl);
//   //   //
//   //   var options2 = {
//   //     clientId: `test` + uuid4(),
//   //     clean: true,
//   //     connectTimeout: 4000,
//   //     //port:8883,
//   //     //host:'192.168.1.71',
//   //     //protocol:'mqtts',
//   //     rejectUnauthorized: false,
//   //     //if using client certificates
//   //     key: KEY2,
//   //     cert: CERT2,
//   //     //
//   //     ca: caFile2,
//   //   };

//   //   //check alreday connected  or  not ------

//   //   client2 = mqtt.connect(connectUrl, options2);
//   //   console.log("connected 2flag  " + client2.connected);
//   //   client2.on("connect", async function () {
//   //     // const myPromise = await new Promise((resolve, reject) => {
//   //     //   client2.unsubscribe(topic, function () {
//   //     //     console.log("--unsubcribe----3");
//   //     //     resolve("ddta")
//   //     //   })
//   //     // });
//   //     console.log("connected---------------2  " + client2.connected);
//   //     // client2.subscribe(topicname, function () {
//   //     //   console.log("----syub -topic 2-", topicname);
//   //     // })
//   //   });
//   // } else if (
//   //   hosturl !== "undefined" &&
//   //   topicname !== "undefined" &&
//   //   port !== "undefined"
//   // ) {
//   //   let hostUrlExits = await PublishData.exists({ host: hosturl, port: port });
//   //   console.log(
//   //     "-----------------******************----------------------",
//   //     hostUrlExits
//   //   );

//   //   //--client 3
//   //   const host = hosturl;

//   //   const connectUrl2 = `mqtt://${host}:${port}`;
//   //   console.log("----con url", connectUrl2);

//   //   var options = {
//   //     clientId: `test` + uuid4(),
//   //     clean: true,
//   //     connectTimeout: 4000,
//   //   };

//   //   console.log("----conn---", connectUrl2);

//   //   var topic2 = "abc";

//   //   var message1 = {
//   //     message: "Hello from AWS IoT console",
//   //   };
//   //   // console.log("-------publish0000---", publish);

//   //   client3 = mqtt.connect(connectUrl2, options);

//   //   let pub_data_exits = await PublishData.exists({ topic: topicname });

//   //   if (!pub_data_exits) {
//   //     const pub_data_update = await PublishData.findOneAndUpdate({device_id: device_id},{
//   //       topic: topicname,
//   //       parent_gateway_topic: topic,
//   //       host: hosturl,
//   //       port: port,
//   //     },{upsert:true});
//   //   }

//   //   console.log("connected3 flag  " + client3.connected);
//   //   client3.on("connect", async function () {
//   //     console.log("connecte3d  " + client3.connected);
//   //     // const myPromise = await new Promise((resolve, reject) => {
//   //     //   client3.unsubscribe(topicname, function () {
//   //     //     console.log("--unsubcribe----3");
//   //     //     resolve("ddta")
//   //     //   })
//   //     // });
//   //   });
//   // }

//   // subcribe clinet 1 and publis 2

//   client.on("message", async function (topic, payload, packet) {
   
//    const pubGatewayTopicList =  await PublishData.find({parent_gateway_topic:topic})
     

//     // if (
//     //   keyFileName !== "undefined" &&
//     //   crtFileName !== "undefined" &&
//     //   keyFileName !== "undefined" &&
//     //   hosturl !== "undefined" &&
//     //   topicname !== "undefined" &&
//     //   port !== "undefined"
//     // ) {
//     //   client2.publish(
//     //     topicname,
//     //     JSON.stringify(JSON.parse(payload.toString()))
//     //   );
//     // } else if (
//     //   hosturl !== "undefined" &&
//     //   topicname !== "undefined" &&
//     //   port !== "undefined"
//     // ) {
//     //   client3.publish(
//     //     topicname,
//     //     JSON.stringify(JSON.parse(payload.toString()))
//     //   );
//     // }
//     try {
//       let data_exits = await SensorData.exists({ topic: topic });
     

//       if (!data_exits) {
//         let create = await SensorData.create({
//           topic: topic,
//           data: JSON.parse(payload.toString()),
//         });
//       }

     

//       let up = await SensorData.updateOne(
//         { topic: topic },
//         { $push: { data: JSON.parse(payload.toString()) } }
//       );
     
//       let dta = JSON.parse(payload.toString());
     

//       // pool.query(
//       //   'INSERT INTO sensordata (device_id,code,description,gateway,__v,washroom,floor,infrastructure,"Esp_Device_id","Esp_Fw_ver","stm_Fw_ver",stm_id,"Application_type","Bin_percent","Sensor_Reading_Avg_Distnce",timestamp,"createdAt","updatedAt","Bin_Max_Distance",_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)',
//       //   [
//       //     dta.device_id,
//       //     dta.code,
//       //     dta.description,
//       //     dta.gateway,
//       //     dta.__v,
//       //     dta.washroom,
//       //     dta.floor,
//       //     dta.infrastructure,
//       //     dta.Esp_Device_id,
//       //     dta.Esp_Fw_ver,
//       //     dta.stm_Fw_ver,
//       //     dta.stm_id,
//       //     dta.Application_type,
//       //     dta.Bin_percent,
//       //     dta.Sensor_Reading_Avg_Distnce,
//       //     new Date(dta.timestamp),
//       //     new Date(dta.createdAt),
//       //     new Date(dta.updatedAt),
//       //     dta.Bin_Max_Distance,
//       //     dta._id,
//       //   ],
//       //   (error, results) => {
//       //     if (error) {
//       //       console.log("--------error---", error);
//       //       throw error;
//       //     }
//       //     console.log("---res===", results);
//       //   }
//       // );
//     } catch (error) {
//       console.log("--error", error);
//     }
//   });
// };
// pub_sub_method();
