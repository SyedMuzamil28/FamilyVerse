const express = require("express");
const Family = require("../models/Family");
const User = require("../models/User");
const auth = require("../middleware/auth");
const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const family = await Family.findById(req.user.familyId).populate("members", "-password");
    res.json(family);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/challenges", auth, async (req, res) => {
  try {
    const family = await Family.findById(req.user.familyId);
    res.json(family?.challenges || [
      {id:1,title:"Hydration Hero",desc:"Drink 8 glasses of water",e:"💧",pts:10,done:false},
      {id:2,title:"Prayer Champion",desc:"Complete all 5 prayers",e:"🕌",pts:20,done:false},
      {id:3,title:"Helper of the Day",desc:"Help a family member",e:"🤝",pts:15,done:false},
      {id:4,title:"Gratitude Moment",desc:"Tell someone you appreciate them",e:"💝",pts:10,done:false},
      {id:5,title:"Learning Star",desc:"20 mins of reading",e:"📚",pts:15,done:false},
    ]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch("/challenges", auth, async (req, res) => {
  try {
    const family = await Family.findById(req.user.familyId);
    family.challenges = req.body.challenges;
    const done = req.body.challenges.filter(c=>c.done).length;
    family.happinessScore = Math.round((done/req.body.challenges.length)*100);
    await family.save();
    res.json({ challenges: family.challenges, happinessScore: family.happinessScore });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
