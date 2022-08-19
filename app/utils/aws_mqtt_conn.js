// import {
//   createConnectionWithCertficates,
//   createConnectionWithoutCertificates,
// } from "./mqtt_utilities.js";
// import db from "../models/index.js";
// import pg from "pg";

// export let aws_mqtt_conn_client = "";
// export let subscribedGatewayTopicLists = [];
// import { triggers } from "./trigger_functions.js";
// import { SOCKET } from "../../index.js";

// const Pool = pg.Pool;
// const Gateway = db.gateway;
// const PublishData = db.publish_data;
// const SensorData = db.sensor_data;
// const GatewayTopicInfo = db.gateway_topic_info;
// const User = db.user;

// let keyPath = "certificate_generation/test_device.key";
// let crtPath = "certificate_generation/test_device.crt";
// let rooCAPath = "certificate_generation/AmazonRootCA1.pem";
// let host = "a3njal8wrtnp6k-ats.iot.eu-central-1.amazonaws.com";
// let port = "8883";
// let topic = ""; // initally no topic is

// export const filterSensorData = (sensorData) => {
//   return sensorData.map((dta) => {
//     return {
//       occupancyCount: dta.occupancyCount,
//       iaq: dta.iaq,
//       gas: dta.gasValue,
//       temperature: dta.temperature,
//       humidity: dta.humidity,
//       pressure: dta.pressure,
//       lux: dta.lux,
//       batVolt: dta.batVolt,
//       timestamp: new Date(dta.timestamp),
//       device_id: dta.device_id,
//     };
//   });
// };

// export const aws_iot_client_conn = async () => {
//   let aws_client = await createConnectionWithCertficates(
//     topic,
//     host,
//     port,
//     keyPath,
//     crtPath,
//     rooCAPath
//   );
//   aws_mqtt_conn_client = aws_client.client;

//   let gatewayLists = await Gateway.find({}).select("gateway_id");
//   let gatewayTopicLists = gatewayLists.map(
//     (d) => `washroom/${d.gateway_id}/pub`
//   );

//   //----ractify this-----------------
//   aws_mqtt_conn_client.on("connect", async function () {});

//   for (let x of gatewayTopicLists) {
//     if (!subscribedGatewayTopicLists.includes(x)) {
//       aws_mqtt_conn_client.subscribe(x, function () {
//         subscribedGatewayTopicLists.push(x);
//       });
//     }
//   }

//   //   aws_mqtt_conn_client.subscribe(["t1","t2","t3","t4","t5","t6","t7","t8","t9"], function () {
//   //     console.log("--subgateway---", gatewayTopicLists);
//   //     subscribedGatewayTopicLists = gatewayLists;
//   //   });
//   // messages  recives from topics ------

//   aws_mqtt_conn_client.on("message", async function (topic, payload, packet) {
//     try {
//       let dta = JSON.parse(payload.toString());
//       console.log("--device_ id--------", dta.device_id);

//       let message_deviceId = dta.device_id;

//       let gateway_topic_info = await GatewayTopicInfo.findOne({
//         device_id: message_deviceId,
//       });

//       if (gateway_topic_info !== null) {
//         //   ;/// need to be fixed
//         let userInfo = await User.findOne({ sub: gateway_topic_info.subId });
//         //  console.log("--------------userinfo--------------------", userInfo);

//         const publishTopic = await PublishData.findOne({
//           device_id: dta.device_id,
//         });
//         console.log("--------publish----topic---", publishTopic);

//         if (publishTopic !== null) {
//           if (publishTopic.keyPath !== undefined) {
          
//             let w_client = await createConnectionWithCertficates(
//               publishTopic.topic,
//               publishTopic.host,
//               publishTopic.port,
//               publishTopic.keyPath,
//               publishTopic.crtPath,
//               publishTopic.rootCAPath
//             );
//               //  console.log("--client---", w_client);
//             if (publishTopic.device_id === dta.device_id) {
//               console.log("--device id---111-",publishTopic.topic);
//               await w_client.client.publish(
//                 publishTopic.topic,
//                 JSON.stringify(JSON.parse(payload))
//               );
//             }
//           } else {
//             let w_client = await createConnectionWithoutCertificates(
//               publishTopic.topic,
//               publishTopic.host,
//               publishTopic.port
//             );

//             if (publishTopic.device_id === dta.device_id) {
//               console.log("--device id--125--",publishTopic.topic);
             
//               await w_client.client.publish(
//                 publishTopic.topic,
//                 JSON.stringify(JSON.parse(payload))
//               );
//             }
//           }
//         }

