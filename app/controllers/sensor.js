import db from "../models/index.js";
// import docClient from "../config/dynamo.js";
import { spawn } from 'child_process';
import fs from "fs";
import multer from 'multer';
import path from "path";
import { generateCertificateAndJsonConfig } from "../utils/sensor.js";

import archiver from 'archiver';
import { streamsToCompressed } from '../utils/azure_utilities.js';

import { BlobServiceClient } from '@azure/storage-blob';
import { unsubscribeTopic } from '../utils/mqtt_utilities.js';

const AZURE_STORAGE_CONNECTION_STRING =
  "DefaultEndpointsProtocol=https;AccountName=certificatedownload;AccountKey=s6BN+yog96WvmceMe4psCsIE2YOuuus9hLMWa6TRyNLycFuBCMCJksgWXSInE1eC9xn7xCebuGoR+ASt5Prp4g==;EndpointSuffix=core.windows.net";

const blobServiceClient = BlobServiceClient.fromConnectionString(
  AZURE_STORAGE_CONNECTION_STRING
);



import awsIot from "aws-iot-device-sdk";
import uuid4 from "uuid4";
import { application } from "express";
// import { pub_sub_method } from "../utils/publish_subscribe.js";
// import { unsubscribeTopic } from "../utils/mqtt_utilities.js";


const Washroom = db.washroom;
const Wellness = db.wellness
const Floor = db.floor;
const Infrastructure = db.infrastructure;
const Sensor = db.sensor;
const SensorType = db.sensor_type;
const User = db.user;
const Gateway = db.gateway;
const Room = db.room;
const PublishData = db.publish_data
const DeviceConfiguration = db.device_configuration
const GatewayTopicInfo = db.gateway_topic_info
const ImUsers = db.im_users;
const Solution = db.solution




export const getSensors = async (req, res) => {
  const { sub,group } = req.kauth.grant.access_token.content;
  const applicationType = req.query.applicationType
  console.log("----getSensors- 77777777777777777777777777777--",group);
  let subId = sub
  if(group[0]==='/Sub User'){
    let ParentInfo = await ImUsers.findOne({subId:subId});
    subId=  ParentInfo.parentUser

  }

  // if (applicationType === "washroom") {
  //   pathType = "washrooms"
  // } else if (applicationType === "wellness") {
  //   pathType = "wellnesses"
  // }

  User.findOne({ sub: subId})
    .populate({
      path: "infrastructures",
      populate: {
        path: "floors",
        populate: {
          path: 'solutions',
          match: { 'solution': applicationType },
          populate: { path: "sensors" },
        },
      },
    })
    .exec((err, user) => {
      if (err) {
        console.log(err);
        res.status(400).send(err);
      } else {
        if (!user) {
          res.status(400).send("User not found");
        } else {
          const floors = user.infrastructures
            .map((infra) => infra.floors)
            .flat();


          var sensors = [];
          // if (applicationType === "washroom") {
          //   const washrooms = floors.map((floor) => floor.washrooms).flat();
          //   // sensors = washrooms.filter((dt) => sensors.includes(dt) === -1).map((wr) => sensors.push(wr.sensors)).flat();
          //   console.log("----washrooms============",washrooms);
          //   let result = washrooms.filter((thing, index, self) =>
          //     index === self.findIndex((t) => (
          //       t._id === thing._id
          //     ))
          //   )
          //   result = result.map((wr) => wr.sensors).flat();
          //   console.log("-----resultii----",result);
          //   sensors = result
          // }
          // else if (applicationType === "wellness") {
          const wellnesses = floors.map((floor) => floor.solutions).flat();

          let result = wellnesses.filter((thing, index, self) =>
            index === self.findIndex((t) => (
              t._id === thing._id
            ))
          )
          result = result.map((wr) => wr.sensors).flat();

          sensors = result

          // }
          res.status(200).send(sensors);
        }
      }
    });
};

export const createSensor = async (req, res) => {
  const { sub } = req.kauth.grant.access_token.content;
  const {
    device_id,
    code,
    description,
    infrastructure,
    floor,
    washroom,
    gateway,
    config,
    publish
  } = JSON.parse(req.body.gatewayId);
  const topicname = req.body.topicname
  const keyFileName = req.body.keyFileName
  const crtFileName = req.body.crtFileName
  const rootCA = req.body.rootCAFileName
  const hosturl = req.body.hosturl
  const port = req.body.port
  const applicationType = req.query.type

  // create sensorType----------------

  const sensor_type = await SensorType.create({
    code,
    description,
    components: []
  })

  let gateway_topic_information = await GatewayTopicInfo.create({
    device_id: device_id,
    gatewayTopicName: `washroom/${gateway.gateway_id}/pub`,
    subId: sub,

  })

  let pub_data_update = ""
  if (rootCA !== "undefined" && crtFileName !== "undefined" && keyFileName !== "undefined" && hosturl !== "undefined" && topicname !== "undefined" && port !== "undefined") {
    pub_data_update = await PublishData.findOneAndUpdate({ device_id: device_id }, {
      topic: publish.topicname,
      parent_gateway_topic: `washroom/${gateway.gateway_id}/pub`,
      host: publish.hosturl,
      port: publish.port,
      keyPath: `${process.cwd()}/upload/${keyFileName}`,
      crtPath: `${process.cwd()}/upload/${crtFileName}`,
      rootCAPath: `${process.cwd()}/upload/${rootCA}`
    }, { upsert: true })

  }

  else if (hosturl !== "undefined" && topicname !== "undefined" && port !== "undefined") {
    pub_data_update = await PublishData.findOneAndUpdate({ device_id: device_id }, {
      topic: publish.topicname,
      parent_gateway_topic: `washroom/${gateway.gateway_id}/pub`,
      host: publish.hosturl,
      port: publish.port
    }, { upsert: true })

  }

  config.conf_data = config.conf_data.map(d => {
    if (!!d?.selectedValue) {
      // console.log("selecte value",d.selectedValue);
    }
    else {
      // console.log("----no selected value=--")
      d.selectedValue = d.defaultValue

    }
    return d
  })
  //create sensor configuration
  const device_config = await DeviceConfiguration.create({
    sensor_id: device_id,
    sensor_config: config.conf_data


  })

  //  console.log("---------device config---",device_config);


  // Create infrastructure for sensor if needed
  let washroom_id = "";
  if (washroom._id === "ADDNEW") {
    const { type } = washroom;
    const new_washroom = await Washroom.create({
      type,
    });
    if (!new_washroom) {
      res.status(500).send("Failed to create washroom");
      return;
    }
    washroom_id = new_washroom._id;
  } else {
    washroom_id = washroom._id;
  }

  let floor_id = "";
  if (floor._id === "ADDNEW") {
    const { sign, description } = floor;
    let index = 0;
    if (/^B[0-9]+$/i.test(sign)) {
      index = -1 * Number(sign.replace("B", ""));
    } else if (sign !== "G") {
      index = Number(sign);
    }
    const new_floor = await Floor.create({
      sign,
      description,
      index,
      washrooms: [washroom_id],
    });
    if (!new_floor) {
      res.status(500).send("Failed to create floor");
      return;
    }
    floor_id = new_floor._id;
  } else {
    floor_id = floor._id;
    await Floor.findByIdAndUpdate(floor._id, {
      $addToSet: { washrooms: washroom_id },
    });
  }

  let infrastructure_id = "";
  if (infrastructure._id === "ADDNEW") {
    const { name, description, location, type } = infrastructure;
    const new_infra = await Infrastructure.create({
      name,
      description,
      location,
      type,
      floors: [floor_id],
      solution: applicationType
    });
    if (!new_infra) {
      res.status(500).send("Failed to create infrastructure");
      return;
    }
    infrastructure_id = new_infra._id;
    await User.findOneAndUpdate(
      { sub },
      {
        $addToSet: { infrastructures: new_infra._id },
      }
    );
  } else {
    infrastructure_id = infrastructure._id;
    await Infrastructure.findByIdAndUpdate(infrastructure._id, {
      $addToSet: { floors: floor_id },
    });
    await User.findOneAndUpdate(
      { sub },
      {
        $addToSet: { infrastructures: infrastructure._id },
      }
    );
  }

  // Create gateway if needed

  // console.log("-------------gateway----------------",gateway)
  let gw_id = "";
  const { gateway_id, region, city, state, company, company_unit } = gateway;
  if (gateway._id === "ADDNEW") {
    const gw_infrastructure = gateway.infrastructure;
    const gw_floor = gateway.floor;
    const gw_washroom = gateway.room || gateway.washroom;
    let gw_washroom_id = "";
    let gw_room_id = "";
    if (gw_washroom._id === "ADDNEW") {
      const { type } = gw_washroom;
      const new_gw_washroom = await Washroom.create({
        type,
      });
      if (!new_gw_washroom) {
        res.status(500).send("Failed to create gateway washroom");
        return;
      }
      gw_washroom_id = new_gw_washroom._id;
    } else if (gw_washroom._id === "ADDNEWROOM") {
      const { label, description } = gw_washroom;
      const new_gw_room = await Room.create({
        label,
        description,
      });
      if (!new_gw_room) {
        res.status(500).send("Failed to create gateway room");
        return;
      }
      gw_room_id = new_gw_room._id;
    } else if (gw_washroom._id === "SAME_WITH_SENSOR") {
      gw_washroom_id = washroom_id;
    } else {
      gw_washroom_id = gw_washroom._id;
    }

    let gw_floor_id = "";
    if (gw_floor._id === "ADDNEW") {
      const { sign, description } = gw_floor;
      let index = 0;
      if (/^B[0-9]+$/i.test(sign)) {
        index = -1 * Number(sign.replace("B", ""));
      } else if (sign !== "G") {
        index = Number(sign);
      }
      const new_gw_floor = await Floor.create({
        sign,
        description,
        index,
        washrooms: (gw_washroom_id && [gw_washroom_id]) || [],
        rooms: (gw_room_id && [gw_room_id]) || [],
      });
      if (!new_gw_floor) {
        res.status(500).send("Failed to create gateway floor");
        return;
      }
      gw_floor_id = new_gw_floor._id;
    } else if (gw_floor._id === "SAME_WITH_SENSOR") {
      gw_floor_id = floor_id;
      if (gw_washroom_id !== "") {
        await Floor.findByIdAndUpdate(gw_floor_id, {
          $addToSet: { washrooms: gw_washroom_id },
        });
      } else if (gw_room_id !== "") {
        await Floor.findByIdAndUpdate(gw_floor_id, {
          $addToSet: { rooms: gw_room_id },
        });
      }
    } else {
      gw_floor_id = gw_floor._id;
      if (gw_washroom_id !== "") {
        await Floor.findByIdAndUpdate(gw_floor._id, {
          $addToSet: { washrooms: gw_washroom_id },
        });
      } else if (gw_room_id !== "") {
        await Floor.findByIdAndUpdate(gw_floor._id, {
          $addToSet: { rooms: gw_room_id },
        });
      }
    }

    let gw_infra_id = "";
    if (gw_infrastructure._id === "ADDNEW") {
      const { name, description, location, type } = gw_infrastructure;
      const new_gw_infra = await Infrastructure.create({
        name,
        description,
        location,
        type,
        floors: [gw_floor_id],
        solution: applicationType
      });
      if (!new_gw_infra) {
        res.status(500).send("Failed to create gateway infrastructure");
        return;
      }
      gw_infra_id = new_gw_infra;
    } else if (gw_infrastructure._id === "SAME_WITH_SENSOR") {
      gw_infra_id = infrastructure_id;
    } else {
      gw_infra_id = gw_infrastructure._id;
      await Infrastructure.findByIdAndUpdate(gw_infrastructure._id, {
        $addToSet: { floors: gw_floor_id },
      });
    }

    await User.findOneAndUpdate(
      { sub },
      {
        $addToSet: { infrastructures: gw_infra_id },
      }
    );

    if (gw_washroom_id !== "") {
      const new_gw = await Gateway.create({
        gateway_id,
        region,
        city,
        state,
        company,
        company_unit,
        washroom: gw_washroom_id,
        solution: applicationType
      });

      if (!new_gw) {
        res.status(500).send("Failed to create gateway");
        return;
      }
      gw_id = new_gw._id;
    } else {
      const new_gw = await Gateway.create({
        gateway_id,
        region,
        city,
        state,
        company,
        company_unit,
        room: gw_room_id,
        solution: applicationType
      });

      if (!new_gw) {
        res.status(500).send("Failed to create gateway");
        return;
      }
      gw_id = new_gw._id;
    }

    await User.findOneAndUpdate(
      { sub },
      {
        $addToSet: { gateways: gw_id },
      }
    );
  } else {
    gw_id = gateway._id;
  }

  const sensor = await Sensor.create({
    device_id,
    code,
    description,
    gateway: gw_id,
  });
  // console.log("------------------sensor-----------",sensor);
  if (sensor) {
    await Washroom.findByIdAndUpdate(washroom_id, {
      $addToSet: { sensors: sensor._id },
    });
    const user = await User.findOne({ sub });
    const gen_cir = await generateCertificateAndJsonConfig(user, sensor, region, sub, topicname, keyFileName, crtFileName, rootCA, hosturl, config, port, publish, applicationType, res);
    //  ------------------------------------------------------------------------------------------
  } else {
    res.status(500).send("Failed to create sensor");
  }
};


