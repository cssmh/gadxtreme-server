const { ObjectId } = require("mongodb");
const client = require("../config/db");
require("dotenv").config();
const SSLCommerzPayment = require("sslcommerz-lts");
const OrderCollection = client.db("GadXtreme").collection("orders");

const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASS;
const is_live = false;

const sslPay = async (req, res) => {
  try {
    const tran_id = new ObjectId().toString();
    const {
      _id,
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
      success_url: `${process.env.SERVER}/payment/success/${tran_id}/${_id}`,
      fail_url: `${process.env.CLIENT}`,
      cancel_url: `${process.env.CLIENT}/cancel`,
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
          paidAt: Date.now(),
          payment: false,
        },
      };

      const result = await OrderCollection.updateOne(query, updateData, {
        upsert: true,
      });
      // console.log(result);
      // console.log("Redirecting to: ",GatewayPageURL);
    });
  } catch (error) {
    console.log(error);
  }
};

const successPay = async (req, res) => {
  try {
    const { tranId, id } = req.params;
    const query = { transactionId: tranId };
    const updateData = {
      $set: {
        payment: true,
      },
    };

    const result = await OrderCollection.updateOne(query, updateData);
    if (result.modifiedCount > 0) {
      console.log(`Payment successful for transaction ID: ${tranId}`);
      res.redirect(`${process.env.CLIENT}/success/${tranId}/${id}`);
    } else {
      console.error(`No order found with transaction ID: ${tranId}`);
      res.status(404).send("Order not found or already updated");
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = { sslPay, successPay };
