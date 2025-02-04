const express = require("express");
const { addJwt, getLogout } = require("../controllers/jwt");
const { sslPay, successPay } = require("../controllers/payment");
const {
  bestSeller,
  allOrders,
  allCarts,
  newArrival,
  popularGadget,
  allProducts,
} = require("../controllers/gadget");
const {
  addUser,
  getRole,
  userUpdate,
  allUsers,
} = require("../controllers/users");
const { isToken, isAdmin } = require("../middlewares/auth");
const {
  placeOrder,
  addCart,
  updateCart,
  deleteCart,
  myCart,
  myOrders,
  myDashboard,
} = require("../controllers/userCrud");
const {
  totalCounts,
  addGad,
  searchProduct,
  categoryProduct,
  singleGad,
  singleOrder,
  updateGad,
  deleteGad,
} = require("../controllers/gadAd");

const router = express.Router();

// jwt
router.post("/jwt", addJwt);
router.get("/logout", getLogout);

// sslPay
router.post("/payment-gateway", sslPay);
router.post("/payment/success/:tranId/:id", successPay);

// gadget
router.get("/api/new-arrival", newArrival);
router.get("/api/popular-gadget", popularGadget);
router.get("/api/best-seller", bestSeller);
router.get("/api/all-orders", allOrders);
router.get("/api/all-carts", allCarts);
router.get("/api/all-products", allProducts);

// users
router.put("/api/add-user", addUser);
router.get("/api/get-role/:email", isToken, getRole);
router.patch("/api/user-update/:email", isToken, isAdmin, userUpdate);
router.get("/api/all-users", allUsers);

// user crud
router.get("/api/my-dashboard", isToken, myDashboard);
router.get("/api/my-cart", isToken, myCart);
router.get("/api/my-orders", isToken, myOrders);
router.post("/api/place-order", placeOrder);
router.put("/api/cart", addCart);
router.put("/api/cart/:id", updateCart);
router.delete("/api/cart/:id", deleteCart);

// gadAdmin
router.get("/api/total-counts", isToken, isAdmin, totalCounts);
router.post("/api/product", addGad);
router.get("/api/search-products", searchProduct);
router.get("/api/products/:category", categoryProduct);
router.get("/api/product/:id", singleGad);
router.get("/api/order/:id", isToken, singleOrder);
router.put("/api/product/:id", updateGad);
router.delete("/api/product/:id", deleteGad);

module.exports = router;
