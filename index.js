const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = 2000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://gadxtreme-906da.web.app",
      "https://gadxtreme.netlify.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const client = new MongoClient(process.env.URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

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

async function run() {
  try {
    // await client.connect();
    const gadgetsCollection = client.db("gadXtreme").collection("gadgets");
    const wishlistCollection = client.db("gadXtreme").collection("wishlist");
    const cartCollection = client.db("gadXtreme").collection("cart");
    const couponCollection = client.db("gadXtreme").collection("coupon");

    const isAdmin = async (req, res, next) => {
      const email = req.decodedUser.email;
      const user = await userCollection.findOne({ email });

      // if (email === demoAdmin) {
      //   req.demoAdmin = true;
      //   return next();
      // }
      if (!user || user?.role !== "admin") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    app.post("/jwt", async (req, res) => {
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
    });

    app.get("/logout", async (req, res) => {
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
    });

    app.post("/api/product", async (req, res) => {
      try {
        const result = await gadgetsCollection.insertOne(req.body);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.post("/api/cart", async (req, res) => {
      try {
        const result = await cartCollection.insertOne(req.body);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.put("/api/cart/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      try {
        const options = { upsert: true };
        const updatedDoc = {
          $set: {
            quantity: req.body.quantity,
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
    });

    app.delete("/api/cart/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      try {
        const result = await cartCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/api/my-cart", async (req, res) => {
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
    });

    app.get("/api/search-products", async (req, res) => {
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
    });

    app.get("/api/all-products", async (req, res) => {
      try {
        const result = await gadgetsCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/api/products/:category", async (req, res) => {
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
            category: { $in: ["More", "Smart TV", "Laptops", "Others"] },
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
    });

    app.get("/api/product/:id", async (req, res) => {
      try {
        const query = { _id: new ObjectId(req.params.id) };
        const result = await gadgetsCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.put("/api/product/:id", async (req, res) => {
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
    });

    app.delete("/api/product/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      try {
        const result = await gadgetsCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. Successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to GadXtreme e-commerce Server");
});

app.listen(port, () => {
  console.log(`CRUD IS RUNNING ON PORT ${port}`);
});
