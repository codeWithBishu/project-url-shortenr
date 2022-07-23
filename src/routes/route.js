const express = require('express');
const router = express.Router();
const UrlController = require("../controllers/urlController")


// ---=+=---------=+=----------=+=----------- [ Route APIs ] ---=+=---------=+=----------=+=-----------//

router.post("/url/shorten",  UrlController.urlShorten)


router.get("/:urlCode", UrlController.getUrl)

router.all("/**", function (req, res) {res.status(400).send({status: false,msg: "The api you request is not available"})})


module.exports = router
