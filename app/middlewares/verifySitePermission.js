import db from "../models/index.js";
import jwt from "jsonwebtoken";
import config from "../config/auth.js";
const Site = db.site;

const verify = (req, res, next) => {
  const { siteId } = req.params;
  Site.findById(siteId).exec((err, site) => {
    if (err) {
      res.status(400).send({ message: err });
      return;
    }

    if (!site) {
      res.status(404).send({ message: "Resource Not Found!" });
      return;
    }

    const names = req.kauth.grant.access_token.content.sites
    const roles = req.kauth.grant.access_token.content.roles;

    if (!names.includes(site.name) && !roles.includes("admin")) {
      res
        .status(404)
        .send({ message: "You don't have permission to view this site!" });
      return;
    }

    next();
  });
};

const verifySitePermission = {
  verify,
};

export default verifySitePermission;