export const createWellnessSensor = async (req, res) => {
  const { sub } = req.kauth.grant.access_token.content;
  const {
    device_id,
    code,
    description,
    infrastructure,
    floor,
    wellness,
    gateway,
    config,
    publish,
    solution
  } = JSON.parse(req.body.gatewayId);
  const topicname = req.body.topicname
  const keyFileName = req.body.keyFileName
  const crtFileName = req.body.crtFileName
  const rootCA = req.body.rootCAFileName
  const hosturl = req.body.hosturl
  const port = req.body.port
  const applicationType = req.query.type



  // create sensorType----------------

  const sensor_type = await SensorType.create({
    code,
    description,
    components: []
  })

  let gateway_topic_information = await GatewayTopicInfo.create({
    device_id: device_id,
    gatewayTopicName: `washroom/${gateway.gateway_id}/pub`,
    subId: sub,

  })

  let pub_data_update = ""
  if (rootCA !== "undefined" && crtFileName !== "undefined" && keyFileName !== "undefined" && hosturl !== "undefined" && topicname !== "undefined" && port !== "undefined") {
    pub_data_update = await PublishData.findOneAndUpdate({ device_id: device_id }, {
      topic: publish.topicname,
      parent_gateway_topic: `washroom/${gateway.gateway_id}/pub`,
      host: publish.hosturl,
      port: publish.port,
      keyPath: `${process.cwd()}/upload/${keyFileName}`,
      crtPath: `${process.cwd()}/upload/${crtFileName}`,
      rootCAPath: `${process.cwd()}/upload/${rootCA}`
    }, { upsert: true })

  }

  else if (hosturl !== "undefined" && topicname !== "undefined" && port !== "undefined") {
    pub_data_update = await PublishData.findOneAndUpdate({ device_id: device_id }, {
      topic: publish.topicname,
      parent_gateway_topic: `washroom/${gateway.gateway_id}/pub`,
      host: publish.hosturl,
      port: publish.port
    }, { upsert: true })

  }

  config.conf_data = config.conf_data.map(d => {
    if (!!d?.selectedValue) {
      // console.log("selecte value",d.selectedValue);
    }
    else {
      // console.log("----no selected value=--")
      d.selectedValue = d.defaultValue

    }
    return d
  })
  //create sensor configuration
  const device_config = await DeviceConfiguration.create({
    sensor_id: device_id,
    sensor_config: config.conf_data


  })

  //  console.log("---------device config---",device_config);


  // Create infrastructure for sensor if needed
  let solution_id = "";
  if (solution._id === "ADDNEW") {
    const { type } = solution;
    const new_solution = await Solution.create({
      type,
      solution: applicationType
    });
    if (!new_solution) {
      res.status(500).send("Failed to create washroom");
      return;
    }
    solution_id = new_solution._id;
  } else {
    solution_id = solution._id;
  }

  let floor_id = "";
  if (floor._id === "ADDNEW") {
    const { sign, description } = floor;
    let index = 0;
    if (/^B[0-9]+$/i.test(sign)) {
      index = -1 * Number(sign.replace("B", ""));
    } else if (sign !== "G") {
      index = Number(sign);
      
    }
    // wellnesses: [wellness_id]
    const new_floor = await Floor.create({
      sign,
      description,
      index,
      solutions: [solution_id],
    });
    if (!new_floor) {
      res.status(500).send("Failed to create floor");
      return;
    }
    floor_id = new_floor._id;
  } else {
    floor_id = floor._id;
    await Floor.findByIdAndUpdate(floor._id, {
      $addToSet: { solutions: solution_id },
    });
  }

  let infrastructure_id = "";
  if (infrastructure._id === "ADDNEW") {
    const { name, description, location, type } = infrastructure;
    const new_infra = await Infrastructure.create({
      name,
      description,
      location,
      type,
      floors: [floor_id],
      solution: applicationType
    });
    if (!new_infra) {
      res.status(500).send("Failed to create infrastructure");
      return;
    }
    infrastructure_id = new_infra._id;
    await User.findOneAndUpdate(
      { sub },
      {
        $addToSet: { infrastructures: new_infra._id },
      }
    );
  } else {
    infrastructure_id = infrastructure._id;
    await Infrastructure.findByIdAndUpdate(infrastructure._id, {
      $addToSet: { floors: floor_id },
    });
    await User.findOneAndUpdate(
      { sub },
      {
        $addToSet: { infrastructures: infrastructure._id },
      }
    );
  }

  // Create gateway if needed

  let gw_id = "";
  const { gateway_id, region, city, state, company, company_unit } = gateway;
  if (gateway._id === "ADDNEW") {
    const gw_infrastructure = gateway.infrastructure;
    const gw_floor = gateway.floor;
    const gw_solution = gateway.room || gateway.solution; // solution
    let gw_solution_id = "";
    let gw_room_id = "";
    if (gw_solution._id === "ADDNEW") {
      const { type } = gw_solution;
      const new_gw_solution = await Solution.create({
        type,
        solution:applicationType
      });
      if (!new_gw_solution) {
        res.status(500).send("Failed to create gateway washroom");
        return;
      }
      gw_solution_id = new_gw_solution._id;
    } else if (gw_solution._id === "ADDNEWROOM") {
      const { label, description } = gw_solution;
      const new_gw_room = await Room.create({
        label,
        description,
      });
      if (!new_gw_room) {
        res.status(500).send("Failed to create gateway room");
        return;
      }
      gw_room_id = new_gw_room._id;
    } 
    else if (gw_solution._id === "SAME_WITH_SENSOR") {
      gw_solution_id = solution_id;
    } else {
      gw_solution_id = gw_solution._id;
    }

    let gw_floor_id = "";
    if (gw_floor._id === "ADDNEW") {
      const { sign, description } = gw_floor;
      let index = 0;
      if (/^B[0-9]+$/i.test(sign)) {
        index = -1 * Number(sign.replace("B", ""));
      } else if (sign !== "G") {
        index = Number(sign);
      }
      const new_gw_floor = await Floor.create({
        sign,
        description,
        index,
        solutions: (gw_solution_id && [gw_solution_id] || []),
        // wellnesses: (gw_wellness_id && [gw_wellness_id]) || [],
        rooms: (gw_room_id && [gw_room_id]) || [],
      });
      if (!new_gw_floor) {
        res.status(500).send("Failed to create gateway floor");
        return;
      }
      gw_floor_id = new_gw_floor._id;
    } else if (gw_floor._id === "SAME_WITH_SENSOR") {
      gw_floor_id = floor_id;
      if (gw_solution_id !== "") {
        await Floor.findByIdAndUpdate(gw_floor_id, {
          $addToSet: { solution: gw_solution_id }
        });
      } else if (gw_room_id !== "") {
        await Floor.findByIdAndUpdate(gw_floor_id, {
          $addToSet: { rooms: gw_room_id },
        });
      }
    } else {
      gw_floor_id = gw_floor._id;
      if (gw_solution_id !== "") {
        await Floor.findByIdAndUpdate(gw_floor._id, {
          $addToSet: { solution: gw_solution_id },
        });
      } else if (gw_room_id !== "") {
        await Floor.findByIdAndUpdate(gw_floor._id, {
          $addToSet: { rooms: gw_room_id },
        });
      }
    }

    let gw_infra_id = "";
    if (gw_infrastructure._id === "ADDNEW") {
      const { name, description, location, type } = gw_infrastructure;
      const new_gw_infra = await Infrastructure.create({
        name,
        description,
        location,
        type,
        floors: [gw_floor_id],
        solution: applicationType
      });
      if (!new_gw_infra) {
        res.status(500).send("Failed to create gateway infrastructure");
        return;
      }
      gw_infra_id = new_gw_infra;
    } else if (gw_infrastructure._id === "SAME_WITH_SENSOR") {
      gw_infra_id = infrastructure_id;
    } else {
      gw_infra_id = gw_infrastructure._id;
      await Infrastructure.findByIdAndUpdate(gw_infrastructure._id, {
        $addToSet: { floors: gw_floor_id },
      });
    }

    await User.findOneAndUpdate(
      { sub },
      {
        $addToSet: { infrastructures: gw_infra_id },
      }
    );

    if (gw_solution_id !== "") {
      const new_gw = await Gateway.create({
        gateway_id,
        region,
        city,
        state,
        company,
        company_unit,
        solution: gw_solution_id,
        solutionType: applicationType
      });

      if (!new_gw) {
        res.status(500).send("Failed to create gateway");
        return;
      }
      gw_id = new_gw._id;
    } else {
      const new_gw = await Gateway.create({
        gateway_id,
        region,
        city,
        state,
        company,
        company_unit,
        room: gw_room_id,
        solutionType: applicationType
      });

      if (!new_gw) {
        res.status(500).send("Failed to create gateway");
        return;
      }
      gw_id = new_gw._id;
    }

    await User.findOneAndUpdate(
      { sub },
      {
        $addToSet: { gateways: gw_id },
      }
    );
  } else {
    gw_id = gateway._id;
  }

  // creating sensor-=-------------------------------

  const sensor = await Sensor.create({
    device_id,
    code,
    description,
    gateway: gw_id,
  });
  // console.log("------------------sensor-----------",sensor);
  if (sensor) {
    await Solution.findByIdAndUpdate(solution_id, {
      $addToSet: { sensors: sensor._id },
    });
    const user = await User.findOne({ sub });
    const gen_cir = await generateCertificateAndJsonConfig(user, sensor, region, sub, topicname, keyFileName, crtFileName, rootCA, hosturl, config, port, publish, applicationType, res);
    //  ------------------------------------------------------------------------------------------
  } else {
    res.status(500).send("Failed to create sensor");
  }
};






