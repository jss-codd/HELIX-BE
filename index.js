import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import fs from "fs";
import db from "./app/models/index.js";
import user from "./app/routes/user.js";
import washroom from "./app/routes/washroom.js";
import infrastructure from "./app/routes/infrastructure.js";
import floor from "./app/routes/floor.js";
import component from "./app/routes/component.js";
import sensor from "./app/routes/sensor.js";
import sensor_type from "./app/routes/sensor_type.js";
import gateway from "./app/routes/gateway.js";
import dotenv from "dotenv";
import im_users from './app/routes/im_users.js'
import sensor_config from './app/routes/sensor_configuration.js'
import sensor_data from './app/routes/sensor_data.js'
import publish_data from './app/routes/publish_data.js'
import plotly_dash from './app/routes/ploty_dash.js'
import application from './app/routes/applications.js'
import morgan from 'morgan'
import { createServer } from "http";
import { Server } from "socket.io";
import { main } from './app/utils/azure_receice_message.js'
import { mongo_add_solutuions } from './app/utils/mongo_add_solution.js'
import winston from "winston";
import "winston-daily-rotate-file";
dotenv.config();
// import docClient from "./app/config/dynamo.js";
import { keycloak, memoryStore } from "./app/config/keycloak.js";
import session from "express-session";
const app = express();


import { EventEmitter} from 'events'
const emitter = new EventEmitter()

/* 
Version : 1.0.0,
Author: Aniket Pandey ,
Date: 11 july 2022,
changes: Added logger , updated code to read sensor data and create colums dynamicaly in sensor data table.


Version : 1.0.1,
Author: Aniket Pandey ,
Date: 11 july 2022,
changes: changes for update sensor page.

Version : 1.0.2,
Author: Aniket Pandey ,
Date: 12 july 2022,
changes: changes for add washroom sensor and update washroom sensor.


Version : 1.0.3,
Author: Aniket Pandey ,
Date: 13 july 2022,
changes: Done add sensor and update sensor [branchName :  washroom-be].

Version : 1.0.4,
Author: Aniket Pandey ,
Date: 14 july 2022,
changes:  Washroom [done ] [branchName :  washroom-be]

version : 1.0.5,
Author: Aniket Pandey ,
Date: 18 july 2022,
changes: fix blank field issue 

version : 1.0.6,
Author: Aniket Pandey ,
Date: 21 july 2022,
changes: fix socketio multitab sensor trigger data"

version : 1.0.7,
Author: Aniket Pandey ,
Date: 26 july 2022,
changes: fix socketio multitab sensor trigger data (jira issue)

version : 1.0.8,
Author: Aniket Pandey ,
Date: 27 july 2022,
changes: fix Add logo issue (jira issue)

version : 1.0.9,
Author: Aniket Pandey ,
Date: 27 july 2022,
changes: subuser account implementation (jira issue)

version : 1.0.10,
Author: Aniket Pandey ,
Date: 4 aug 2022,
changes: fix blank column issue 
  

version : 1.0.11,
Author: Aniket Pandey ,
Date: 16 aug 2022,
changes: add featur of add ,update ,delete and get all applications"

version : 1.0.12,
Author: Aniket Pandey ,
Date: 17 aug 2022,
changes: dynamic applications implementations"

version : 1.0.13,
Author: Aniket Pandey ,
Date: 19 aug 2022,
changes: subuser  implementation"


*/







const myformat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.simple(),
  winston.format.printf((info) => {
    return `${info.timestamp}   ${info.level}: ${info.message} \n\n`;
  })
);

const transport = new winston.transports.DailyRotateFile({
  filename: "info",
  datePattern: "YYYY-MM-DD",
  zippedArchive: false,
  maxSize: "20m",
  maxFiles: "7d",
  colorize: true,
  json: true,
  extension: ".log",
  dirname: "logs_files",
});
const transport2 = new winston.transports.DailyRotateFile({
  filename: "error",
  datePattern: "YYYY-MM-DD",
  zippedArchive: false,
  maxSize: "20m",
  maxFiles: "7d",
  colorize: true,
  json: true,
  extension: ".log",
  dirname: "logs_files",
});

transport.on("rotate", function (oldFilename, newFilename) {

});

transport2.on("rotate", function (oldFilename, newFilename) {
});

