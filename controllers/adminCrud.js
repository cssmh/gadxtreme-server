const { ObjectId } = require("mongodb");
const client = require("../config/db");
const OrderCollection = client.db("GadXtreme").collection("orders");
const cartCollection = client.db("GadXtreme").collection("cart");
const couponCollection = client.db("GadXtreme").collection("coupon");

const makeOrderDelivered = async (req, res) => {
  const query = { _id: new ObjectId(req.params.id) };
  const update = { $set: { status: "Delivered" } };
  try {
    const result = await OrderCollection.updateOne(query, update);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
};

const deleteOrder = async (req, res) => {
  const query = { _id: new ObjectId(req.params.id) };
  try {
    const result = await OrderCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
};

const allOrders = async (req, res) => {
  try {
    const result = await OrderCollection.find().toArray();
    res.send(result);
  } catch (err) {
    console.log(err);
  }
};

const allCarts = async (req, res) => {
  try {
    const result = await cartCollection.find().toArray();
    res.send(result);
  } catch (err) {
    console.log(err);
  }
};

const addCoupon = async (req, res) => {
  try {
    const result = await couponCollection
    res.send(result);
  } catch (err) {
    console.log(err);
  }
};

module.exports = { makeOrderDelivered, deleteOrder, allOrders, allCarts };