export const updateSensor = async (req, res) => {
  const { sub } = req.kauth.grant.access_token.content;
  const { sensorId } = req.params;
  const {
    device_id,
    code,
    description,
    infrastructure,
    floor,
    washroom,
    gateway,
    publish,
    config

  } = JSON.parse(req.body.gatewayId);
  const applicationType = req.query.type;
  const { topicname, hosturl, port, keyFileName, crtFileName, rootCAFileName, prevSensorId, previousWashroom } = req.body
  // find and  update--
  // pub_sub_method(gateway.gateway_id,topicname,hosturl,port,keyFileName,crtFileName,rootCAFileName,device_id)
  let delPubData = await PublishData.deleteOne({ device_id: device_id })

  let mypreviousWashroom = JSON.parse(previousWashroom)


  // console.log(gateway, "---pubdata deletd sucesss fully");


  let pub_data_update = ""
  if (rootCAFileName !== "undefined" && crtFileName !== "undefined" && keyFileName !== "undefined" && hosturl !== "undefined" && topicname !== "undefined" && port !== "undefined") {
    pub_data_update = await PublishData.findOneAndUpdate({ device_id: device_id }, {
      topic: topicname,
      parent_gateway_topic: `washroom/${gateway.gateway_id}/pub`,
      host: hosturl,
      port: port,
      keyPath: `${process.cwd()}/upload/${keyFileName}`,
      crtPath: `${process.cwd()}/upload/${crtFileName}`,
      rootCAPath: `${process.cwd()}/upload/${rootCAFileName}`
    }, { upsert: true })



  }

  else if (hosturl !== "undefined" && topicname !== "undefined" && port !== "undefined") {
    pub_data_update = await PublishData.findOneAndUpdate({ device_id: device_id }, {
      topic: topicname,
      parent_gateway_topic: `washroom/${gateway.gateway_id}/pub`,
      host: hosturl,
      port: port
    }, { upsert: true })
  }

  pub_data_update = await PublishData.findOne({ device_id: device_id })



  config.conf_data = config.conf_data.map(d => {
    if (!!d?.selectedValue) {
      // console.log("selecte value",d.selectedValue);
    }
    else {
      // console.log("----no selected value=--")
      d.selectedValue = d.defaultValue

    }
    return d
  })







  let device_config_update = await DeviceConfiguration.findOneAndUpdate({ sensor_id: device_id }, {
    sensor_config: config.conf_data


  })











  //



  // Create infrastructure for sensor if needed
  let washroom_id = "";
  if (washroom._id === "ADDNEW") {
    const { type } = washroom;
    const new_washroom = await Washroom.create({
      type,
      sensors: [sensorId],
    });
    if (!new_washroom) {
      res.status(500).send("Failed to create washroom");
      return;
    }
    washroom_id = new_washroom._id;
    await Washroom.findOneAndUpdate(
      { sensors: sensorId },
      { $pull: { sensors: sensorId } }
    );
  } else {
    // washroom_id = washroom._id;

    await Washroom.findOneAndUpdate(
      { _id: mypreviousWashroom._id },
      { $pull: { sensors: prevSensorId } }
    );

    washroom_id = washroom._id;

    await Washroom.findOneAndUpdate(
      { _id: washroom._id },
      { $addToSet: { sensors: sensorId } }
    );
  }

  let floor_id = "";
  if (floor._id === "ADDNEW") {
    const { sign, description } = floor;
    let index = 0;
    if (/^B[0-9]+$/i.test(sign)) {
      index = -1 * Number(sign.replace("B", ""));
    } else if (sign !== "G") {
      index = Number(sign);
    }
    const new_floor = await Floor.create({
      sign,
      description,
      index,
      washrooms: [washroom_id],
    });
    if (!new_floor) {
      res.status(500).send("Failed to create floor");
      return;
    }
    floor_id = new_floor._id;
  } else {
    floor_id = floor._id;
    const { sign, description } = floor;
    let index = 0;
    if (/^B[0-9]+$/i.test(sign)) {
      index = -1 * Number(sign.replace("B", ""));
    } else if (sign !== "G") {
      index = Number(sign);
    }
    await Floor.findByIdAndUpdate(floor._id, {
      $addToSet: { washrooms: washroom_id },
      $set: { sign, index, description },
    });
  }

  let infrastructure_id = "";
  if (infrastructure._id === "ADDNEW") {
    const { name, description, location, type } = infrastructure;
    const new_infra = await Infrastructure.create({
      name,
      description,
      location,
      type,
      floors: [floor_id],
      solution: applicationType
    });
    if (!new_infra) {
      res.status(500).send("Failed to create infrastructure");
      return;
    }
    infrastructure_id = new_infra._id;
    await User.findOneAndUpdate(
      { sub },
      {
        $addToSet: { infrastructures: new_infra._id },
      }
    );
  } else {
    infrastructure_id = infrastructure._id;
    const { name, description, location, type } = infrastructure;
    await Infrastructure.findByIdAndUpdate(infrastructure._id, {
      $addToSet: { floors: floor_id },
      $set: { name, description, location, type },
    });
    await User.findOneAndUpdate(
      { sub },
      {
        $addToSet: { infrastructures: infrastructure._id },
      }
    );
  }

  const gw_infrastructure = gateway.infrastructure;
  const gw_floor = gateway.floor;
  const gw_washroom = gateway.room || gateway.washroom;
  let gw_washroom_id = "";
  let gw_room_id = "";

  if (gw_washroom._id === "ADDNEW") {
    const { type } = gw_washroom;
    const new_gw_washroom = await Washroom.create({
      type,
    });
    if (!new_gw_washroom) {
      res.status(500).send("Failed to create gateway washroom");
      return;
    }
    gw_washroom_id = new_gw_washroom._id;
  } else if (gw_washroom._id === "ADDNEWROOM") {
    const { label, description } = gw_washroom;
    const new_gw_room = await Room.create({
      label,
      description,
    });
    if (!new_gw_room) {
      res.status(500).send("Failed to create gateway room");
      return;
    }
    gw_room_id = new_gw_room._id;
  } else if (gw_washroom._id === "SAME_WITH_SENSOR") {
    gw_washroom_id = washroom_id;
  } else {
    if (gw_washroom.label) {
      gw_room_id = gw_washroom._id;
    } else {
      gw_washroom_id = gw_washroom._id;
    }
  }

  let gw_floor_id = "";
  if (gw_floor._id === "ADDNEW") {
    const { sign, description } = gw_floor;
    let index = 0;
    if (/^B[0-9]+$/i.test(sign)) {
      index = -1 * Number(sign.replace("B", ""));
    } else if (sign !== "G") {
      index = Number(sign);
    }
    const new_gw_floor = await Floor.create({
      sign,
      description,
      index,
      washrooms: (gw_washroom_id && [gw_washroom_id]) || [],
      rooms: (gw_room_id && [gw_room_id]) || [],
    });
    if (!new_gw_floor) {
      res.status(500).send("Failed to create gateway floor");
      return;
    }
    gw_floor_id = new_gw_floor._id;
  } else if (gw_floor._id === "SAME_WITH_SENSOR") {
    gw_floor_id = floor_id;
    if (gw_washroom_id !== "") {
      await Floor.findByIdAndUpdate(gw_floor_id, {
        $addToSet: { washrooms: gw_washroom_id },
      });
    } else if (gw_room_id !== "") {
      await Floor.findByIdAndUpdate(gw_floor_id, {
        $addToSet: { rooms: gw_room_id },
      });
    }
  } else if (gw_floor._id !== floor_id) {
    gw_floor_id = gw_floor._id;
    const { sign, description } = gw_floor;
    let index = 0;
    if (/^B[0-9]+$/i.test(sign)) {
      index = -1 * Number(sign.replace("B", ""));
    } else if (sign !== "G") {
      index = Number(sign);
    }
    if (gw_washroom_id !== "") {
      await Floor.findByIdAndUpdate(gw_floor._id, {
        $addToSet: { washrooms: gw_washroom_id },
        $set: { sign, description, index, },
      });
    } else if (gw_room_id !== "") {
      await Floor.findByIdAndUpdate(gw_floor._id, {
        $addToSet: { rooms: gw_room_id },
        $set: { sign, description, index, },
      });
    }
  } else {
    gw_floor_id = floor_id;

    const { sign, description } = gw_floor;
    let index = 0;
    if (/^B[0-9]+$/i.test(sign)) {
      index = -1 * Number(sign.replace("B", ""));
    } else if (sign !== "G") {
      index = Number(sign);
    }



    if (gw_washroom_id !== "") {
      await Floor.findByIdAndUpdate(floor_id, {
        $addToSet: { washrooms: gw_washroom_id },
        $set: { sign, description, index },
      });
    } else if (gw_room_id !== "") {
      await Floor.findByIdAndUpdate(floor_id, {
        $addToSet: { rooms: gw_room_id },
        $set: { sign, description, index },
      });
    }
  }

  let gw_infra_id = "";


  if (gw_infrastructure._id === "ADDNEW") {
    const { name, description, location, type } = gw_infrastructure;
    const new_gw_infra = await Infrastructure.create({
      name,
      description,
      location,
      type,
      floors: [gw_floor_id],
      solution: applicationType
    });
    if (!new_gw_infra) {
      res.status(500).send("Failed to create gateway infrastructure");
      return;
    }
    gw_infra_id = new_gw_infra;
  } else if (gw_infrastructure._id === "SAME_WITH_SENSOR") {
    gw_infra_id = infrastructure_id;
  } else if (gw_infrastructure._id !== infrastructure_id) {
    gw_infra_id = gw_infrastructure._id;
    const { name, description, location, type } = gw_infrastructure;
    await Infrastructure.findByIdAndUpdate(gw_infrastructure._id, {
      $addToSet: { floors: gw_floor_id },
      $set: { name, description, location, type },
    });
  } else {

    gw_infra_id = infrastructure_id;


    const { name, description, location, type } = gw_infrastructure;
    await Infrastructure.findByIdAndUpdate(gw_infrastructure._id, {
      // $addToSet: { floors: gw_floor_id },
      $set: { name, description, location, type },
    });
  }

  await User.findOneAndUpdate(
    { sub },
    {
      $addToSet: { infrastructures: gw_infra_id },
    }
  );
  // Create gateway if needed
  let gw_id = "";
  if (gateway._id === "ADDNEW") {
    const { gateway_id, region, city, state, company, company_unit } = gateway;
    const new_gw = await Gateway.create({
      gateway_id,
      region,
      city,
      state,
      company,
      company_unit,
      washroom: gw_washroom_id || null,
      room: gw_room_id || null,
      solution: applicationType
    });

    if (!new_gw) {
      res.status(500).send("Failed to create gateway");
      return;
    }
    gw_id = new_gw._id;
    await User.findOneAndUpdate(
      { sub },
      {
        $addToSet: { gateways: new_gw._id },
      }
    );
  } else {
    gw_id = gateway._id;
    const { gateway_id, region, city, state, company, company_unit } = gateway;
    await Gateway.findByIdAndUpdate(gateway._id, {
      gateway_id,
      region,
      city,
      state,
      company,
      company_unit,
      washroom: gw_washroom_id || null,
      room: gw_room_id || null,
    });
  }
  const sensor = await Sensor.findOneAndUpdate(
    { _id: sensorId },
    { device_id, code, description, gateway: gw_id }
  );

  let updatedSensor = await Sensor.findOne({ _id: sensorId })


  if (!sensor) {
    res.status(400).send("Sensor update failed");
  } else {
    const wr = await Washroom.findOne({ sensors: sensor._id });
    const fl = await Floor.findOne({ washrooms: washroom_id }).populate({
      path: "washrooms",
    });
    const infra = await Infrastructure.findOne({ floors: floor_id }).populate({
      path: "floors",
      populate: {
        path: "washrooms",
      },
    });
    const gw = await Gateway.findById(updatedSensor.gateway);
    let gw_wr;
    let gw_fl;
    let gw_r;
    if (gw_washroom_id !== "") {
      gw_wr = await Washroom.findById(gw_washroom_id);
      gw_fl = await Floor.findOne({ washrooms: gw_washroom_id }).populate([
        {
          path: "rooms",
        },
        { path: "washrooms" },
      ]);
    } else {
      gw_r = await Room.findById(gw_room_id);
      gw_fl = await Floor.findOne({ rooms: gw_room_id }).populate([
        {
          path: "rooms",
        },
        { path: "washrooms" },
      ]);
    }

    const gw_infra = await Infrastructure.findOne({
      floors: gw_floor_id,
    }).populate({
      path: "floors",
      populate: [
        {
          path: "washrooms",
        },
        {
          path: "rooms",
        },
      ],
    });

    const dir = `${process.cwd()}/${process.env.CERTIFICATE_DIR}/${sub}`;







    let path = `certificates/${sub}/${device_id}`





    //


    const output = fs.createWriteStream(`${dir}/${device_id}.zip`);
    const archive = archiver("zip", {
      gzip: true,
      zlib: { level: 9 }, // Sets the compression level.
    });

    archive.on("error", function (err) {
      console.error(err)
      return false;
    });

    // pipe archive data to the output file
    archive.pipe(output);

    archive.file(`${dir}/${device_id}.json`, {
      name: `${device_id}.json`,
    });
    archive.file(`${dir}/${gw._doc.gateway_id.trim()}_cert.pem`, {
      name: `${gw._doc.gateway_id.trim()}_cert.pem`,
    });
    archive.file(`${dir}/${gw._doc.gateway_id.trim()}_key.pem`, {
      name: `${gw._doc.gateway_id.trim()}_key.pem`,
    });

    //
    archive.finalize();




    await fs.writeFileSync(`certificates/${sub}/${device_id}.json`, JSON.stringify(
      {
        ...sensor._doc,
        infrastructure: infra,
        floor: fl,
        washroom: wr,
        gateway: {
          ...gw._doc,
          infrastructure: gw_infra,
          floor: gw_fl,
          washroom: gw_wr,
          room: gw_r,
        },
        // publish:pub_data_update || {},
        config: {
          conf_data: device_config_update.sensor_config
        },
      }

    ))





    res.status(200).send({
      ...sensor._doc,
      infrastructure: infra,
      floor: fl,
      washroom: wr,
      gateway: {
        ...gw._doc,
        infrastructure: gw_infra,
        floor: gw_fl,
        washroom: gw_wr,
        room: gw_r,
      },
      publish: pub_data_update || {},
      config: {
        conf_data: device_config_update.sensor_config
      },
    });
  }
};