// export const logger = winston.createLogger({
//   format: myformat,
//   transports: [
//     new winston.transports.File({ filename: 'combined.log',level: 'info' }),
//     new winston.transports.File({ filename: 'error.log',level: 'error' }),

//   ]
// });

const loggers = {
  info: winston.createLogger({
    level: "info",
    format: myformat,
    transports: [transport],
  }),

  error: winston.createLogger({
    level: "error",
    format: myformat,
    transports: [transport2],
  }),
};

export const logger = {
  info: (method, data) => {
    loggers.info.log("info", `method : ${method} ,data :`, {
      message: JSON.stringify(data),
    });
  },
  error: (method, errorMessage) => {
    loggers.error.log("error", `method : ${method} , errorMessage :`, {
      message: errorMessage,
    });
  },
};

// var corsOptions = {
//   origin: "http://localhost:3010",
// };

// app.use(cors(corsOptions));
app.use(cors());

app.use((req, res, next) => {
  // set the CORS policy
  res.header("Access-Control-Allow-Origin", "*");
  // set the CORS headers
  res.header(
    "Access-Control-Allow-Headers",
    "origin, X-Requested-With,Content-Type,Accept, Authorization"
  );
  // set the CORS method headers
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "GET PATCH DELETE POST");
    return res.status(200).json({});
  }
  next();
});

