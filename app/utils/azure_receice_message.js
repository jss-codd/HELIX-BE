// Copyright (c) Microsoft Corporation.
// Licensed under the MIT Licence.

/*
  This sample demonstrates how to use the Microsoft Azure Event Hubs Client for JavaScript to 
  read messages sent from a device. Please see the documentation for @azure/event-hubs package
  for more details at https://www.npmjs.com/package/@azure/event-hubs

  For an example that uses checkpointing, follow up this sample with the sample in the 
  eventhubs-checkpointstore-blob package on GitHub at the following link:

  https://github.com/Azure/azure-sdk-for-js/blob/master/sdk/eventhub/eventhubs-checkpointstore-blob/samples/javascript/receiveEventsUsingCheckpointStore.js
*/


import { EventHubConsumerClient } from '@azure/event-hubs';
import pg from "pg";
import { SOCKET } from "../../index.js";
import db from "../models/index.js";
import { createConnectionWithCertficates, createConnectionWithoutCertificates ,mqtt_client_list } from '../utils/mqtt_utilities.js';
const Pool = pg.Pool;
const PublishData = db.publish_data;
const SensorData = db.sensor_data;
const GatewayTopicInfo = db.gateway_topic_info;
const User = db.user;

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USERNAME,
  database: process.env.DATABASE_NAME,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

console.log("----------azure script running");

// If you have access to the Event Hub-compatible connection string from the Azure portal, then
// you can skip the Azure CLI commands above, and assign the connection string directly here.
const connectionString = `Endpoint=sb://iothub-ns-sensortile-8925923-c61262973e.servicebus.windows.net/;SharedAccessKeyName=iothubowner;SharedAccessKey=QcZR2cKTogLk040HsLvDk1e6hcdK7yCGFo3iCzEBSNA=;EntityPath=sensortilerpihub`;

var printError = function (err) {
  console.log(err.message);
};
let count =0