export const updateWellnessSensor = async (req, res) => {
  const { sub } = req.kauth.grant.access_token.content;
  const { sensorId } = req.params;
  const {
    device_id,
    code,
    description,
    infrastructure,
    floor,
    solution,
    gateway,
    publish,
    config,
  } = JSON.parse(req.body.gatewayId);
  const applicationType = req.query.type
  const { topicname, hosturl, port, keyFileName, crtFileName, rootCAFileName, prevSensorId, previousSolution } = req.body
  // find and  update--
  // pub_sub_method(gateway.gateway_id,topicname,hosturl,port,keyFileName,crtFileName,rootCAFileName,device_id)
  // console.log(gateway, "---pubdata deletd sucesss wellnes fully");

  let delPubData = await PublishData.deleteOne({ device_id: device_id })
  // console.log("---pubdata deletd sucesss fully")
  let mypreviousSolution = JSON.parse(previousSolution)




  let pub_data_update = ""
  if (rootCAFileName !== "undefined" && crtFileName !== "undefined" && keyFileName !== "undefined" && hosturl !== "undefined" && topicname !== "undefined" && port !== "undefined") {
    pub_data_update = await PublishData.findOneAndUpdate({ device_id: device_id }, {
      topic: topicname,
      parent_gateway_topic: `washroom/${gateway.gateway_id}/pub`,
      host: hosturl,
      port: port,
      keyPath: `${process.cwd()}/upload/${keyFileName}`,
      crtPath: `${process.cwd()}/upload/${crtFileName}`,
      rootCAPath: `${process.cwd()}/upload/${rootCAFileName}`
    }, { upsert: true })



  }

  else if (hosturl !== "undefined" && topicname !== "undefined" && port !== "undefined") {
    pub_data_update = await PublishData.findOneAndUpdate({ device_id: device_id }, {
      topic: topicname,
      parent_gateway_topic: `washroom/${gateway.gateway_id}/pub`,
      host: hosturl,
      port: port
    }, { upsert: true })
  }

  pub_data_update = await PublishData.findOne({ device_id: device_id })



  config.conf_data = config.conf_data.map(d => {
    if (!!d?.selectedValue) {
      // console.log("selecte value",d.selectedValue);
    }
    else {
      // console.log("----no selected value=--")
      d.selectedValue = d.defaultValue

    }
    return d
  })







  let device_config_update = await DeviceConfiguration.findOneAndUpdate({ sensor_id: device_id }, {
    sensor_config: config.conf_data


  })














  //



  // Create infrastructure for sensor if needed
  let solution_id = "";
  if (solution._id === "ADDNEW") {
    const { type } = solution;
    const new_solution = await Solution.create({
      type,
      sensors: [sensorId],
      solution: applicationType
    });
    if (!new_solution) {
      res.status(500).send("Failed to create wellness");
      return;
    }
    solution_id = new_solution._id;
    await Solution.findOneAndUpdate(
      { sensors: sensorId },
      { $pull: { sensors: sensorId } }
    );
  } else {

    await Solution.findOneAndUpdate(
      { _id: mypreviousSolution._id },
      { $pull: { sensors: prevSensorId } }
    );

    solution_id = solution._id;

    await Solution.findOneAndUpdate(
      { _id: solution_id },
      { $addToSet: { sensors: sensorId } }
    );

  }

  let floor_id = "";
  if (floor._id === "ADDNEW") {
    const { sign, description } = floor;
    let index = 0;
    if (/^B[0-9]+$/i.test(sign)) {
      index = -1 * Number(sign.replace("B", ""));
    } else if (sign !== "G") {
      index = Number(sign);
    }
    const new_floor = await Floor.create({
      sign,
      description,
      index,
      solutions: [solution_id],
    });
    if (!new_floor) {
      res.status(500).send("Failed to create floor");
      return;
    }
    floor_id = new_floor._id;
  } else {
    floor_id = floor._id;
    const { sign, description } = floor;
    let index = 0;
    if (/^B[0-9]+$/i.test(sign)) {
      index = -1 * Number(sign.replace("B", ""));
    } else if (sign !== "G") {
      index = Number(sign);
    }
    await Floor.findByIdAndUpdate(floor._id, {
      $addToSet: { solutions: solution_id },
      $set: { sign, description, index },
    });
  }

  let infrastructure_id = "";
  if (infrastructure._id === "ADDNEW") {
    const { name, description, location, type } = infrastructure;
    const new_infra = await Infrastructure.create({
      name,
      description,
      location,
      type,
      floors: [floor_id],
      solution: applicationType
    });
    if (!new_infra) {
      res.status(500).send("Failed to create infrastructure");
      return;
    }
    infrastructure_id = new_infra._id;
    await User.findOneAndUpdate(
      { sub },
      {
        $addToSet: { infrastructures: new_infra._id },
      }
    );
  } else {
    infrastructure_id = infrastructure._id;
    const { name, description, location, type } = infrastructure;
    await Infrastructure.findByIdAndUpdate(infrastructure._id, {
      $addToSet: { floors: floor_id },
      $set: { name, description, location, type },
    });
    await User.findOneAndUpdate(
      { sub },
      {
        $addToSet: { infrastructures: infrastructure._id },
      }
    );
  }

  const gw_infrastructure = gateway.infrastructure;
  const gw_floor = gateway.floor;
  const gw_solution = gateway.room || gateway.solution;



  let gw_solution_id = "";
  let gw_room_id = "";
  // console.log(gateway, "gateway------")
  if (gw_solution._id === "ADDNEW") {
    const { type } = gw_solution;
    const new_gw_solution = await Solution.create({
      type,
      solution: applicationType
    });
    if (!new_gw_solution) {
      res.status(500).send("Failed to create gateway wellness");
      return;
    }
    gw_solution_id = new_gw_solution._id;
  } else if (gw_solution._id === "ADDNEWROOM") {
    const { label, description } = gw_solution;
    const new_gw_room = await Room.create({
      label,
      description,
    });
    if (!new_gw_room) {
      res.status(500).send("Failed to create gateway room");
      return;
    }
    gw_room_id = new_gw_room._id;
  } else if (gw_solution._id === "SAME_WITH_SENSOR") {
    gw_solution_id = solution_id;
  } else {
    if (gw_solution.label) {
      gw_room_id = gw_solution._id;
    } else {
      gw_solution_id = gw_solution._id;
    }
  }

  let gw_floor_id = "";
  if (gw_floor._id === "ADDNEW") {
    const { sign, description } = gw_floor;
    let index = 0;
    if (/^B[0-9]+$/i.test(sign)) {
      index = -1 * Number(sign.replace("B", ""));
    } else if (sign !== "G") {
      index = Number(sign);
    }
    const new_gw_floor = await Floor.create({
      sign,
      description,
      index,
      solutions: (gw_solution_id && [gw_solution_id]) || [],
      rooms: (gw_room_id && [gw_room_id]) || [],
    });
    if (!new_gw_floor) {
      res.status(500).send("Failed to create gateway floor");
      return;
    }
    gw_floor_id = new_gw_floor._id;
  } else if (gw_floor._id === "SAME_WITH_SENSOR") {
    gw_floor_id = floor_id;
    if (gw_solution_id !== "") {
      await Floor.findByIdAndUpdate(gw_floor_id, {
        $addToSet: { solutions: gw_solution_id },
      });
    } else if (gw_room_id !== "") {



      let all = await floor.updateMany(
        { _id: { $ne: gw_floor_id }, rooms: { $in: [gw_room_id] } },
        { $pull: { rooms: gw_room_id } }
      );






      await Floor.findByIdAndUpdate(gw_floor_id, {
        $addToSet: { rooms: gw_room_id },
      });
    }
  } else if (gw_floor._id !== floor_id) {
    gw_floor_id = gw_floor._id;
    const { sign, description } = gw_floor;
    let index = 0;






    if (/^B[0-9]+$/i.test(sign)) {
      index = -1 * Number(sign.replace("B", ""));
    } else if (sign !== "G") {
      index = Number(sign);
    }
    if (gw_solution_id !== "") {
      await Floor.findByIdAndUpdate(gw_floor._id, {
        $addToSet: { solutions: gw_solution_id },
        $set: { sign, description, index }
      });
    } else if (gw_room_id !== "") {


      let all = await Floor.updateMany(
        { _id: { $ne: gw_floor_id }, rooms: { $in: [gw_room_id] } },
        { $pull: { rooms: gw_room_id } }
      );





      await Floor.findByIdAndUpdate(gw_floor._id, {
        $addToSet: { rooms: gw_room_id },
        $set: { sign, description, index }
      });
    }
  } else {
    gw_floor_id = floor_id;
    const { sign, description } = gw_floor;
    let index = 0;
    if (/^B[0-9]+$/i.test(sign)) {
      index = -1 * Number(sign.replace("B", ""));
    } else if (sign !== "G") {
      index = Number(sign);
    }

    if (gw_solution_id !== "") {
      await Floor.findByIdAndUpdate(floor_id, {
        $addToSet: { solutions: gw_solution_id },
        $set: { sign, description, index }
      });






    } else if (gw_room_id !== "") {



      let all = await Floor.updateMany(
        { _id: { $ne: gw_floor_id }, rooms: { $in: [gw_room_id] } },
        { $pull: { rooms: gw_room_id } }
      );

      await Floor.findByIdAndUpdate(floor_id, {
        $addToSet: { rooms: gw_room_id },
        $set: { sign, description, index }
      });
    }
  }



  let gw_infra_id = "";
  if (gw_infrastructure._id === "ADDNEW") {
    const { name, description, location, type } = gw_infrastructure;
    const new_gw_infra = await Infrastructure.create({
      name,
      description,
      location,
      type,
      floors: [gw_floor_id],
      solution: applicationType
    });
    if (!new_gw_infra) {
      res.status(500).send("Failed to create gateway infrastructure");
      return;
    }
    gw_infra_id = new_gw_infra;
  } else if (gw_infrastructure._id === "SAME_WITH_SENSOR") {
    gw_infra_id = infrastructure_id;
    let all = await Infrastructure.updateMany(
      { _id: { $ne: gw_infrastructure._id }, floors: { $in: [gw_floor_id] } },
      { $pull: { floors: gw_floor_id } }
    );
  } else if (gw_infrastructure._id !== infrastructure_id) {

    gw_infra_id = gw_infrastructure._id;
    const { name, description, location, type } = gw_infrastructure;

    let all = await Infrastructure.updateMany(
      { _id: { $ne: gw_infrastructure._id }, floors: { $in: [gw_floor_id] } },
      { $pull: { floors: gw_floor_id } }
    );

    await Infrastructure.findByIdAndUpdate(gw_infrastructure._id, {
      $addToSet: { floors: gw_floor_id },
      $set: { name, description, location, type },
    });
  } else {
    gw_infra_id = infrastructure_id;

    let all = await Infrastructure.updateMany(
      { _id: { $ne: gw_infrastructure._id }, floors: { $in: [gw_floor_id] } },
      { $pull: { floors: gw_floor_id } }
    );
    const { name, description, location, type } = gw_infrastructure;
    await Infrastructure.findByIdAndUpdate(gw_infrastructure._id, {
      $addToSet: { floors: gw_floor_id },
      $set: { name, description, location, type },
    });
  }

  await User.findOneAndUpdate(
    { sub },
    {
      $addToSet: { infrastructures: gw_infra_id },
    }
  );
  // Create gateway if needed
  let gw_id = "";
  if (gateway._id === "ADDNEW") {
    const { gateway_id, region, city, state, company, company_unit } = gateway;
    const new_gw = await Gateway.create({
      gateway_id,
      region,
      city,
      state,
      company,
      company_unit,
      solution: gw_solution_id || null,
      room: gw_room_id || null,
      solutionType: applicationType
    });

    if (!new_gw) {
      res.status(500).send("Failed to create gateway");
      return;
    }
    gw_id = new_gw._id;
    await User.findOneAndUpdate(
      { sub },
      {
        $addToSet: { gateways: new_gw._id },
      }
    );
  } else {
    gw_id = gateway._id;
    const { gateway_id, region, city, state, company, company_unit } = gateway;
    await Gateway.findByIdAndUpdate(gateway._id, {
      gateway_id,
      region,
      city,
      state,
      company,
      company_unit,
      solution: gw_solution_id || null,
      room: gw_room_id || null,
    });
  }
  const sensor = await Sensor.findOneAndUpdate(
    { _id: sensorId },
    { device_id, code, description, gateway: gw_id }
  );

  let updatedSensor = await Sensor.findOne({ _id: sensorId })

  if (!sensor) {
    res.status(400).send("Sensor update failed");
  } else {
    const wr = await Solution.findOne({ sensors: sensor._id });
    const fl = await Floor.findOne({ solutions: solution_id }).populate({
      path: "solutions",
    });
    const infra = await Infrastructure.findOne({ floors: floor_id }).populate({
      path: "floors",
      populate: {
        path: "solutions",
      },
    });
    const gw = await Gateway.findById(updatedSensor.gateway);
    let gw_wr;
    let gw_fl;
    let gw_r;
    if (gw_solution_id !== "") {
      gw_wr = await Solution.findById(gw_solution_id);
      gw_fl = await Floor.findOne({ solutions: gw_solution_id }).populate([
        {
          path: "rooms",
        },
        { path: "solutions" },
      ]);
    } else {
      gw_r = await Room.findById(gw_room_id);
      gw_fl = await Floor.findOne({ rooms: gw_room_id }).populate([
        {
          path: "rooms",
        },
        { path: "solutions" },
      ]);
    }

    const gw_infra = await Infrastructure.findOne({
      floors: gw_floor_id,
    }).populate({
      path: "floors",
      populate: [
        {
          path: "solutions",
        },
        {
          path: "rooms",
        },
      ],
    });

    const dir = `${process.cwd()}/${process.env.CERTIFICATE_DIR}/${sub}`;












    //


    const output = fs.createWriteStream(`${dir}/${device_id}.zip`);
    const archive = archiver("zip", {
      gzip: true,
      zlib: { level: 9 }, // Sets the compression level.
    });

    archive.on("error", function (err) {
      console.error(err)
      return false;
    });

    // pipe archive data to the output file
    archive.pipe(output);

    // append files
    archive.file(`${dir}/${device_id}.json`, {
      name: `${device_id}.json`,
    });
    archive.file(`${dir}/${gw._doc.gateway_id.trim()}_cert.pem`, {
      name: `${gw._doc.gateway_id.trim()}_cert.pem`,
    });
    archive.file(`${dir}/${gw._doc.gateway_id.trim()}_key.pem`, {
      name: `${gw._doc.gateway_id.trim()}_key.pem`,
    });

    //
    archive.finalize();











    //









    await fs.writeFileSync(`certificates/${sub}/${device_id}.json`, JSON.stringify(
      {
        ...sensor._doc,
        infrastructure: infra,
        floor: fl,
        solution: wr,
        gateway: {
          ...gw._doc,
          infrastructure: gw_infra,
          floor: gw_fl,
          solution: gw_wr,
          room: gw_r,
        },
        // publish:pub_data_update || {},
        config: {
          conf_data: device_config_update.sensor_config
        },
      }

    ))





    res.status(200).send({
      ...sensor._doc,
      infrastructure: infra,
      floor: fl,
      solution: wr,
      gateway: {
        ...gw._doc,
        infrastructure: gw_infra,
        floor: gw_fl,
        solution: gw_wr,
        room: gw_r,
      },
      publish: pub_data_update || {},
      config: {
        conf_data: device_config_update.sensor_config
      },
    });
  }
};