app.use(morgan("dev"));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(
//   session({
//     secret: "some secret",
//     resave: false,
//     saveUninitialized: true,
//     store: memoryStore,
//   })
// );
app.use(
  session({
    secret: "some secret",
    resave: false,
    saveUninitialized: true,
    store: memoryStore,
  })
);

app.use(keycloak.middleware());

const __dirname = path.resolve();
app.use("/static", express.static(path.join(__dirname, "public")));

// ------------------------------


const Site = db.site;
const Purchase = db.purchase;
const EnergyConsumption = db.energy_consumption;
const WorkOrder = db.work_order;
const SensorType = db.sensor_type;

function getRandomElements(arr, n) {
  var result = new Array(n),
    len = arr.length,
    taken = new Array(len);
  if (n > len)
    throw new RangeError("getRandom: more elements taken than available");
  while (n--) {
    var x = Math.floor(Math.random() * len);
    result[n] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
}

function initialDynamo() {
  const printResults = function (err, resp) {
    if (err) {
      console.log("Error running scan", err);
    } else {


      if (resp.ConsumedCapacity) {
        ;
      }
    }


  };

  const params = {
    TableName: "Occupancy",
    KeyConditionExpression: "#deviceid = :code",
    ExpressionAttributeNames: {
      "#deviceid": "deviceid",
    },
    ExpressionAttributeValues: {
      ":code": "01-aa-bb-cc-dd-03-02-05",
    },
    ScanIndexForward: false,
    Limit: 1,
  };

  // docClient.query(params, printResults);
}

function initial() {
  Purchase.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      Purchase.insertMany([
        {
          number: "PURCHASE001",
          status: "None Received",
        },
        {
          number: "PURCHASE002",
          status: "Part Received",
        },
        {
          number: "PURCHASE003",
          status: "None Received",
        },
        {
          number: "PURCHASE004",
          status: "None Received",
        },
        {
          number: "PURCHASE005",
          status: "None Received",
        },
        {
          number: "PURCHASE006",
          status: "Part Received",
        },
        {
          number: "PURCHASE007",
          status: "None Received",
        },
      ])
        .then(() => {
          console.log("added purchases");
        })
        .catch((err) => console.log("error", err));
    }
  });

  EnergyConsumption.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      EnergyConsumption.insertMany([
        {
          equipmentNumber: "EQUIPMENT0001",
          date: new Date(2021, 8, 1, 12, 9, 42),
          value: 123.1,
          type: "Amps",
        },
        {
          equipmentNumber: "EQUIPMENT0002",
          date: new Date(2021, 8, 2, 9, 0, 42),
          value: 123.2,
          type: "Boosts",
        },
        {
          equipmentNumber: "EQUIPMENT0003",
          date: new Date(2021, 7, 31, 18, 9, 5),
          value: 123.3,
          type: "Amps",
        },
        {
          equipmentNumber: "EQUIPMENT0004",
          date: new Date(2021, 8, 16, 5, 0, 0),
          value: 123.4,
          type: "Amps",
        },
        {
          equipmentNumber: "EQUIPMENT0005",
          date: new Date(2021, 8, 17, 12, 0, 0),
          value: 123.5,
          type: "Boosts",
        },
        {
          equipmentNumber: "EQUIPMENT0006",
          date: new Date(2021, 8, 15, 15, 10, 0),
          value: 123.6,
          type: "Boosts",
        },
      ])
        .then(() => {
          console.log("added consumptions");
        })
        .catch((err) => console.log("error", err));
    }
  });

  WorkOrder.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      WorkOrder.insertMany([
        {
          number: "ORDER0001",
          equipmentNumber: "EQUIPMENT0001",
          equipmentName: "Equipment 1",
          make: "MAKE 1",
          market: "COMPANY 1",
        },
        {
          number: "ORDER0002",
          equipmentNumber: "EQUIPMENT0002",
          equipmentName: "Equipment 2",
          make: "MAKE 2",
          market: "COMPANY 2",
        },
        {
          number: "ORDER0003",
          equipmentNumber: "EQUIPMENT0003",
          equipmentName: "Equipment 3",
          make: "MAKE 3",
          market: "COMPANY 3",
        },
        {
          number: "ORDER0004",
          equipmentNumber: "EQUIPMENT0004",
          equipmentName: "Equipment 4",
          make: "MAKE 4",
          market: "COMPANY 4",
        },
        {
          number: "ORDER0005",
          equipmentNumber: "EQUIPMENT0005",
          equipmentName: "Equipment 5",
          make: "MAKE 5",
          market: "COMPANY 5",
        },
        {
          number: "ORDER0006",
          equipmentNumber: "EQUIPMENT0006",
          equipmentName: "Equipment 6",
          make: "MAKE 6",
          market: "COMPANY 6",
        },
        {
          number: "ORDER0007",
          equipmentNumber: "EQUIPMENT0007",
          equipmentName: "Equipment 7",
          make: "MAKE 7",
          market: "COMPANY 7",
        },
        {
          number: "ORDER0008",
          equipmentNumber: "EQUIPMENT0008",
          equipmentName: "Equipment 8",
          make: "MAKE 8",
          market: "COMPANY 8",
        },
        {
          number: "ORDER0009",
          equipmentNumber: "EQUIPMENT0009",
          equipmentName: "Equipment 9",
          make: "MAKE 9",
          market: "COMPANY 9",
        },
      ])
        .then(() => {
          console.log("added work orders");
        })
        .catch((err) => console.log("error", err));
    }
  });

  Site.estimatedDocumentCount(async (err, count) => {
    if (!err && count === 0) {
      let purchases = await Purchase.find();
      let consumptions = await EnergyConsumption.find();
      let orders = await WorkOrder.find();
      Site.insertMany([
        {
          name: "TEXAS",
          corrective_maintenance: {
            labels: ["CLOSED", "OPEN", "PENDING"],
            data: [3, 6, 6],
          },
          preventive_maintenance: {
            labels: ["CLOSED", "OPEN", "PENDING"],
            data: [3, 6, 6],
          },
          purchases: getRandomElements(purchases, 4).map((p) => p._id),
          energy_consumptions: getRandomElements(consumptions, 2).map(
            (c) => c._id
          ),
          work_orders: getRandomElements(orders, 6).map((order) => order._id),
        },
        {
          name: "BANGALORE",
          corrective_maintenance: {
            labels: ["CLOSED", "OPEN", "PENDING"],
            data: [6, 6, 9],
          },
          preventive_maintenance: {
            labels: ["CLOSED", "OPEN", "PENDING"],
            data: [6, 6, 9],
          },
          purchases: getRandomElements(purchases, 6).map((p) => p._id),
          energy_consumptions: getRandomElements(consumptions, 6).map(
            (c) => c._id
          ),
          work_orders: getRandomElements(orders, 8).map((order) => order._id),
        },
        {
          name: "COIMBATORE ZONE",
          corrective_maintenance: {
            labels: ["CLOSED", "OPEN", "PENDING"],
            data: [1, 4.5, 3],
          },
          preventive_maintenance: {
            labels: ["CLOSED", "OPEN", "PENDING"],
            data: [1, 4.5, 3],
          },
          purchases: getRandomElements(purchases, 3).map((p) => p._id),
          energy_consumptions: getRandomElements(consumptions, 5).map(
            (c) => c._id
          ),
          work_orders: getRandomElements(orders, 7).map((order) => order._id),
        },
        {
          name: "HYDERABAD",
          corrective_maintenance: {
            labels: ["CLOSED", "OPEN", "PENDING"],
            data: [9, 5, 5],
          },
          preventive_maintenance: {
            labels: ["CLOSED", "OPEN", "PENDING"],
            data: [9, 5, 5],
          },
          purchases: getRandomElements(purchases, 5).map((p) => p._id),
          energy_consumptions: getRandomElements(consumptions, 4).map(
            (c) => c._id
          ),
          work_orders: getRandomElements(orders, 9).map((order) => order._id),
        },
        {
          name: "MUMBAI",
          corrective_maintenance: {
            labels: ["CLOSED", "OPEN", "PENDING"],
            data: [3, 6, 9],
          },
          preventive_maintenance: {
            labels: ["CLOSED", "OPEN", "PENDING"],
            data: [3, 6, 9],
          },
          purchases: getRandomElements(purchases, 2).map((p) => p._id),
          energy_consumptions: getRandomElements(consumptions, 3).map(
            (c) => c._id
          ),
          work_orders: getRandomElements(orders, 5).map((order) => order._id),
        },
      ])
        .then(() => {
          console.log("added sites");
        })
        .catch((err) => console.log("error", err));
    }
  });

  SensorType.estimatedDocumentCount(async (err, count) => {
    if (!err && count === 0) {
      SensorType.insertMany([
        {
          code: "01-aa-bb-cc-dd-03-02-05",
          description: "Some test description",
          components: [],
        },
        {
          code: "01-aa-bb-cc-dd-03-02-01",
          description: "Some test description",
          components: [],
        },
        {
          code: "01-aa-bb-cc-dd-03-04-01",
          description: "Some test description",
          components: [],
        },
      ])
        .then(() => {
          console.log("added sensor types");
        })
        .catch((err) => console.log("error", err));
    }
  });
}

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to HelixSense application." });
});