// Display the message content - telemetry and properties.
// - Telemetry is sent in the message body
// - The device can add arbitrary properties to the message
// - IoT Hub adds system properties, such as Device Id, to the message.
var printMessages = async function (messages) {
  for (const message of messages) {

    console.log("----mqtt_client_list----mqtt_client_list length---",mqtt_client_list.length);

    // console.log("Telemetry received: ",message.body);
    //  console.log("---------------------",JSON.stringify(message.body))


    try {
      let dta = JSON.parse(JSON.stringify(message.body))
      const newDta = {}

      for (const property in dta) {
        if (!isNaN(dta[property]) && property.toLowerCase() !== "device_id") {
          newDta[property.toLowerCase()] = +dta[property]
        } else {
          newDta[property.toLowerCase()] = dta[property]
        }
      }

      dta = newDta;
      console.log("--this is new dta id--------", dta.device_id);
      let message_deviceId = dta.device_id;

      let gateway_topic_info = await GatewayTopicInfo.findOne({
        device_id: message_deviceId,
      });

      if (gateway_topic_info !== null) {
        //   ;/// need to be fixed
        let userInfo = await User.findOne({ sub: gateway_topic_info.subId });
        //  console.log("--------------userinfo--------------------", userInfo);

        const publishTopic = await PublishData.findOne({
          device_id: dta.device_id,
        });
         

        if (publishTopic !== null) {
          if (publishTopic.keyPath !== undefined) {

            let w_client = await createConnectionWithCertficates(
              publishTopic.topic,
              publishTopic.host,
              publishTopic.port,
              publishTopic.keyPath,
              publishTopic.crtPath,
              publishTopic.rootCAPath
            );
            //  console.log("--client---", w_client);
            if (publishTopic.device_id === dta.device_id) {
              // console.log("--device id---111-",publishTopic.topic);
              await w_client.client.publish(
                publishTopic.topic,
                JSON.stringify(dta)
              );
            }
          } else {
            let w_client = await createConnectionWithoutCertificates(
              publishTopic.topic,
              publishTopic.host,
              publishTopic.port
            );

            if (publishTopic.device_id === dta.device_id) {
              // console.log("--device id--125--",publishTopic.topic);

              await w_client.client.publish(
                publishTopic.topic,
                JSON.stringify(dta)
              );
            }
          }
        }

        let up = await SensorData.create({
          topic: "",
          data: dta,
        });

        // console.log("--updated---", up);

        // create pool

        // pool.on("error", (err, client) => {
        //   console.error("Unexpected error on idle client", err);
        //   process.exit(-1);
        // });

        const execute = async (query) => {
          let client;
          try {
            client = await pool.connect();
            // gets connection
            await client.query(query); // sends queries
            return true;
          } catch (error) {
            console.error(error);
            return false;
          } finally {
            // await client.end();         // closes connection
            client && client.release(true);
          }
        };

        let subId = userInfo.sub.split("-").join("");
        // console.log(values, "this the col and value ");

        const tableName = `sensordata_${userInfo.given_name}_${subId}`;

        const text2 = `CREATE TABLE IF NOT EXISTS ${tableName}(
          _id  VARCHAR (255),
          device_id VARCHAR (255));`;

        await execute(text2).then((result) => {
          if (result) {
            console.log("table  created-- successfully");
          }
        });

        let jsonData = {}
        for (const property in dta) {
          //console.log(`${property}: ${object[property]}`);
          jsonData[property.toLowerCase()] = dta[property]
        }
        //var jsonData = dta;
        var text3 = `ALTER TABLE ${tableName} `;
        // Object.keys(dta).map((dt, idx) => {
        //   text3 += `ADD COLUMN IF NOT EXISTS ${dt.toLowerCase()} REAL${Object.keys(dta).length - 1 == idx ? ";" : ","}`
        // });
        let columns = Object.keys(jsonData).map(d => d.toLowerCase())

        columns = columns.filter((dt, idx) => {
          return columns.indexOf(dt) === idx;
        })
        let values = Object.entries(jsonData).map((dt, idx) => {

          if (dt[0] === "timestamp" || dt[0] === "createdAt" || dt[0] === "updatedAt") {
            text3 += `ADD COLUMN IF NOT EXISTS ${dt[0].toLowerCase()} TIMESTAMP${Object.keys(jsonData).length - 1 == idx ? ";" : ","}`
            return new Date(dt[1])
          } else if (typeof dt[1] === "number") {
            text3 += `ADD COLUMN IF NOT EXISTS ${dt[0].toLowerCase()} REAL${Object.keys(jsonData).length - 1 == idx ? ";" : ","}`
            return parseFloat(dt[1]);
          } else if (typeof dt[1] === "object") {
            text3 += `ADD COLUMN IF NOT EXISTS ${dt[0].toLowerCase()} JSON${Object.keys(jsonData).length - 1 == idx ? ";" : ","}`
            return JSON.stringify(dt[1]);
          } else {
            text3 += `ADD COLUMN IF NOT EXISTS ${dt[0].toLowerCase()} VARCHAR (255)${Object.keys(jsonData).length - 1 == idx ? ";" : ","}`
            return dt[1];
          }
        })


        await execute(text3).then((result) => {
          if (result) {
            // console.log("created colums success test3 ");
          }
        });

        let columnsQuary = `(`
        let sequanceNumber = `(`
        columns.map((d, index) => {
          columnsQuary += `${d}${columns.length - 1 === index ? ")" : ","}`
          sequanceNumber += `$${index + 1}${columns.length - 1 === index ? ")" : ","}`
        })

        await pool.query(
          `INSERT INTO ${tableName} ${columnsQuary} VALUES ${sequanceNumber}`,
          values,
          (error, results) => {
            if (error) {
              console.log("--------error abc--s---", error);
              throw error;
            }
            // console.log("-------------data save to pg------------", results);


            for (const [key, value] of Object.entries(dta)) {
              // console.log("-key---",key);

              if (key === "__v") {

                delete dta[`${key}`]

              }
              else if (typeof value === "object" && key !== "device_id" && key !== "timestamp") {

                delete dta[`${key}`]
              }
              else if (typeof value === "string" && key !== "device_id" && key !== "timestamp") {

                delete dta[`${key}`]

              }

            }
            let newData = {}
            // console.log(dta, "dta---------");
            for (const [key, value] of Object.entries(dta)) {
              newData[`${key.toLowerCase()}`] = value;
            }
            if (SOCKET?.connected) {

              SOCKET.emit(userInfo.sub, JSON.stringify(newData));
              SOCKET.broadcast.emit(userInfo.sub, JSON.stringify(newData));
              // SOCKET.broadcast.emit(userInfo.sub, JSON.stringify(newData));
            }
          }
        );
      }
      if(count===50){
        mqtt_client_list.length = 0
        count = 0
      }
      else {
        
        count +=1 
      }



    } catch (error) {
      console.log("--error", error);
    }


    // console.log("Properties (set by device): ");
    // console.log(JSON.stringify(message.properties));
    // console.log("System properties (set by IoT Hub): ");
    // console.log(JSON.stringify(message.systemProperties));
    // console.log("");
  }
};

export const main = async () => {
  console.log("IoT Hub Quickstarts - Read device to cloud messages.");
  // If using websockets, uncomment the webSocketOptions below
  // If using proxy, then set `webSocketConstructorOptions` to { agent: proxyAgent }
  // You can also use the `retryOptions` in the client options to configure the retry policy
  const clientOptions = {
    // webSocketOptions: {
    //   webSocket: WebSocket,
    //   webSocketConstructorOptions: {}
    // }
  };

  // Create the client to connect to the default consumer group of the Event Hub
  const consumerClient = new EventHubConsumerClient("$Default", connectionString, clientOptions);

  // Subscribe to messages from all partitions as below
  // To subscribe to messages from a single partition, use the overload of the same method.
  consumerClient.subscribe({
    processEvents: printMessages,
    processError: printError,
  });
}

main().catch((error) => {
  console.error("Error running sample:", error);
});