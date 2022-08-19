import pg from "pg";

const Pool = pg.Pool;

import { filterSensorData } from "../utils/azure_utilities.js";

const execute = async (query, pool) => {
  let client;
  try {
    client = await pool.connect();
    // gets connection
    let data = await client.query(query); // sends queries
    return data;
  } catch (error) {
    // console.error(error);
    return false;
  } finally {
    // await client.end();         // closes connection
    client && client.release();
  }
};


export const getSensorData = async (req, res) => {

  console.log("--------------------36--------");
  const { sub, given_name, family_name, email, roles } = req.kauth.grant.access_token.content;
  let device_id = req.query.deviceId;
  let subId = sub.split("-").join("");
  const tableName = `sensordata_${given_name}_${subId}`;

  const pool = await new Pool({
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USERNAME,
    database: process.env.DATABASE_NAME,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
  });
  await pool.on("error", (err, client) => {
    // console.error("Unexpected error on idle client", err);
    process.exit(-1);
  });
  const text2 = `SELECT * FROM  ${tableName} WHERE device_id='${device_id}' AND timestamp > current_date - interval '1 days' ORDER BY timestamp DESC;`;

  // SELECT * FROM sensordata_helix_6122b281b685454c997c768cb92cde89 WHERE  timestamp > current_date - interval '7 days'

  await execute(text2, pool).then((result) => {
    if (result) {
      
      res.send(filterSensorData(result.rows));
    }
  });
};

export const getfilterSensorData = async (req, res) => {
  // console.log(req,"device id ");
  const { sub, given_name, family_name, email, roles } =
    req.kauth.grant.access_token.content;
  let device_id = req.query.deviceId;
  let subId = sub.split("-").join("");
  // const tableName = `sensordata_${given_name}_${subId}`;
  const tableName = `sensordata_${given_name}_${subId}`

  const pool = await new Pool({
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USERNAME,
    database: process.env.DATABASE_NAME,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
  });
  await pool.on("error", (err, client) => {
    // console.error("Unexpected error on idle client", err);
    process.exit(-1);
  });

  const text2 = `SELECT * FROM ${tableName}
  WHERE device_id='${device_id}' AND timestamp BETWEEN '${req.query.startDate} 00:00:01' AND '${req.query.endDate} 23:59:59'
  ORDER BY timestamp ;`;
  await execute(text2, pool).then((result) => {
    if (result) {

      console.log("----result.rows---",result.rows)
     
      res.send(filterSensorData(result.rows));
    }
  });
};

let subscribedList = [];

// ---------------------------------------------------------------------------

// export const pub_data = async (req, res) => {
//   let topicId = req.params.topicId;
//   let client = "";
//   const pub_info = await PublishData.findOne({ _id: topicId });
//   if (pub_info?.keyPath) {
//     client = await createConnectionWithCertficates(
//       pub_info.topic,
//       pub_info.host,
//       pub_info.port,
//       pub_info.keyPath,
//       pub_info.crtPath,
//       pub_info.rootCAPath
//     );
//   } else {
//     client = await createConnectionWithoutCertificates(
//       pub_info.topic,
//       pub_info.host,
//       pub_info.port
//     );
//   }

//   if (!subscribedList.includes(pub_info.topic)) {
//     client.client.subscribe(pub_info.topic, function () {
//       subscribedList.push(pub_info.topic);
//     });
//     client.client.on("message", function (topic1, message, packet) {
//       if (SOCKET?.connected) {
//         SOCKET.emit(topic1, message.toString());
//       }
//     });
//   }

//   res.send("topic  subcribed successfully");
// };

// export const getPublishList = async (req, res) => {
//   const pub_list = await PublishData.find({});
//   res.status(200).send(pub_list);
// };

// export const getTableList = async (req, res) => {
//   const { sub, given_name, family_name, email, roles } =
//     req.kauth.grant.access_token.content;

//   const pool = await new Pool({
//     host: process.env.POSTGRES_HOST,
//     user: process.env.POSTGRES_USERNAME,
//     database: given_name,
//     password: process.env.POSTGRES_PASSWORD,
//     port: process.env.POSTGRES_PORT,
//   });
//   await pool.on("error", (err, client) => {
//     // console.error("Unexpected error on idle client", err);
//     process.exit(-1);
//   });
//   const text2 = `SELECT table_name FROM information_schema.tables
//   WHERE table_schema='public'`;
//   await execute(text2, pool).then((result) => {
//     if (result) {
//       let tableList = result?.rows.map((d) => d.table_name);
//       res.send(tableList);
//     }
//   });
// };