export const deleteSensor = async (req, res) => {
  const { sensorId } = req.params;
  const applicationType = req.query.type;
  let sensorData = await Sensor.findOne({ _id: sensorId })
  await GatewayTopicInfo.deleteOne({ device_id: sensorData.device_id })
  await unsubscribeTopic(sensorData.device_id)


  Sensor.findOneAndDelete({ _id: sensorId }).exec((err, sensor) => {
    if (err) {
      console.log(err);
      res.status(400).send("Sensor delete failed");
    } else {

      Solution.findOneAndUpdate(
        { sensors: sensorId },
        { $pull: { sensors: sensorId } }
      ).exec(async (err, solution) => {

        if (solution) {
          res.status(200).send(sensor);
        } else {
          res.status(400).send(`Failed to update ${applicationType}`);
        }
      });
      // if (applicationType === "washroom") {
      //   Washroom.findOneAndUpdate(
      //     { sensors: sensorId },
      //     { $pull: { sensors: sensorId } }
      //   ).exec(async (err, washroom) => {

      //     if (washroom) {
      //       res.status(200).send(sensor);
      //     } else {
      //       res.status(400).send("Failed to update washroom");
      //     }
      //   });
      // } else if (applicationType === "wellness") {
      //   Wellness.findOneAndUpdate(
      //     { sensors: sensorId },
      //     { $pull: { sensors: sensorId } }
      //   ).exec(async (err, wellness) => {

      //     if (wellness) {
      //       res.status(200).send(sensor);
      //     } else {
      //       res.status(400).send("Failed to update washroom");
      //     }
      //   });
      // }
    }
  });
};

