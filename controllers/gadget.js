const client = require("../config/db");
const gadgetsCollection = client.db("GadXtreme").collection("gadgets");

const newArrival = async (req, res) => {
  try {
    const result = await gadgetsCollection.find().limit(6).toArray();
    res.send(result);
  } catch (error) {
    console.log(error);
  }
};

const popularGadget = async (req, res) => {
  try {
    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 8;
    const result = await gadgetsCollection
      .find()
      .skip(skip)
      .limit(limit)
      .toArray();
    res.send(result);
  } catch (error) {
    console.log(error);
  }
};

const bestSeller = async (req, res) => {
  try {
    const result = await gadgetsCollection
      .find({ category: "Best Seller" })
      .toArray();
    res.send(result);
  } catch (error) {
    console.log(error);
  }
};

const allProducts = async (req, res) => {
  try {
    const result = await gadgetsCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.log(error);
  }
};

module.exports = { newArrival, popularGadget, bestSeller, allProducts };
