import db from "../models/index.js";

const Component = db.component;

export const getComponents = async (req, res) => {
  Component.find().exec((err, components) => {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    } else {
      res.status(200).send(components);
    }
  });
};

export const createComponent = async (req, res) => {
  const {
    name,
    data_key,
    unit,
    type,
    title,
    text_color,
    background_color,
  } = req.body;
  const { file } = req;
  if (type === "text") {
    Component.create({
      data_key,
      name,
      unit,
      type,
      title,
      text_color,
      background_color,
    })
      .then((component) => {
        res.status(200).send(component);
      })
      .catch((err) => {
        console.log(err);
        res.status(400).send(err);
      });
  } else if (type === "image") {
    const icon_url = `/icons/${file.originalname}`;
    Component.create({
      data_key,
      name,
      unit,
      type,
      icon_url,
      title: "",
      text_color,
      background_color,
    })
      .then((component) => {
        res.status(200).send(component);
      })
      .catch((err) => {
        console.log(err);
        res.status(400).send(err);
      });
  } else {
    res.status(400).send("Unknown component type");
  }
};
