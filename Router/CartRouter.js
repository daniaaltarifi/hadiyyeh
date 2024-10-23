const express = require('express')
const router = express.Router();
const CartController = require('../Controller/CartController.js')
const bodyParser=require("body-parser")
const app=express();
app.use(express.json());
app.use(bodyParser.json()); 

router.post('/add', CartController.addToCart);
 router.get('/getcart/:user_id', CartController.getCartByuserID)
 router.put('/updatecart/:id', CartController.updateCartByuserID);
 router.delete('/deletefromcart/:id', CartController.deleteproductFromCart);

// router.get('/getusers', CartController.getUser)
// router.delete('/delete/:id', CartController.deleteUser)

module.exports = router