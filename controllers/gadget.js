const client = require("../config/db");
const gadgetsCollection = client.db("GadXtreme").collection("gadgets");
const cartCollection = client.db("GadXtreme").collection("cart");
const OrderCollection = client.db("GadXtreme").collection("orders");

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
        const result = await gadgetsCollection.find({ category: "Best Seller" }).toArray()
        res.send(result)
    } catch (error) {
        console.log(error);
    }
};

const allOrders = async (req, res) => {
    try {
        const result = await OrderCollection.find().toArray();
        res.send(result)
    } catch (err) {
        console.log(err);
    }
};

const allCarts = async (req, res) => {
    try {
        const result = await cartCollection.find().toArray();
        res.send(result)
    } catch (err) {
        console.log(err);
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

module.exports = { newArrival, popularGadget, bestSeller, allOrders, allCarts, allProducts, };
