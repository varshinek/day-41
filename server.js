const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const userRouter=require("./routes/userRouter")

const app = express();
app.use(cors());
app.use(bodyParser.json());

dotenv.config(); 

// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => {
//     ``;
//     useNewUrlParser: true;
//     useUnifiedTopology: true;
//     console.log("Connected to Mong oDB",process.env.MONGO_URI);
//   })

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB', process.env.MONGO_URI);
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB", err);
  });
app.use('/api',userRouter)
const PORT = process.env.PORT || 3001;
console.log("process.env.PORT", process.env.PORT);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});