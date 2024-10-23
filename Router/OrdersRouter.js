const express = require('express')
const router = express.Router();
const OrdersController = require('../Controller/OrdersController.js')
const bodyParser=require("body-parser")
const app=express();
app.use(express.json());
app.use(bodyParser.json()); 

router.post('/addorder', OrdersController.addOrder);
router.get('/getorderbyid/:user_id', OrdersController.getorderByUserId);
router.post('/confirmorrejectorder', OrdersController.handleOrderStatusToConfirm);




module.exports = router