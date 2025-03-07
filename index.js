const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());
require("dotenv").config();
const port = 5000;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri =
  `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.in9z4qj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const janataCollection = client.db("janatawifiDb").collection("data");

async function run() {
  try {
    //  crud commands
    app.get("/trades", async (req, res) => {
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const totalDocuments = await janataCollection.countDocuments();
        const totalPage = Math.ceil(totalDocuments / limit);

        const result = await janataCollection
          .find()
          .skip(skip)
          .limit(limit)
          .toArray();
        res.json({
          data: result,
          currentPage: page,
          pageSize: limit,
          totalPage,
          totalDocuments,
        });
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch data" });
      }
    });
    // update
    app.put("/trade/:id", async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;
      console.log(updatedData);
      const filter = { _id: new ObjectId(id) };
      const updated = {
        $set: {
          high: updatedData.high,
          low: updatedData.low,
          open: updatedData.open,
          close: updatedData.close,
        },
      };
      try {
        const result = await janataCollection.updateOne(filter, updated);
        if(!result.modifiedCount==1){
          res.status(404).json({message: "wrong information"})
        }
        else{
          res.status(200).json({message: "updated succesfully"})
        }
        console.log(result);
      } catch (err) {
        console.log(err);
        res.status(500).json({ error: "can't update" });
      }
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
