const express = require("express");
const sharp = require("sharp");
const axios = require("axios");
const app = express();

app.get("/", async (req, res) => {
  const imageUrl = req.query.url;
  const width = parseInt(req.query.width);
  if (!imageUrl || !width) {
    return res.status(400).send("Missing required query parameters.");
  }

  try {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const resizedImage = await sharp(response.data)
      .resize({ width })
      .toBuffer();
    res.set("Content-Type", "image/jpeg");
    res.send(resizedImage);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error.");
  }
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
