import mqtt from "mqtt";
import fs from "fs";
import uuid4 from "uuid4";
import db from "../models/index.js";
const  PublishData = db.publish_data
// create mqtt connection without certificates
export let  mqtt_client_list = [];
export const gatewayTopicList = [] // subscribed gateway

export const createConnectionWithoutCertificates = async(topic, host, port) => {
  let isClientExits = mqtt_client_list.findIndex((obj) => {
    if ( obj?.host === host && obj?.port === port) {
      return true
    }
    else {
      false
    }
  });
  if (isClientExits === -1) {
    try {

      const connectUrl = `mqtt://${host}:${port}`;
      const options = {
        clientId: "test" + uuid4(),
        clean: true,
        connectTimeout: 4000,
      };
      // console.log("--conn url", connectUrl);
      const client = await  mqtt.connect(connectUrl, options);
      let client_Obj = {
        host: host,
        port: port,
        client: client,
      };
      mqtt_client_list.push(client_Obj);
      return client_Obj;

    } catch (error) {
      console.log("--erro-try--", error);

    }
  } else {
    const client_obj = mqtt_client_list[isClientExits];
    return client_obj;
  }
};
// create  mqtt client with certificates
export const   createConnectionWithCertficates = async (topic, host, port, keyFilePath, crtFilePath, rootCAFilePath) => {
  let isClientExits = mqtt_client_list.findIndex((obj) => {
    if ( obj?.host === host && obj?.port === port && obj.keyFilePath === keyFilePath && obj.crtFilePath == crtFilePath && obj.rootCAFilePath === rootCAFilePath) {
      return true
    }
    else {
      false
    }
  });
  // console.log("---with cert--", isClientExits);

  if (isClientExits === -1) {
    try {
      const connectUrl = `mqtt://${host}:${port}`;

      var CA_FILE = fs.readFileSync(rootCAFilePath);
      var KEY = fs.readFileSync(keyFilePath);
      var CERT = fs.readFileSync(crtFilePath);


      const options = {
        clientId: "test" + uuid4(),
        clean: true,
        connectTimeout: 4000,
        rejectUnauthorized: false,
        key: KEY,
        cert: CERT,
        ca: CA_FILE
      };

      // console.log("--conn url", connectUrl);
      const client = await mqtt.connect(connectUrl, options);

      client.on("connect",function(){	
        // console.log("connected  "+ client.connected);
      })
      let client_Obj = {
        host: host,
        port: port,
        client: client,
      };
      mqtt_client_list.push(client_Obj);
      return client_Obj;

    } catch (error) {
      console.log("--try--", error);

    }
  } else {
    const client_obj = mqtt_client_list[isClientExits];
    return client_obj;
  }

}





export const unsubscribeTopic = async (device_id) => {
  


  const publishTopic = await PublishData.findOne({
    device_id: device_id,
  });
  // console.log("--------publish----topic---", publishTopic);

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
      //   console.log("--client---", w_client);
      if (publishTopic.device_id === device_id) {

        await w_client.client.on('connect', () => {
          w_client.client.unsubscribe(publishTopic.topic, () => { console.log("--un subscribe topic", publishTopic.topic) });
        });

         mqtt_client_list.pop(w_client)
      }
    } else {
      let w_client = await createConnectionWithoutCertificates(
        
        publishTopic.host,
        publishTopic.port
      );

      if (publishTopic.device_id === device_id) {
        await w_client.client.on('connect', () => {
          w_client.client.unsubscribe(publishTopic.topic, () => { console.log("--un subscribe topic", publishTopic.topic) });
        });
        mqtt_client_list.pop(w_client)
      }
    }


    let delete_data = await  PublishData.deleteOne({
      device_id:device_id
    });
    console.log("---------delete_publish data successfully--",delete_data)
  }

  // delete PublishData 




}






