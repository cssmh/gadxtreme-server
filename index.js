const express = require("express");
const cors = require("cors");
const app = express();
const cookieParser = require("cookie-parser");
const router = require("./routes/gadRoutes");
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
app.use(router);

// async function run() {
//   try {
//     const wishlistCollection = client.db("GadXtreme").collection("wishlist");
//     const couponCollection = client.db("GadXtreme").collection("coupon");

//     await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. Successfully connected to MongoDB!");
//   } finally {
//     // await client.close();
//   }
// }
// run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Gadxtreme e-commerce Server Running Smoothly");
});

app.listen(port, () => {
  console.log(`Xtreme Is Running On http://localhost:${port}`);
});
