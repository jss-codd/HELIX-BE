import { spawn } from "child_process";
import csv from "csvtojson";
import db from "../models/index.js";
import pkg from "mongodb";
import path from 'path';

const { ObjectId } = pkg;
const Washroom = db.washroom;
const Component = db.component;
const Floor = db.floor;
const User = db.user;

export const getWashrooms = async (req, res) => {
  const { sub } = req.kauth.grant.access_token.content;
  User.findOne({ sub: sub })
    .populate({
      path: "infrastructures",
      populate: {
        path: "floors",
        populate: { path: "washrooms" },
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
            .map((infra) =>
              infra.floors.map((floor) => ({
                ...floor._doc,
                infrastructure: infra,
              }))
            )
            .flat(1);
          const washrooms = floors
            .map((floor) =>
              floor.washrooms?.map((wr) => ({ ...wr._doc, floor }))
            )
            .flat(1);
          res.status(200).send(washrooms);
        }
      }
    });
};

export const getWashroomStatistic = async (req, res) => {
  const { from, to } = req.body;
  const { sub } = req.kauth.grant.access_token.content;
  const user = await User.findOne({ sub: sub }).populate({
    path: "infrastructures",
    populate: {
      path: "floors",
      populate: { path: "washrooms", populate: { path: "sensors" } },
    },
  });

  const floors = user.infrastructures
    .map((infra) =>
      infra.floors.map((floor) => ({
        ...floor._doc,
        infrastructure: infra,
      }))
    )
    .flat(1);
  const washrooms = floors
    .map((floor) => floor.washrooms?.map((wr) => ({ ...wr._doc, floor })))
    .flat(1);
  const python = spawn("python3", [process.env.STATISTIC_SCRIPT, from, to]);

  python.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  python.on("close", async (code) => {
    if (code > 0) {
      res.status(500).send({ message: "Error when running statistic" });
      return;
    }
    const sensorData = await csv().fromFile("./washroom_statistic.csv");
    console.log("sending statistic to customer");
    // send data to browser
    res.status(200).send({
      sensorData,
      washrooms,
    });
  });
};

export const predict = async (req, res) => {
  const { washroom, fromDate, toDate } = req.body;
  console.log({ fromDate, toDate });
  Washroom.findById(washroom)
    .populate({
      path: "sensors",
      populate: { path: "sensors" },
    })
    .exec((err, wr) => {
      if (err || !wr) {
        console.log(err);
        res.status(400).send("No washroom found!");
        return;
      } else if (wr.sensors.length < 1) {
        res.status(400).send("No sensor found for selected washroom!");
        return;
      } else {
        const python = spawn("python3", [
          path.join(process.cwd(), process.env.PREDICTION_SCRIPT),
          wr.sensors[0].device_id.trim(),
          fromDate,
          toDate,
        ]);

        python.stderr.on("data", (data) => {
          console.error(`stderr---119: ${data}`);
        });

        python.on("close", async (code) => {
          if (code > 0) {
            console.log(code, "---code---124")
            res.status(500).send({ message: "Error when running prediction" });
            return;
          }
          const washroomData = await csv().fromFile("./washroom_data.csv");
          console.log(washroomData, "---washroomData---128")
          const people_count = await csv().fromFile("./People_count.csv");
          console.log(people_count, "---people_count---130")
          const iaq_forecast = await csv().fromFile("./Iaq_forecast.csv");
          console.log(iaq_forecast, "---iaq_forecast---132")
          console.log("sending prediction to customer");
          // send data to browser
          res.status(200).send({
            washroom: washroomData.map((w) => ({
              ds: w.timez.replace("T", " ").replace("Z", ""),
              ...w,
            })),
            people_count,
            iaq_forecast,
          });
        });
      }
    });

  // const washroomData = await csv().fromFile("./washroom_data.csv");
  // const people_count = await csv().fromFile("./People_count.csv");
  // const iaq_forecast = await csv().fromFile("./Iaq_forecast.csv");
  // console.log("sending prediction to customer");
  // // send data to browser
  // res.status(200).send({
  //   washroom: washroomData.map((wr) => ({
  //     ds: wr.timez.replace("T", " ").replace("Z", ""),
  //     ...wr,
  //   })),
  //   people_count,
  //   iaq_forecast,
  // });
};

export const createWashrooms = async (req, res) => {
  const { floorId } = req.params;
  const { washrooms } = req.body;
  Washroom.insertMany(washrooms)
    .then((results) => {
      Floor.findOneAndUpdate(
        { _id: floorId },
        { washrooms: results.map((w) => w._id) }
      ).exec((err, floor) => {
        if (err) {
          console.log(err);
          res.status(400).send("Washrooms created but not added to floor");
        } else {
          res.status(200).send(results);
        }
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(400).send("Create washroom failed");
    });
};

export const updateWashrooms = async (req, res) => {
  const { floorId } = req.params;
  const { washrooms } = req.body;
  const existedWashrooms = washrooms.filter((f) => f._id);
  const newWashrooms = washrooms.filter((f) => !f._id);
  const results = [];
  existedWashrooms.forEach(async (washroom) => {
    const wr = await Washroom.findByIdAndUpdate(washroom._id, washroom);
    results.push(wr);
  });
  if (newWashrooms.length > 0) {
    const wrs = await Washroom.insertMany(newWashrooms);
    results.push(...wrs);
    await Floor.findOneAndUpdate(
      { _id: floorId },
      { washrooms: wrs.map((f) => f._id) }
    );
  }
  res.status(200).send(results);
};

export const createComponent = async (req, res) => {
  const { washroomId } = req.params;
  const { type, key, description, gateway, sensor } = req.body;
  Component.create({
    type,
    key,
    description,
    gateway,
    sensor,
  })
    .then((component) => {
      Washroom.findOneAndUpdate(
        { _id: washroomId },
        { $push: { components: component } }
      ).exec((err, wr) => {
        if (err) {
          console.log(err);
          res.status(400).send("Component created but not added to washroom");
        } else {
          res.status(200).send(component);
        }
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(400).send("Create component failed");
    });
};

export const updateComponent = async (req, res) => {
  const { componentId } = req.params;
  Component.findOneAndUpdate({ _id: componentId }, req.body).exec(
    (err, component) => {
      if (err) {
        console.log(err);
        res.status(400).send("Component update failed");
      } else {
        res.status(200).send(component);
      }
    }
  );
};

export const deleteComponent = async (req, res) => {
  const { componentId } = req.params;
  Component.findOneAndDelete({ _id: componentId }).exec((err, component) => {
    if (err) {
      console.log(err);
      res.status(400).send("Component delete failed");
    } else {
      res.status(200).send(component);
    }
  });
};
