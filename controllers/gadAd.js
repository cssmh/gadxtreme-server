const { ObjectId } = require("mongodb");
const client = require("../config/db");
const gadgetsCollection = client.db("GadXtreme").collection("gadgets");
const userCollection = client.db("GadXtreme").collection("users");
const OrderCollection = client.db("GadXtreme").collection("orders");

const totalCounts = async (req, res) => {
  try {
    const totalOrder = await OrderCollection.countDocuments();
    const totalUser = await userCollection.countDocuments();
    const totalProduct = await gadgetsCollection.countDocuments();
    res.send({ totalOrder, totalUser, totalProduct });
  } catch (error) {
    console.log(error);
  }
};

const addGad = async (req, res) => {
  try {
    if (req.demoAdmin) {
      return res
        .status(402)
        .send({ message: "You are restricted to read-only actions." });
    }
    const result = await gadgetsCollection.insertOne(req.body);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
};

const searchProduct = async (req, res) => {
  try {
    const searchTerm = req.query?.search;
    if (!searchTerm || searchTerm.trim() === "") {
      return res.status(400).json({ message: "Search term is required." });
    }
    const query = {
      $or: [
        {
          productName: { $regex: searchTerm, $options: "i" },
        },
      ],
    };

    const result = await gadgetsCollection.find(query).toArray();
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred while searching." });
  }
};

const categoryProduct = async (req, res) => {
  const cate = req.params.category;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const skipIndex = (page - 1) * limit;
  let query = {};

  // Define category and subcategories conditions
  if (cate) {
    if (cate.toLowerCase() === "mobile accessories") {
      query = {
        category: {
          $in: [
            "Mobile Accessories",
            "Charging Accessories",
            "Converters & Hub",
            "Powerbank",
          ],
        },
      };
    } else if (cate.toLowerCase() === "earphones & headphones") {
      query = {
        category: {
          $in: [
            "Earphones & Headphones",
            "Wired Earphone",
            "Headphones",
            "Wireless Earphone",
          ],
        },
      };
    } else if (cate.toLowerCase() === "more") {
      query = {
        category: { $in: ["More", "Smart TV", "Laptop"] },
      };
    } else {
      query = { category: { $regex: new RegExp(`^${cate}$`, "i") } };
    }
  }

  try {
    const cursor = gadgetsCollection.find(query);
    const getTotal = (await gadgetsCollection.countDocuments(query)) || 0;
    const totalPages = Math.ceil(getTotal / limit) || 0;

    const result = await cursor.skip(skipIndex).limit(limit).toArray();
    res.send({ result, totalPages });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const singleGad = async (req, res) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };
    const result = await gadgetsCollection.findOne(query);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
};

const singleOrder = async (req, res) => {
  const query = { _id: new ObjectId(req.params.id) };
  const order = await OrderCollection.findOne(query);
  const user = await userCollection.findOne({ email: req.decodedUser?.email });
  if (order?.email !== req.decodedUser?.email && user.role !== "admin") {
    return res.status(403).send({ message: "Forbidden access" });
  }
  try {
    const result = await OrderCollection.findOne(query);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
};

const updateGad = async (req, res) => {
    if (req.demoAdmin) {
      return res
        .status(402)
        .send({ message: "You are restricted to read-only actions." });
    }
  const query = { _id: new ObjectId(req.params.id) };
  const options = { upsert: true };
  const updatedDoc = {
    $set: {
      productName: req.body.productName,
      price: req.body.price,
      discountPrice: req.body.discountPrice,
      images: req.body.images,
      inStock: req.body.inStock,
      category: req.body.category,
      keyFeatures: req.body.keyFeatures,
      description: req.body.description,
    },
  };
  try {
    const result = await gadgetsCollection.updateOne(
      query,
      updatedDoc,
      options
    );
    res.send(result);
  } catch (error) {
    console.log(error);
  }
};

const deleteGad = async (req, res) => {
    if (req.demoAdmin) {
      return res
        .status(402)
        .send({ message: "You are restricted to read-only actions." });
    }
  const query = { _id: new ObjectId(req.params.id) };
  try {
    const result = await gadgetsCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  totalCounts,
  addGad,
  searchProduct,
  categoryProduct,
  singleGad,
  singleOrder,
  updateGad,
  deleteGad,
};
