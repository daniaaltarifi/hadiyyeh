const express = require('express')
const router = express.Router();
const UserAdressController = require('../Controller/UserAddressController.js')
const bodyParser=require("body-parser")
const app=express();
app.use(express.json());
app.use(bodyParser.json()); 

router.post('/add', UserAdressController.addAddress);
router.get('/getaddress/:user_id', UserAdressController.getAddress);
router.put('/update/:id', UserAdressController.updateAddress);


module.exports = router