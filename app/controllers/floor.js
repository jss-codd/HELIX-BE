import db from "../models/index.js";

const Floor = db.floor;
const Infrastructure = db.infrastructure;

export const createFloors = async (req, res) => {
  const { infraId } = req.params;
  const { floors } = req.body;
  Floor.insertMany(floors)
    .then((results) => {
      Infrastructure.findOneAndUpdate(
        { _id: infraId },
        { floors: results.map((f) => f._id) }
      ).exec((err, infra) => {
        if (err) {
          console.log(err);
          res.status(400).send("Floors created but not added to infra");
        } else {
          res.status(200).send(results);
        }
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(400).send("Create floor failed");
    });
};

export const updateFloors = async (req, res) => {
  const { infraId } = req.params;
  const { floors } = req.body;
  const existedFloors = floors.filter((f) => f._id);
  const newFloors = floors.filter((f) => !f._id);
  const results = [];
  existedFloors.forEach((floor) => {
    Floor.findByIdAndUpdate(floor._id, floor)
      .then((f) => results.push(f))
      .catch((err) => console.log(err));
  });
  newFloors.length > 0 &&
    Floor.insertMany(newFloors)
      .then((flrs) => {
        Infrastructure.findOneAndUpdate(
          { _id: infraId },
          { floors: flrs.map((f) => f._id) }
        ).exec((err, infra) => {
          if (err) {
            console.log(err);
          } else {
            results.push(...flrs);
          }
        });
      })
      .catch((error) => {
        console.log(error);
      });
  res.status(200).send(results);
};