app.get("/user/:subId/logo/:fileName", (req, res) => {
  const { subId, fileName } = req.params;
  const file = `${process.env.UPLOAD_DIR}/${subId}/${fileName}`;
  if (fs.existsSync(file)) {
    res.sendFile(file); // Set disposition and send it.
  } else {
    res.send("File not found!", 404);
  }
});

app.get("/icons/:fileName", (req, res) => {
  const { fileName } = req.params;
  const file = `${process.env.UPLOAD_DIR}/icons/${fileName}`;
  if (fs.existsSync(file)) {
    res.sendFile(file); // Set disposition and send it.
  } else {
    res.send("File not found!", 404);
  }
});

// app.get("/api/infrastructures", (req, res) => {
//   res.status(200).send([]);
// });

// app.get("/api/verify", keycloak.protect("realm:app-user"), (req, res) => {
//   console.log(JSON.stringify(req.kauth.grant))
//   res.status(200).send("Token validated successfully");
// });

// app.use("/api/auth", auth);

app.use("/api/user", user);
app.use("/api/washrooms", washroom);
app.use("/api/infrastructures", infrastructure);
app.use("/api/components", component);
app.use("/api/floors", floor);
app.use("/api/sensors", sensor);
app.use("/api/sensor_types", sensor_type);
app.use("/api/gateways", gateway);
app.use("/api/im_users", im_users);
app.use("/api/sensor_config", sensor_config)
app.use("/api/sensor_data", sensor_data)
app.use("/api/publish_data", publish_data)
app.use("/api/plotly_dash", plotly_dash)
app.use("/api/application", application)


// set port, listen for requests
const PORT = process.env.PORT || 8081;
export let SOCKET = ""

db.mongoose
  .connect(process.env.DATABASE_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(async () => {
    console.log("Successfully connect to MongoDB.");
    initial();
        // mongo_add_solutuions()

    let myserver = await app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}.`)
    });

    const io = await new Server(myserver, {
      cors: {
        // origin: "https://example.com",
        methods: ["GET"],
        credentials: true
      }
    });

    await io.on('connection', (socket) => {
      SOCKET = socket
      console.log('a user connected');
    });



  })
  .catch((err) => {
    console.error("Connection error", err);
    logger.error("mongoDB connection", err.message);
    // process.exit();
  });



process.on('uncaughtException', function (err) {
  logger.error("uncaughtException", err.message);
  // Handle the error safely
  console.log("uncaught exception", err)
})
