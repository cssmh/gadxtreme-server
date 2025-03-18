require("dotenv").config();
const jwt = require("jsonwebtoken");
const client = require("../config/db");
const demoAdmin = process.env.DEMO_ADMIN;
const userCollection = client.db("GadXtreme").collection("users");

const isToken = async (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      res.status(401).send({ message: "unauthorized access" });
    } else {
      req.decodedUser = decoded;
      next();
    }
  });
};

const isAdmin = async (req, res, next) => {
  const email = req.decodedUser.email;
  const user = await userCollection.findOne({ email });
  if (email === demoAdmin) {
    req.demoAdmin = true;
  }
  if (user?.role === "admin") {
    return next();
  }
  if (!user || user?.role !== "admin") {
    return res.status(403).send({ message: "forbidden access" });
  }
  next();
};

module.exports = { isToken, isAdmin };
