const express = require("express");
const { addJwt, getLogout } = require("../controllers/jwt");
const { sslPay, successPay } = require("../controllers/payment");
const {
  bestSeller,
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
  addReview,
  myReview,
  pendingReview,
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
const {
  makeOrderDelivered,
  deleteOrder,
  allOrders,
  allCarts,
} = require("../controllers/adminCrud");

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
router.get("/api/all-orders", isToken, isAdmin, allOrders);
router.get("/api/all-carts", isToken, isAdmin, allCarts);
router.get("/api/all-products", isToken, isAdmin, allProducts);

// users
router.put("/api/add-user", addUser);
router.get("/api/get-role/:email", isToken, getRole);
router.patch("/api/user-update/:email", isToken, isAdmin, userUpdate);
router.get("/api/all-users", isToken, isAdmin, allUsers);

// user crud
router.get("/api/my-dashboard", isToken, myDashboard);
router.get("/api/my-cart", isToken, myCart);
router.get("/api/my-review/:email", isToken, myReview);
router.get("/api/my-pending-review/:email", isToken, pendingReview);
router.get("/api/my-orders", isToken, myOrders);
router.post("/api/place-order", isToken, placeOrder);
router.put("/api/cart", isToken, addCart);
router.put("/api/cart/:id", updateCart);
router.put("/api/add-review/:id", isToken, addReview);
router.delete("/api/cart/:id", isToken, deleteCart);

// gadAdmin
router.get("/api/total-counts", isToken, isAdmin, totalCounts);
router.post("/api/product", isToken, isAdmin, addGad);
router.get("/api/search-products", searchProduct);
router.get("/api/products/:category", categoryProduct);
router.get("/api/product/:id", singleGad);
router.get("/api/order/:id", isToken, singleOrder);
router.put("/api/product/:id", isToken, isAdmin, updateGad);
router.delete("/api/product/:id", isToken, isAdmin, deleteGad);
router.patch("/api/orders/:id/deliver", isToken, isAdmin, makeOrderDelivered);
router.delete("/api/orders/:id", isToken, isAdmin, deleteOrder);

module.exports = router;
