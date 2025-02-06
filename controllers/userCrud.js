const { ObjectId } = require("mongodb");
const client = require("../config/db");
const cartCollection = client.db("GadXtreme").collection("cart");
const OrderCollection = client.db("GadXtreme").collection("orders");
const userCollection = client.db("GadXtreme").collection("users");

const myDashboard = async (req, res) => {
  if (req.decodedUser?.email !== req.query?.email) {
    return res.status(403).send({ message: "forbidden access" });
  }
  try {
    const email = req.query?.email;
    const cartQuery = { author: email };
    const cart = await cartCollection.find(cartQuery).toArray();
    const totalCart = cart.length;

    // Query for orders
    const orderQuery = { email: email };
    const orders = await OrderCollection.find(orderQuery).toArray();
    const totalOrders = orders.length;

    // Calculate total revenue from paid orders
    const totalRevenueFromPaidOrders = orders
      .filter((order) => order.payment === true) // Filter paid orders
      .reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0);

    // Calculate total revenue from unpaid cart items
    const totalRevenueFromUnpaidCart = cart
      .filter((item) => !item.payment) // Filter unpaid cart items
      .reduce((sum, item) => sum + parseFloat(item.price || 0), 0);

    // Total revenue (sum of revenue from paid orders and unpaid cart items)
    const totalRevenue =
      totalRevenueFromPaidOrders + totalRevenueFromUnpaidCart;

    // Send the response
    res.send({
      totalCart,
      totalOrders,
      totalRevenue: totalRevenue.toFixed(2), // Format to 2 decimal places
      unpaid: totalRevenueFromUnpaidCart.toFixed(2), // Unpaid amount
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal server error" });
  }
};

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
    const result = await OrderCollection.find(query)
      .sort({ _id: -1 })
      .toArray();
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
      const newItem = {
        gadgetId,
        author,
        image,
        name,
        price,
        quantity,
        cartAdded: new Date(),
      };
      const result = await cartCollection.insertOne(newItem);
      res.send(result);
    }
  } catch (error) {
    console.error(error);
  }
};

const updateCart = async (req, res) => {
  const query = { _id: new ObjectId(req.params.id) };
  const order = await OrderCollection.findOne(query);

  if (order?.email !== req.decodedUser?.email) {
    return res.status(403).send({ message: "Forbidden access" });
  }
  try {
    const options = { upsert: true };
    const updatedDoc = {
      $set: {
        quantity: Number(req.body.quantity),
      },
    };
    const result = await cartCollection.updateOne(query, updatedDoc, options);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
};

const deleteCart = async (req, res) => {
  const query = { _id: new ObjectId(req.params.id) };
  const cart = await cartCollection.findOne(query);
  const user = await userCollection.findOne({ email: req.decodedUser?.email });
  if (cart?.author !== req.decodedUser?.email && user.role !== "admin") {
    return res.status(403).send({ message: "Forbidden access" });
  }
  try {
    const result = await cartCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  myDashboard,
  myCart,
  myReview,
  pendingReview,
  myOrders,
  placeOrder,
  addCart,
  updateCart,
  addReview,
  deleteCart,
};
