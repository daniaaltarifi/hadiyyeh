const express = require('express')
const router = express.Router();
const WalletController = require('../Controller/WalletController.js')
const bodyParser=require("body-parser")
const app=express();
app.use(express.json());
app.use(bodyParser.json()); 

router.post('/chargebalance', WalletController.chargeBalance);
router.post('/redeemcode', WalletController.redemCode);
router.post('/transferbalance', WalletController.transferBalance);
router.post('/confirmpayment', WalletController.confirmPayment);
router.get('/getpaymenttable', WalletController.getPaymentTable);
router.put('/update/balance', WalletController.decreseBalance);
router.delete('/deletepayment/:id', WalletController.deletePayment);


module.exports = router