export const getSensorData = async (req, res) => {

  const { sensorId } = req.params;
  if (sensorId == 'isSensorExist') {
    return;
  }
  const sensor = await Sensor.findOne({ _id: sensorId }).exec();
  // console.log(sensor,"sensor-------------")
  if (!sensor) {
    res.status(404).send("Sensor not found");
    return;
  }
  // get Publisgdata is if is added

  let publish_data = await PublishData.findOne({ device_id: sensor.device_id })

  if (publish_data === null) {
    publish_data = {}
  }

  // sensorCode = await sensorConfig.find({})
  //  console.log("--------------sensor code--------",sensorCode);

  const config_data = await DeviceConfiguration.findOne({ sensor_id: sensor.device_id })




  // console.log(sensor," sensor type is not define ");
  const sensor_type = await SensorType.findOne({ code: sensor.code }).populate({
    path: "components",
    populate: { path: "component" },
  });




  if (!sensor_type) {
    res
      .status(404)
      .send("Sensor type is not defined, please contact administrator");
    return;
  }
  const washroom = await Washroom.findOne({ sensors: sensor._id });
  if (!washroom) {
    res
      .status(404)
      .send(
        "Sensor is not belongs to any washroom, please contact administrator"
      );
    return;
  }
  const floor = await Floor.findOne({ washrooms: washroom._id }).populate({
    path: "washrooms",
  });
  if (!floor) {
    res
      .status(404)
      .send(
        "Washroom is not belongs to any floor, please contact administrator"
      );
    return;
  }
  const infra = await Infrastructure.findOne({ floors: floor._id }).populate({
    path: "floors",
    populate: {
      path: "washrooms",
    },
  });
  if (!infra) {
    res
      .status(404)
      .send("Floor is not belongs to any infra, please contact administrator");
    return;
  }

  const gateway = await Gateway.findById(sensor.gateway);
  if (!gateway) {
    res.status(404).send("There is no gateway for this sensor");
    return;
  }
  let gw_washroom;
  let gw_floor;
  let gw_room;

  if (gateway.washroom != null) {

    gw_washroom = await Washroom.findById(gateway.washroom);
    gw_floor = await Floor.findOne({ washrooms: gateway.washroom }).populate([
      {
        path: "rooms",
      },
      { path: "washrooms" },
    ]);
  } else {

    gw_room = await Room.findById(gateway.room);
    gw_floor = await Floor.findOne({ rooms: gateway.room }).populate([
      {
        path: "rooms",
      },
      { path: "washrooms" },
    ]);
  }
  const gw_infra = await Infrastructure.findOne({
    floors: gw_floor._id,
  }).populate({
    path: "floors",
    populate: [
      {
        path: "washrooms",
      },
      {
        path: "rooms",
      },
    ],
  });
  const params = {
    TableName: "Occupancy",
    KeyConditionExpression: "#deviceid = :code",
    ExpressionAttributeNames: {
      "#deviceid": "deviceid",
    },
    ExpressionAttributeValues: {
      ":code": sensor.code,
    },
    ScanIndexForward: false,
    Limit: 1,
  };

  // const result = await docClient.query(params).promise();


  res.status(200).send({
    ...sensor._doc,
    components: sensor_type.components,
    infrastructure: infra,
    floor,
    washroom,
    publish: publish_data,
    // data: result.Items[0],
    gateway: {
      ...gateway._doc,
      infrastructure: gw_infra,
      floor: gw_floor,
      washroom: gw_washroom,
      room: gw_room,
    },
    config: {
      conf_data: config_data.sensor_config
    },
  });
};


