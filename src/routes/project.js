const express = require("express");
const controller = require("../controllers/projectController");

const router = express.Router();

router.post("/create", controller.create);
router.post("/addMember", controller.addMember);

module.exports = router;