//         let up = await SensorData.create({
//           topic: topic,
//           data: JSON.parse(payload.toString()),
//         });

//         // console.log("--updated---", up);

//         // create pool

//         const pool = new Pool({
//           host: process.env.POSTGRES_HOST,
//           user: process.env.POSTGRES_USERNAME,
//           database: process.env.DATABASE_NAME,
//           password: process.env.POSTGRES_PASSWORD,
//           port: process.env.POSTGRES_PORT,
//         });
//         pool.on("error", (err, client) => {
//           console.error("Unexpected error on idle client", err);
//           process.exit(-1);
//         });

//         const execute = async (query) => {
//           let client;
//           try {
//             client = await pool.connect();
//             // gets connection
//             await client.query(query); // sends queries
//             return true;
//           } catch (error) {
//             console.error(error);
//             return false;
//           } finally {
//             // await client.end();         // closes connection
//             client && client.release(true);
//           }
//         };

//         let subId = userInfo.sub.split("-").join("");

//         const tableName = `sensordata_${userInfo.given_name}_${subId}`;

//         const text2 = `CREATE TABLE IF NOT EXISTS ${tableName} (
//                     _id  VARCHAR (50),
//                     device_id VARCHAR (50),
//                     code VARCHAR ( 50 ) ,
//                     description VARCHAR ( 255 ) ,
//                     "Device_id" VARCHAR (25) ,
//                     "createdAt" TIMESTAMP ,
//                       "updatedAt" TIMESTAMP,
//                       "occupancyStatus" REAL,
//                       "occupancyCount" REAL,
//                       "iaq" REAL,
//                       "staticIaqValue" REAL,
//                       "co2Value" REAL,
//                       "voc" REAL,
//                       "gasValue" REAL,
//                       temperature REAL,
//                       pressure REAL,
//                       humidity REAL,
//                       lux REAL,
//                       "batVolt" REAL,
//                       timestamp TIMESTAMP,
//                       gateway JSON,
//                       washroom JSON,
//                       floor JSON,
//                       infrastructure JSON,
//                       sensor_configuration JSON
                  
//                   );`;

//         await execute(text2).then((result) => {
//           if (result) {
//             console.log("table  created-- successfully");
//           }
//         });

//         await pool.query(
//           `INSERT INTO ${tableName} (_id,device_id,code,description,gateway,washroom,floor,infrastructure,timestamp,"createdAt","updatedAt","Device_id","occupancyCount","occupancyStatus","iaq","staticIaqValue","co2Value","voc","gasValue","temperature","pressure","humidity","lux","batVolt","sensor_configuration") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)`,
//           [
//             dta._id,
//             dta.device_id,
//             dta.code,
//             dta.description,
//             dta.gateway,
//             dta.washroom,
//             dta.floor,
//             dta.infrastructure,
//             new Date(dta.timestamp),
//             new Date(dta.createdAt),
//             new Date(dta.updatedAt),
//             dta.Device_id,
//             parseFloat(dta.occupancyCount),
//             parseFloat(dta.occupancyStatus),
//             parseFloat(dta.iaq),
//             parseFloat(dta.staticIaqValue),
//             parseFloat(dta.co2Value),
//             parseFloat(dta.voc),
//             parseFloat(dta.gasValue),
//             parseFloat(dta.temperature),
//             parseFloat(dta.pressure),
//             parseFloat(dta.humidity),
//             parseFloat(dta.lux),
//             parseFloat(dta.batVolt),
//             JSON.stringify(dta.sensor_configuration),
//           ],
//           (error, results) => {
//             if (error) {
//               console.log("--------error abc--s---", error);
//               throw error;
//             }
//             console.log("-------------data save to pg------------", results);

//             const filterData = {
//               occupancyCount: parseFloat(dta.occupancyCount),
//               iaq: parseFloat(dta.iaq),
//               co2: parseFloat(dta.co2Value),
//               temperature: parseFloat(dta.temperature),
//               humidity: parseFloat(dta.humidity),
//               pressure: parseFloat(dta.pressure),
//               lux: parseFloat(dta.lux),
//               batVolt: parseFloat(dta.batVolt),
//               timestamp: new Date(dta.timestamp),
//               device_id: dta.device_id,
//             };

//             if (SOCKET?.connected) {
//               SOCKET.emit(userInfo.sub, JSON.stringify(filterData));
//               console.log("message sens to  subid--", userInfo.sub);
//               pool.end().then(() => console.log("pool has ended"));
//             }
//           }
//         );
//       }
//     } catch (error) {
//       console.log("--error", error);
//     }
//   });
// };

// // aws_iot_client_conn();