export const getWellnessSensorData = async (req, res) => {

  const { sensorId } = req.params;
  if (sensorId == 'isSensorExist') {
    return;
  }
  const sensor = await Sensor.findOne({ _id: sensorId }).exec();
  if (!sensor) {
    res.status(404).send("Sensor not found");
    return;
  }
  // get Publisgdata is if is added

  let publish_data = await PublishData.findOne({ device_id: sensor.device_id })

  if (publish_data === null) {
    publish_data = {}
  }

  // sensorCode = await sensorConfig.find({})
  //  console.log("--------------sensor code--------",sensorCode);

  const config_data = await DeviceConfiguration.findOne({ sensor_id: sensor.device_id })





  const sensor_type = await SensorType.findOne({ code: sensor.code }).populate({
    path: "components",
    populate: { path: "component" },
  });




  if (!sensor_type) {
    res
      .status(404)
      .send("Sensor type is not defined, please contact administrator");
    return;
  }
  const solution = await Solution.findOne({ sensors: sensor._id });
  if (!solution) {
    res
      .status(404)
      .send(
        "Sensor is not belongs to any solution, please contact administrator"
      );
    return;
  }

  const floor = await Floor.findOne({ solutions: solution._id }).populate({
    path: "solutions",
  });
  if (!floor) {
    res
      .status(404)
      .send(
        "Wellness is not belongs to any floor, please contact administrator"
      );
    return;
  }

  const infra = await Infrastructure.findOne({ floors: floor._id }).populate({
    path: "floors",
    populate: {
      path: "solutions",
    },
  });
  if (!infra) {
    res
      .status(404)
      .send("Floor is not belongs to any infra, please contact administrator");
    return;
  }

  const gateway = await Gateway.findById(sensor.gateway);
  if (!gateway) {
    res.status(404).send("There is no gateway for this sensor");
    return;
  }
  let gw_solution;
  let gw_floor;
  let gw_room;

  if (gateway.solution != null) {

    gw_solution = await Solution.findById(gateway.solution);
    gw_floor = await Floor.findOne({ solutions: gw_solution._id }).populate([
      {
        path: "rooms",
      },
      { path: "solutions" },
    ]);
  } else {

    gw_room = await Room.findById(gateway.room);
    gw_floor = await Floor.findOne({ rooms: gateway.room }).populate([
      {
        path: "rooms",
      },
      { path: "solutions" },
    ]);
  }
  const gw_infra = await Infrastructure.findOne({
    floors: gw_floor._id,
  }).populate({
    path: "floors",
    populate: [
      {
        path: "solutions",
      },
      {
        path: "rooms",
      },
    ],
  });
  const params = {
    TableName: "Occupancy",
    KeyConditionExpression: "#deviceid = :code",
    ExpressionAttributeNames: {
      "#deviceid": "deviceid",
    },
    ExpressionAttributeValues: {
      ":code": sensor.code,
    },
    ScanIndexForward: false,
    Limit: 1,
  };

  // const result = await docClient.query(params).promise();


  res.status(200).send({
    ...sensor._doc,
    components: sensor_type.components,
    infrastructure: infra,
    floor,
    solution,
    publish: publish_data,
    // data: result.Items[0],
    gateway: {
      ...gateway._doc,
      infrastructure: gw_infra,
      floor: gw_floor,
      solution: gw_solution,
      room: gw_room,
    },
    config: {
      conf_data: config_data.sensor_config
    },
  });
};


