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
      "http://localhost:3000",
      "https://gadxtreme-906da.web.app",
      "https://gadxtreme.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(router);

app.get("/", (req, res) => {
  res.send("Gadxtreme e-commerce Server Running Smoothly");
});

app.listen(port, () => {
  console.log(`Xtreme Is Running On http://localhost:${port}`);
});
