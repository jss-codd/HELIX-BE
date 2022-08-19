// import pg from "pg";
// const Pool = pg.Pool;
// import db from "../models/index.js";
// const User = db.user

// let userPool =[]







// export const  triggers = async ()=>{
   
   
//     const myuser = await  User.find({})
   

//     for (const data of myuser) {
//       const pool = await new Pool({
//         host: process.env.POSTGRES_HOST,
//         user: process.env.POSTGRES_USERNAME,
//         database: data.given_name,
//         password: process.env.POSTGRES_PASSWORD,
//         port: process.env.POSTGRES_PORT,
//       });
//       const triggerFunction =`CREATE  OR REPLACE FUNCTION notify_trigger() RETURNS trigger AS $$
//       DECLARE
//       BEGIN
//         PERFORM pg_notify('${data.given_name}', row_to_json(NEW)::text);
//         RETURN new;
//       END;
//       $$ LANGUAGE plpgsql;`

//       const  delete_trigger =`DROP TRIGGER IF EXISTS ${data.given_name} ON sensordata_${data.given_name};`

//       const trigger =`CREATE   TRIGGER ${data.given_name} AFTER INSERT ON  sensordata_${data.given_name}
//       FOR EACH ROW EXECUTE PROCEDURE notify_trigger();`


//       const text4 = `CREATE TABLE IF NOT EXISTS sensordata_${data.given_name} (
//         _id  VARCHAR (50),
//         device_id VARCHAR (50),
//         code VARCHAR ( 50 ) ,
//         description VARCHAR ( 255 ) ,
//         "Device_id" VARCHAR (25) ,
//         "createdAt" TIMESTAMP ,
//           "updatedAt" TIMESTAMP,
//           "occupancyStatus" REAL,
//           "occupancyCount" REAL,
//           "iaq" REAL,
//           "staticIaqValue" REAL,
//           "co2Value" REAL,
//           "voc" REAL,
//           "gasValue" REAL,
//           temperature REAL,
//           pressure REAL,
//           humidity REAL,
//           lux REAL,
//           "batVolt" REAL,
//           timestamp TIMESTAMP,
//           gateway JSON,
//           washroom JSON,
//           floor JSON,
//           infrastructure JSON,
//           sensor_configuration JSON
      
//       );`;


//       const table_access =`GRANT ALL PRIVILEGES ON TABLE sensordata_${data.given_name} TO ${data.given_name};`

//       const textDB = `ALTER DATABASE ${data.given_name} OWNER TO ${data.given_name};`;


//       try {
//   const client = await pool.connect()

// //  const pBD = await client.query(textDB)
// //   console.log("---------result--- table-----",pBD);



//   const result = await client.query(text4)
  

//    const del_teg= await client.query(delete_trigger)
   

  
//   const trrf= await client.query(triggerFunction)
  



//   const trr= await client.query(trigger)
  


// } catch (e) {
//   console.log(`--error-------${data.given_name}`,e);
  
// }
//     }



     
// }



// // try {
// //   const client = await pool.connect()

// //   const result = await client.query(table_access)
// // } catch (e) {
  
// // }
