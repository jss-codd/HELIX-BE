import db from "../models/index.js";

const Gateway = db.gateway;
const User = db.user;

export const getGateways = async (req, res) => {

  const solution = req.query.type;
  const { sub } = req.kauth.grant.access_token.content;
  User.findOne({ sub: sub })
    .populate([
      {
        path: "infrastructures",
        match: { 'solution': solution },
        populate: {
          path: "floors",
          populate: {
            path: "solutions",
            match: { 'solution': solution },
            populate: {
               path: "sensors" },

          },
        },
      },
      {
        path: "gateways",
        match: { 'solutionType': solution },
      },
    ])
    .exec((err, user) => {
      if (err) {
        console.log(err);
        res.status(400).send(err);
      } else {
        if (!user) {
          res.status(400).send("User not found");
        } else {
          res.status(200).send(user.gateways);
        }
      }
    });
};

export const isGatewayExits = async (req, res) => {
  try {

    let gatewayId = req.params.gatewayId
    let isExist = await Gateway.exists({ _id: gatewayId })
    res.status(200).send(isExist)
  } catch (error) {
    console.log('--gateway -error--', error);

  }
}

export const isGatewayExitsByName = async (req, res) => {
  try {
    // console.log("-----gateway params---",req.query.name);
    let gatewayName = req.query.name
    let isExist = await Gateway.exists({ gateway_id: gatewayName })
    // console.log("---gateway exits---",isExist);
    res.status(200).send(isExist)


  } catch (error) {

  }
}
