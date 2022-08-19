// const fs = require("fs");
// const archiver = require("archiver");
import fs from 'fs'
import archiver from 'archiver';

export const streamsToCompressed = (streamDict, outputFilePath) => {
  return new Promise(async (resolve, reject) => {


    // create a file to stream archive data to.
    // In case you want to directly stream output in http response of express, just grab 'res' in that case instead of creating file stream
    const output = fs.createWriteStream(outputFilePath);
    const archive = archiver("zip", {
      gzip: true,
      zlib: { level: 9 }, // Sets the compression level.
    });



    output.on("close", () => {
      console.log(archive.pointer() + " total bytes");
      console.log(
        "archiver has been finalized and the output file descriptor has closed."
      );
      resolve();
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on("warning", (err) => {
      if (err.code === "ENOENT") {
        // log warning
      } else {
        // throw error
        throw err;
      }
    });

    // good practice to catch this error explicitly
    archive.on("error", (err) => {
      throw err;
    });

    // pipe archive data to the file
    archive.pipe(output);

    for (const blobName in streamDict) {
      const readableStream = streamDict[blobName];

      // finalize the archive (ie we are done appending files but streams have to finish yet)
      archive.append(readableStream, { name: blobName });

      readableStream.on("error", reject);
    }

    await archive.finalize();

  });
}

function toLowerKeys(obj) {
  return Object.keys(obj).reduce((data, key) => {
    data[key.toLowerCase()] = obj[key];
    return data;
  }, {});
}

export const filterSensorData = (sensorData) => {

  return sensorData.map((dta) => {
    for (const [key, value] of Object.entries(dta)) {
      if (key === "__v") {

        delete dta[`${key}`]

      }

     else if (typeof value === "object" && key !== "device_id" && key !== "timestamp") {

        delete dta[`${key}`]
      }
      else if (typeof value === "string" && key !== "device_id" && key !== "timestamp") {
        if(isNaN(value)){
          delete dta[`${key}`]
        }else{
          dta[`${key}`] = +value; 
        }
      }
    }
    return toLowerKeys(dta);

  });
};