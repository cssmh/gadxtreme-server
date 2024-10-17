const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = 5000;

app.use(
  cors({
    origin: [
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

// const isToken = async (req, res, next) => {
//   const token = req?.cookies?.token;
//   if (!token) {
//     return res.status(401).send({ message: "unauthorized access" });
//   }
//   jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
//     if (err) {
//       res.status(401).send({ message: "unauthorized access" });
//     } else {
//       req.decodedUser = decoded;
//       next();
//     }
//   });
// };

async function run() {
  try {
    // await client.connect();
    const gadgetsCollection = client.db("gadXtreme").collection("gadgets");

    // const isAdmin = async (req, res, next) => {
    //   const email = req.decodedUser.email;
    //   const user = await userCollection.findOne({ email });

    //   if (email === demoAdmin) {
    //     // Restrict the demo admin to read-only access
    //     req.demoAdmin = true;
    //     return next();
    //   }
    //   if (!user || user?.role !== "admin") {
    //     return res.status(403).send({ message: "forbidden access" });
    //   }
    //   next();
    // };

    // app.post("/jwt", async (req, res) => {
    //   try {
    //     const userEmail = req?.body;
    //     // console.log("user for token", userEmail);
    //     const getToken = jwt.sign(userEmail, process.env.ACCESS_TOKEN, {
    //       expiresIn: "5d",
    //     });
    //     res
    //       .cookie("token", getToken, {
    //         httpOnly: true,
    //         secure: process.env.NODE_ENV === "production",
    //         sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    //       })
    //       .send({ success: true });
    //   } catch (err) {
    //     console.log(err);
    //   }
    // });

    // app.get("/logout", async (req, res) => {
    //   try {
    //     // const user = req.body;
    //     // console.log(user);
    //     res
    //       .clearCookie("token", {
    //         maxAge: 0,
    //         secure: process.env.NODE_ENV === "production",
    //         sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    //       })
    //       .send({ success: true });
    //   } catch (err) {
    //     console.log(err);
    //   }
    // });

    app.post("/api/product", async (req, res) => {
      try {
        const result = await gadgetsCollection.insertOne(req.body);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/api/products", async (req, res) => {
      try {
        const result = await gadgetsCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/api/products/:category", async (req, res) => {
      const cate = req.params.category;
      let query = {};
      if (cate) {
        query = { category: { $regex: new RegExp(`^${cate}$`, "i") } };
      }
      try {
        const result = await gadgetsCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
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
    // console.log("Pinged your deployment. Successfully connected to MongoDB!");
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
