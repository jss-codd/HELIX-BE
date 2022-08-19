import db from "../models/index.js";

const User = db.user;
const Infrastructure = db.infrastructure;

export const getInfras = async (req, res) => {
  const { sub } = req.kauth.grant.access_token.content;
  const solution = req.query.type;
  
  User.findOne({ sub: sub })
    .populate({
      path: "infrastructures",
      match: { 'solution': solution },
      populate: {
        path: "floors",
        populate: [
          {
            path: "solutions",
            match: { 'solution': solution },
            populate: { path: "sensors" },
          },
          {
            path: "rooms",
            populate: { path: "sensors" },
          },

        ],
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
          res.status(200).send(user.infrastructures);
        }
      }
    });
};

export const createInfras = async (req, res) => {
  const { sub } = req.kauth.grant.access_token.content;
  const { name, description, type, location } = req.body;
  const user = await User.findOne({ sub: sub });
  if (!user) {
    res.status(400).send("User not found");
    return;
  }
  Infrastructure.create({ name, description, type, location, floors: [] })
    .then((infra) => {
      User.findOneAndUpdate(
        { sub: sub },
        { $push: { infrastructures: infra._id } }
      ).exec((err, user) => {
        if (err) {
          console.log(err);
          res.status(400).send(err);
        } else {
          res.status(200).send(infra);
        }
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send();
    });
};

export const updateInfra = async (req, res) => {
  const { infraId } = req.params;
  const { name, description, type, location } = req.body;
  Infrastructure.findOneAndUpdate(
    { _id: infraId },
    { name, description, type, location }
  ).exec((err, infra) => {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    } else {
      res.status(200).send(infra);
    }
  });
};
