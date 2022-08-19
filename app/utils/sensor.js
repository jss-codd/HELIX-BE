import archiver from "archiver";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import db from "../models/index.js";
import { certificateTemplate, transporter } from "../utils/email.js";
import { uploadFileToAzure } from "../utils/uploadFileToAzure.js";

const Washroom = db.washroom;
const Wellness = db.wellness;
const Floor = db.floor;
const Infrastructure = db.infrastructure;
const Gateway = db.gateway;
const Room = db.room;
const SensorData = db.sensor_data;
const Solution = db.solution

const AZURE_STORAGE_CONNECTION_STRING =
  "DefaultEndpointsProtocol=https;AccountName=certificatedownload;AccountKey=s6BN+yog96WvmceMe4psCsIE2YOuuus9hLMWa6TRyNLycFuBCMCJksgWXSInE1eC9xn7xCebuGoR+ASt5Prp4g==;EndpointSuffix=core.windows.net";



export const generateCertificateAndJsonConfig = async (
  user,
  sensor,
  region,
  sub,
  topicname,
  keyFileName,
  crtFileName,
  rootCAFileName,
  hosturl,
  config,
  port,
  publish,
  applicationType,
  res
) => {
  //get gateway_id

  const gateway = await Gateway.findById(sensor.gateway);
  // console.log("-------sensot-----------",sensor);

  const dir = `${process.env.CERTIFICATE_DIR}/${user.sub}`;
  // console.log("---------dir-----",dir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const python = spawn("python3", [
    // path.join(__dirname , process.env.CERTIFICATE_SCRIPT),
    path.join(path.resolve(), process.env.AZURE_CERTIFICATE_SCRIPT),
    dir,
    // sensor.device_id.trim(),
    gateway.gateway_id.trim(),
    region,
    user.email,
  ]);
  python.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  python.on("close", async (code) => {
    console.log("--------python code ---", code);
    // console.log(`${path.resolve()}/${dir}/${sensor.device_id.trim()}_key.pem`);

    if (
      !fs.existsSync(
        `${path.resolve()}/${dir}/${gateway.gateway_id.trim()}_key.pem`
      ) ||
      !fs.existsSync(
        `${path.resolve()}/${dir}/${gateway.gateway_id.trim()}_cert.pem`
      )
    ) {
      console.log("-------error---------5000");
      // res.status(500).send("Failed to generate sensor certificate");
    }

    // spawn("python3", [`cobie.py ifc_files/${filename} ./cobie_files/${fileHead} -f xlsx`], { shell: true });

    const enroll_device = spawn(
      "node",
      [
        `${path.join(
          process.env.AZURE_ENROLL_SCRIPT
        )}   -d ${gateway.gateway_id.trim()} -p '${dir}'`,
      ],
      { shell: true, detached: true, stdio: "ignore" }
    );

    console.log(
      `${path.join(process.cwd(), process.env.AZURE_ENROLL_SCRIPT)}   -d ${sensor.device_id
      } -p '${dir}'`
    );

    // enroll_device.stderr.on("data", (data) => {
    //   console.error(`stderr: ${data}`);
    // });
    enroll_device.unref();

    console.log("---------------------",gateway, "gateway---------------");

    // console.log("------ad-ad-da-d---------------",code);

    // ------------------------------------code-------------------------
    console.log("------------applicationType-------", applicationType);

    // JSON file creation
    var floor = null
    var washroom = null
    var solution = null
    // if (applicationType === "washroom") {
    //   washroom = await Washroom.findOne({ sensors: sensor._id });

    //   floor = await Floor.findOne({ washrooms: washroom._id });
    //   console.log(washroom, floor, "-----------------124")
    // }
    // else if (applicationType === "wellness") {
    //   wellness = await Wellness.findOne({ sensors: sensor._id });
    //   floor = await Floor.findOne({ wellnesses: wellness._id });
    //   console.log(wellness, floor, "-----------------130")  { $and : [{$match : {'solutions.solution':applicationType},{''}}] }
    // }

        solution = await Solution.findOne({ sensors: sensor._id });
      floor = await Floor.findOne({
        solutions: solution._id,
      });
      console.log(solution, floor, "-----------------130")


    

    // console.log("-----------solution------", solution, "---flooor", floor);

    const infra = await Infrastructure.findOne({ floors: floor._id });
    // const gateway = await Gateway.findById(sensor.gateway);
    console.log(gateway, "gateway---------------");
    let gateway_washroom;
    let gateway_solution;
    let gateway_floor;
    let gateway_room;
    if (gateway.washroom) {
      gateway_washroom = await Washroom.findById(gateway.washroom);
      gateway_floor = await Floor.findOne({
        washrooms: gateway_washroom._id,
      });
    } else if (gateway.solution) {
      console.log("------gateway.solutio------",gateway.solution);
      // { solutions: {
      //   $elemMatch: { solutionType:applicationType,Ids:{$in:[solution._id]}} 
      //    } }
      gateway_solution = await Solution.findById(gateway.solution);
      gateway_floor = await Floor.findOne({
        solutions: gateway_solution._id,
      });
    } else {
      gateway_room = await Room.findById(gateway.room);
      gateway_floor = await Floor.findOne({
        rooms: gateway_room._id,
      });
    }
    const gateway_infra = await Infrastructure.findOne({
      floors: gateway_floor._id,
    });

    let configData;

    configData = {
      ...sensor._doc,
      washroom,
      floor,
      infrastructure: infra,
      gateway: {
        ...gateway._doc,
        washroom: gateway_washroom,
        room: gateway_room,
        floor: gateway_floor,
        infrastructure: gateway_infra,
      },
      sensor_configuration: config.conf_data,
    }

    // if (applicationType === "washroom") {
    //   configData = {
    //     ...sensor._doc,
    //     washroom,
    //     floor,
    //     infrastructure: infra,
    //     gateway: {
    //       ...gateway._doc,
    //       washroom: gateway_washroom,
    //       room: gateway_room,
    //       floor: gateway_floor,
    //       infrastructure: gateway_infra,
    //     },
    //     sensor_configuration: config.conf_data,
    //   }
    // } else if (applicationType === "wellness") {
    //   configData = {
    //     ...sensor._doc,
    //     solution,
    //     floor,
    //     infrastructure: infra,
    //     gateway: {
    //       ...gateway._doc,
    //       solution: gateway_solution,
    //       room: gateway_room,
    //       floor: gateway_floor,
    //       infrastructure: gateway_infra,
    //     },
    //     sensor_configuration: config.conf_data,
    //   }

    // }
    //  console.log("---*****",configData)
    fs.writeFileSync(
      `${path.resolve()}/${dir}/${sensor.device_id}.json`,
      JSON.stringify(configData)
    );

    const output = fs.createWriteStream(`${dir}/${sensor.device_id}.zip`);
    const archive = archiver("zip", {
      gzip: true,
      zlib: { level: 9 }, // Sets the compression level.
    });

    archive.on("error", function (err) {
      console.error(err);
      return false;
    });

    // pipe archive data to the output file
    archive.pipe(output);

    // append files
    archive.file(`${dir}/${sensor.device_id}.json`, {
      name: `${sensor.device_id}.json`,
    });
    archive.file(`${dir}/${gateway.gateway_id.trim()}_cert.pem`, {
      name: `${gateway.gateway_id.trim()}_cert.pem`,
    });
    archive.file(`${dir}/${gateway.gateway_id.trim()}_key.pem`, {
      name: `${gateway.gateway_id.trim()}_key.pem`,
    });

    //
    archive.finalize();

    const attachments_S3 = [
      {
        filename: `${sensor.device_id}.json`,
        path: `${dir}/${sensor.device_id}.json`,
      },
      {
        filename: `${gateway.gateway_id.trim()}_cert.pem`,
        path: `${dir}/${gateway.gateway_id.trim()}_cert.pem`,
      },
      {
        filename: `${gateway.gateway_id.trim()}_key.pem`,
        path: `${dir}/${gateway.gateway_id.trim()}_key.pem`,
      },
      // {
      //   filename: "AmazonRootCA1.pem",
      //   path: "certificate_generation/AmazonRootCA1.pem",
      // },
    ];


    for (let x of attachments_S3) {
      await uploadFileToAzure(gateway.gateway_id, x);
    }





    const attachments = [
      {
        filename: `${sensor.device_id}.json`,
        path: `${dir}/${sensor.device_id}.json`,
      },
      {
        filename: `${gateway.gateway_id}_cert.pem`,
        path: `${dir}/${gateway.gateway_id.trim()}_cert.pem`,
      },
      {
        filename: `${gateway.gateway_id}_key.pem`,
        path: `${dir}/${gateway.gateway_id.trim()}_key.pem`,
      },
    ];

    const emailTemplate = certificateTemplate(user, attachments);
    const sendEmail = () => {
      transporter.sendMail(emailTemplate, (err, info) => {
        if (err) {
          console.log(err);
        } else {
          console.log(`** Email sent **`, info.response);
        }
      });
    };
    sendEmail();

    //----------------
    // let topic =`washroom/${gateway.gateway_id}/pub`

    // let currentTopic = subscribedGatewayTopicLists.includes(topic);
    // // console.log("-----------currenent subsribe topic list",subscribedGatewayTopicLists)
    // if (!currentTopic) {
    //   subscribedGatewayTopicLists.push(topic);
    //   // console.log("--------current---topic list------", subscribedGatewayTopicLists);
    //   aws_mqtt_conn_client.subscribe(topic, function () {
    //     // console.log("--subgateway-1--", topic);
    //   });
    // }

    //-------------------

    res.status(200).send(sensor);
  });
};
