const { ObjectId } = require("mongodb");
const client = require("../config/db");
const cartCollection = client.db("GadXtreme").collection("cart");
const OrderCollection = client.db("GadXtreme").collection("orders");

const myCart = async (req, res) => {
    if (req.decodedUser?.email !== req.query?.email) {
        return res.status(403).send({ message: "forbidden access" });
    }
    try {
        let query = {};
        if (req.query?.email) {
            query = { author: req.query.email };
        }
        const result = await cartCollection.find(query).toArray();
        res.send(result);
    } catch (error) {
        console.log(error);
    }
};

const myOrders = async (req, res) => {
    if (req.decodedUser?.email !== req.query?.email) {
        return res.status(403).send({ message: "forbidden access" });
    }
    try {
        let query = {};
        if (req.query?.email) {
            query = { email: req.query.email };
        }
        const result = await OrderCollection.find(query).sort({ _id: -1 }).toArray();
        res.send(result);
    } catch (error) {
        console.log(error);
    }
};

const placeOrder = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await OrderCollection.insertOne(req.body);
        await cartCollection.deleteMany({ author: email });
        res.send(result);
    } catch (error) {
        console.log(error);
    }
};

const addCart = async (req, res) => {
    const { gadgetId, author, image, name, price, quantity } = req.body;
    try {
        const alreadyExist = await cartCollection.findOne({
            author,
            gadgetId,
        });

        if (alreadyExist) {
            const updatedItem = await cartCollection.updateOne(
                { author, gadgetId },
                { $inc: { quantity } }
            );
            res.send({
                success: true,
                message: "Quantity updated",
                result: updatedItem,
            });
        } else {
            const newItem = { gadgetId, author, image, name, price, quantity };
            const result = await cartCollection.insertOne(newItem);
            res.send({ success: true, message: "Item added to cart", result });
        }
    } catch (error) {
        console.error(error);
    }
};

const updateCart = async (req, res) => {
    const query = { _id: new ObjectId(req.params.id) };
    try {
        const options = { upsert: true };
        const updatedDoc = {
            $set: {
                quantity: Number(req.body.quantity),
            },
        };
        const result = await cartCollection.updateOne(
            query,
            updatedDoc,
            options
        );
        res.send(result);
    } catch (error) {
        console.log(error);
    }
};

const deleteCart = async (req, res) => {
    const query = { _id: new ObjectId(req.params.id) };
    try {
        const result = await cartCollection.deleteOne(query);
        res.send(result);
    } catch (error) {
        console.log(error);
    }
};

module.exports = { myCart, myOrders, placeOrder, addCart, updateCart, deleteCart, };
