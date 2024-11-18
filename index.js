const express = require("express");
const cors = require("cors");
const app = express();
const SSLCommerzPayment = require("sslcommerz-lts");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { ObjectId } = require("mongodb");
const client = require("./config/db");
require("dotenv").config();
const port = process.env.PORT;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://gadxtreme-906da.web.app",
      "https://gadxtreme.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

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

const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASS;
const is_live = false; //true for live, false for sandbox

async function run() {
  try {
    // await client.connect();
    const gadgetsCollection = client.db("GadXtreme").collection("gadgets");
    const wishlistCollection = client.db("GadXtreme").collection("wishlist");
    const cartCollection = client.db("GadXtreme").collection("cart");
    const OrderCollection = client.db("GadXtreme").collection("orders");
    const couponCollection = client.db("GadXtreme").collection("coupon");

    app.post("/payment-gateway", async (req, res) => {
      const tran_id = new ObjectId().toString();
      const {
        name,
        cartItems,
        email,
        country,
        district,
        address,
        mobileNumber,
      } = req.body;
      let totalAmount = 0;
      cartItems.forEach((item) => {
        totalAmount += item.price * item.quantity;
      });
      const data = {
        total_amount: totalAmount,
        currency: "BDT",
        tran_id: tran_id, // use unique tran_id for each api call
        success_url: `${process.env.SERVER}/payment/success/${tran_id}`,
        fail_url: "http://localhost:3030/fail",
        cancel_url: "http://localhost:3030/cancel",
        ipn_url: "http://localhost:3030/ipn",
        shipping_method: "Courier",
        product_name: "Computer.",
        product_category: "Gadget",
        product_profile: "general",
        cus_name: name,
        cus_email: email,
        cus_add1: country,
        cus_add2: "Dhaka",
        cus_city: district,
        cus_state: address,
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: mobileNumber,
        cus_fax: "01711111111",
        ship_name: "Customer Name",
        ship_add1: "Dhaka",
        ship_add2: "Dhaka",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
      };

      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      sslcz.init(data).then(async (apiResponse) => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL;
        res.send({ url: GatewayPageURL });

        const { _id, ...orderData } = req.body;
        const query = { _id: new ObjectId(_id) };
        const updateData = {
          $set: {
            ...orderData,
            transactionId: tran_id,
            createAt: Date.now(),
            payment: false,
          },
        };

        const result = await OrderCollection.updateOne(query, updateData, { upsert: true });
        console.log(result);
        console.log("Redirecting to: ", GatewayPageURL);
      });
    });

    app.post("/payment/success/:tranId", async (req, res) => {
      try {
        const { tranId } = req.params;
        const query = { transactionId: tranId };
        const updateData = {
          $set: {
            payment: true,
            paidAt: Date.now(),
          },
        };

        const result = await OrderCollection.updateOne(query, updateData);
        if (result.modifiedCount > 0) {
          console.log(`Payment successful for transaction ID: ${tranId}`);
          res.redirect(`${process.env.CLIENT}/success/${tranId}`);
        } else {
          console.error(`No order found with transaction ID: ${tranId}`);
          res.status(404).send("Order not found or already updated");
        }
      } catch (error) {
        console.log(error);
      }
    });

    // const isAdmin = async (req, res, next) => {
    //   const email = req.decodedUser.email;
    //   const user = await userCollection.findOne({ email });

    //   // if (email === demoAdmin) {
    //   //   req.demoAdmin = true;
    //   //   return next();
    //   // }
    //   if (!user || user?.role !== "admin") {
    //     return res.status(403).send({ message: "forbidden access" });
    //   }
    //   next();
    // };

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

    app.post("/api/place-order", async (req, res) => {
      try {
        const { email } = req.body;
        const result = await OrderCollection.insertOne(req.body);
        await cartCollection.deleteMany({ author: email });
        res.send(result);
      } catch (error) {
        console.log(error);
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

    app.get("/api/new-arrival", async (req, res) => {
      try {
        const result = await gadgetsCollection.find().limit(6).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/api/popular-gadget", async (req, res) => {
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
    });

    app.put("/api/cart", async (req, res) => {
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
    });

    app.put("/api/cart/:id", async (req, res) => {
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

    app.get("/api/my-cart", isToken, async (req, res) => {
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
    });

    app.get("/api/my-orders", isToken, async (req, res) => {
      if (req.decodedUser?.email !== req.query?.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      try {
        let query = {};
        if (req.query?.email) {
          query = { email: req.query.email };
        }
        const result = await OrderCollection.find(query).toArray();
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
