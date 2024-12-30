require("dotenv").config();
const jwt = require("jsonwebtoken");

const addJwt = async (req, res) => {
  try {
    const getToken = jwt.sign(req?.body, process.env.ACCESS_TOKEN, {
      expiresIn: "7d",
    });
    res
      .cookie("token", getToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
      .send({ success: true });
  } catch (err) {
    console.log(err);
  }
};

const getLogout = async (req, res) => {
  try {
    res
      .clearCookie("token", {
        maxAge: 0,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
      .send({ success: true });
  } catch (err) {
    console.log(err);
  }
};

module.exports = { addJwt, getLogout };
