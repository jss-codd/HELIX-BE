// var pgtools = require("pgtools");
// const { Pool } = require("pg");
import pg from "pg";
import pgtools from "pgtools";

const Pool = pg.Pool;









export const dynamicDB = async (sub, username) => {


  const pool = await new Pool({
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USERNAME,
    database: process.env.DATABASE_NAME,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
  });
  pool.on("error", (err, client) => {
    console.error("Unexpected error on idle client", err);
    process.exit(-1);
  });
  const execute = async (query) => {
    let client;
    try {
      client = await pool.connect();
      // gets connection
      await client.query(query); // sends queries
      return true;
    } catch (error) {
      console.error("erro0r---",error);
      return false;
    } finally {
      // await client.end();         // closes connection
      client && client.release(true);
    }
  };

  let subId = sub.split("-").join("");
  // console.log("-----------------sub id------",sub,"888",subId);

  const tableName = `sensordata_${username}_${subId}`




      const text4 = `CREATE TABLE IF NOT EXISTS  ${tableName} (
          _id  VARCHAR (255),
          device_id VARCHAR (255)
        );`;

      await execute(text4).then((result) => {
        if (result) {
          console.log(`table created successfully for   user ${username}`);
          // pool.end().then(() => console.log('pool has ended'))
        }
      });

      // const table_access =`GRANT ALL PRIVILEGES ON TABLE sensordata_${username} TO ${username};`
      // await execute(table_access).then((result) => {
      //   if (result) {
      //     console.log(
      //       `privalge given to  table  successfully for   user ${username}`
      //     );
      //     // pool.end().then(() => console.log('pool has ended'))
      //   }
      // });

      // const triggerFunction = `CREATE  OR REPLACE FUNCTION notify_trigger() RETURNS trigger AS $$
      //    DECLARE
      //    BEGIN
      //      PERFORM pg_notify('${process.env.POSTGRES_USERNAME}', row_to_json(NEW)::text);
      //      RETURN new;
      //    END;
      //    $$ LANGUAGE plpgsql;`;

      // await execute(triggerFunction).then((result) => {
      //   if (result) {
      //     console.log(
      //       `trigger function  created for table  successfully for   user ${process.env.POSTGRES_USERNAME}`
      //     );
      //     // pool.end().then(() => console.log('pool has ended'))
      //   }
      // });

      // const trigger = `CREATE  TRIGGER ${username} AFTER INSERT ON  ${tableName}
      // FOR EACH ROW EXECUTE PROCEDURE notify_trigger();`;

      // await execute(trigger).then((result) => {
      //   if (result) {
      //     console.log(
      //       `trigger   created for table  successfully for   user ${process.env.POSTGRES_USERNAME}`
      //     );
      //   }
      // });
    
     
       

      


    

  
};