export const getSensorKeys = async (req, res) => {
  const { washroomId } = req.params;
  Washroom.findById(washroomId)
    .populate({ path: "sensors" })
    .exec(async (err, washroom) => {
      if (err || !washroom) {
        console.log(err);
        res.status(400).send("Cannot find washroom");
      } else {
        const sensors = washroom.sensors;
        const data = [];
        for (let i = 0; i < sensors.length; i++) {
          const params = {
            TableName: "Occupancy",
            KeyConditionExpression: "#deviceid = :code",
            ExpressionAttributeNames: {
              "#deviceid": "deviceid",
            },
            ExpressionAttributeValues: {
              ":code": sensors[i].code,
            },
            ScanIndexForward: false,
            Limit: 1,
          };
          // const result = await docClient.query(params).promise();
          // data.push(
          //   Object.keys(result.Items[0]).filter(
          //     (key) => key !== "deviceid" && key !== "timez"
          //   )
          // );
        }
        res.status(200).send([...new Set(data.flat(1))]);
      }
    });
};

export const downloadCertificates = async (req, res) => {
  const { sensorId } = req.params;
  const { sub, group } = req.kauth.grant.access_token.content;
  const sensor = await Sensor.findOne({ _id: sensorId }).exec();
  if (!sensor) {
    res.status(404).send("Sensor not found");
    return;
  }
  let subId = sub
  if (group[0] === "/Sub User") {
    let Im_user = await ImUsers.findOne({ subId: subId })
    subId = Im_user.parentUser

  }


  const file = `${process.env.CERTIFICATE_DIR}/${subId}/${sensor.device_id}.zip`;
  if (fs.existsSync(file)) {
    res.setHeader("Content-type", "application/zip");
    res.sendFile(path.join(process.cwd(), file)); // Set disposition and send it.
  } else {
    res.send("File not found!", 404);
  }
};


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'ifc_files')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

var storage2 = multer.diskStorage({
  destination: function (req, file, cb) {

    cb(null, `${process.cwd()}/upload`)
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

var upload = multer({ storage: storage }).single('file')
var upload2 = multer({ storage: storage2 }).array('file')



export const uploadIfc = (req, res) => {
  const filename = req.query?.filename;
  let fileHead = filename.split('.')[0];


  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err)
    } else if (err) {
      return res.status(500).json(err)
    }


    const ls = spawn("python3", [`cobie.py ifc_files/${filename} ./cobie_files/${fileHead} -f xlsx`], { shell: true });



    ls.stderr.on("data", data => {


    });

    ls.on('error', (error) => {
      console.log(`error: ${error.message}`);

    });

    ls.on("close", code => {
      console.log(`child process exited with code ${code}`);
      res.send("cobie file created")
    });


  })

}



export const downloadCobie = (req, res) => {
  const filename = req.query?.filename;

  let fileHead = filename.split('.')[0];
  let xlsxFile = fileHead + "." + "xlsx"


  const file = `${process.cwd()}/cobie_files/${xlsxFile}`;

  if (fs.existsSync(file)) {
    res.setHeader("Content-type", "application/xlsx");
    res.sendFile(file); // Set disposition and send it.
  } else {
    // res.send("File not found!", 404);
    res.status(404).send("File not found!")
  }



}

export const s3GatewayCertificates = async (req, res) => {
  let gateway_id = req.params.gatewayId;
  gateway_id = gateway_id.toLowerCase()

  try {
    const containerClient = blobServiceClient.getContainerClient(gateway_id);

    const streamDict = {};
    for await (const blob of containerClient.listBlobsFlat()) {
      console.log("\t", blob.name);
      // const blobName = blobNames[i];
      const blobClient = containerClient.getBlobClient(blob.name);
      const response = await blobClient.download(0); // download from 0 offset
      streamDict[blob.name] = response.blobDownloadStream;
    }


    await streamsToCompressed(
      streamDict,
      `${process.cwd()}/s3_certificates/${gateway_id}.zip`,
    );

    const file = `${process.cwd()}/s3_certificates/${gateway_id}.zip`;
    // console.log("------ file------------", file);
    if (fs.existsSync(file)) {
      res.setHeader("Content-type", "application/zip");
      res.sendFile(file); // Set disposition and send it.
    } else {
      // res.send("File not found!", 404);
      res.status(404).send("File not found!")
    }

  } catch (error) {
    console.log("--error--", error);

  }


}



export const generateTopic = async (req, res) => {
  const { sub } = req.kauth.grant.access_token.content;
  await upload2(req, res, function (err) {
    // console.log("-----req.body---",req.body);
    console.log(`${process.cwd()}`);
    // console.log("-----req.body000000---000---",JSON.parse(req.body.gatewayId));
    if (err instanceof multer.MulterError) {
      console.log("-------", err);
      return res.status(500).json(err)
    } else if (err) {
      console.log("----erro-r--------", err);
      return res.status(500).json(err)
    }
    // if (req.query.type === "washroom") {
    //   createSensor(req, res)
    // } else if (req.query.type === "wellness") {
    //   createWellnessSensor(req, res);
    // }

    createWellnessSensor(req, res);


  })




}
export const update_Sensor = async (req, res) => {
  const { sub } = req.kauth.grant.access_token.content;

  await upload2(req, res, function (err) {

    // console.log("-----req.body000000---000---",JSON.parse(req.body.gatewayId));
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err)
    } else if (err) {
      return res.status(500).json(err)
    }
    // if (req.query.type === "washroom") {
    //   updateSensor(req, res)
    // } else if (req.query.type === "wellness") {
    //   updateWellnessSensor(req, res)
    // }

    updateWellnessSensor(req, res)


  })




}

export const isSensorExist = async (req, res) => {

  try {
    let deviceId = req.params.deviceId;

    let isExist = await Sensor.exists({ device_id: deviceId })
    res.status(200).send(isExist)

  } catch (error) {
    res.status(403).send(error)
  }

}










export const parentSensorList = () => {

  const { sub } = req.kauth.grant.access_token.content;
  const applicationType = req.query.applicationType
  var pathType = "";
  if (applicationType === "washroom") {
    pathType = "washrooms"
  } else if (applicationType === "wellness") {
    pathType = "wellnesses"
  }


  // User.findOne({ sub: sub })
  //   .populate({
  //     path: "infrastructures",
  //     populate: {
  //       path: "floors",
  //       populate: {
  //         path: pathType,
  //         populate: { path: "sensors" },
  //       },
  //     },
  //   })
  //   .exec((err, user) => {
  //     if (err) {
  //       console.log(err);
  //       res.status(400).send(err);
  //     } else {
  //       if (!user) {
  //         res.status(400).send("User not found");
  //       } else {
  //         const floors = user.infrastructures
  //           .map((infra) => infra.floors)
  //           .flat();

  //         var sensors = [];
  //         if (applicationType === "washroom") {
  //           const washrooms = floors.map((floor) => floor.washrooms).flat();
  //           // sensors = washrooms.filter((dt) => sensors.includes(dt) === -1).map((wr) => sensors.push(wr.sensors)).flat();

  //           let result = washrooms.filter((thing, index, self) =>
  //             index === self.findIndex((t) => (
  //               t._id === thing._id
  //             ))
  //           )
  //           result = result.map((wr) => wr.sensors).flat();
  //           sensors = result
  //         }
  //         else if (applicationType === "wellness") {
  //           const wellnesses = floors.map((floor) => floor.wellnesses).flat();

  //           let result = wellnesses.filter((thing, index, self) =>
  //             index === self.findIndex((t) => (
  //               t._id === thing._id
  //             ))
  //           )
  //           result = result.map((wr) => wr.sensors).flat();

  //           sensors = result
  //         }
  //         res.status(200).send(sensors);
  //       }
  //     }
  //   });

}



