const client = require("../config/db");
const userCollection = client.db("GadXtreme").collection("users");

const allUsers = async (req, res) => {
  try {
    const searchTerm = req.query?.search || "";
    const query = {
      $or: [{ name: { $regex: searchTerm, $options: "i" } }],
    };
    const result = await userCollection.find(query).toArray();
    res.send(result);
  } catch (err) {
    console.error(err);
  }
};

const addUser = async (req, res) => {
  try {
    const currentUser = req.body;
    const query = { email: currentUser?.email };
    const user = await userCollection.findOne(query);
    const role = user && user.role === "admin" ? "admin" : "guest";
    const options = { upsert: true };
    const result = await userCollection.updateOne(
      query,
      { $set: { ...currentUser, role } },
      options
    );

    res.send(result);
  } catch (err) {
    console.error(err);
  }
};

const getRole = async (req, res) => {
  try {
    if (req.decodedUser?.email !== req.params?.email) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    const email = req.params.email.toLowerCase();
    const user = await userCollection.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: "user not found" });
    }
    const result = user.role;
    res.send(result);
  } catch (err) {
    console.error(err);
  }
};

const userUpdate = async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    const query = { email };
    const updateDoc = {
      $set: { role: req.body.role },
    };
    const result = await userCollection.updateOne(query, updateDoc);
    res.send(result);
  } catch (err) {
    console.log(err);
  }
};

module.exports = { allUsers, addUser, getRole, userUpdate };
