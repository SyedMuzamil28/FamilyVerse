const express = require("express");
const Memory = require("../models/Memory");
const auth = require("../middleware/auth");
const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const mems = await Memory.find({ familyId: req.user.familyId }).sort({ createdAt: -1 });
    res.json(mems);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", auth, async (req, res) => {
  try {
    const mem = new Memory({ ...req.body, familyId: req.user.familyId, addedBy: req.user.name, addedById: req.user._id });
    await mem.save();
    res.json(mem);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch("/:id/heart", auth, async (req, res) => {
  try {
    const mem = await Memory.findById(req.params.id);
    if (!mem) return res.status(404).json({ error: "Not found" });
    const liked = mem.likedBy.includes(req.user._id);
    if (liked) { mem.likedBy.pull(req.user._id); mem.hearts = Math.max(0, mem.hearts - 1); }
    else { mem.likedBy.push(req.user._id); mem.hearts += 1; }
    await mem.save();
    res.json(mem);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await Memory.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
