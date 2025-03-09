const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());
require("dotenv").config();
const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.in9z4qj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const tradeCollection = client.db("janatawifiDb").collection("data");

async function run() {
  try {
    //  crud commands
    app.get("/trades", async (req, res) => {
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const totalDocuments = await tradeCollection.countDocuments();
        const totalPage = Math.ceil(totalDocuments / limit);

        const result = await tradeCollection
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
    // add trade
    app.post("/add-trade", async (req, res) => {
      const data = req.body;
      const docs = {
        trade_code: data.trade_code,
        open: data.open,
        close: data.close,
        high: data.high,
        low: data.low,
        volume: data.volume,
        date: new Date().toISOString().split("T")[0],
      };
      try {
        const result = await tradeCollection.insertOne(docs);
        if (result) {
          console.log(result);
          res.status(200).json({ message: "Added succesfully" });
        }
      } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to Add data" });
      }
    });
    // get all treades code
    app.get("/tradecodes", async (req, res) => {
      try {
        const tradeCodes = await tradeCollection
          .aggregate([
            { $group: { _id: "$trade_code" } },
            { $project: { _id: 0, trade_code: "$_id" } },
          ])
          .toArray();

        res.json(tradeCodes);
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch trade codes" });
      }
    });
    // search
    app.get("/trade/:tradeCode", async (req, res) => {
      const code = req.params.tradeCode;
      const query = {
        trade_code: code,
      };
      try {
        const result = await tradeCollection.find(query).toArray();
        res.json({
          trades: result,
          totalTrades: result.length,
          tradeCode: code,
        });
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch data" });
      }
    });
    // update
    app.put("/trade/:id", async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;
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
        const result = await tradeCollection.updateOne(filter, updated);
        if (!result.modifiedCount == 1) {
          res.status(404).json({ message: "wrong information" });
        } else {
          res.status(200).json({ message: "updated succesfully" });
        }
      } catch (err) {
        res.status(500).json({ error: "can't update" });
      }
    });
    app.delete("/delete-trade/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      try {
        const result = await tradeCollection.deleteOne(query);
        if (result.deletedCount === 1) {
          console.log("Successfully deleted");
          res
            .status(200)
            .json({ message: `Succesfully deleted with id ${id}` });
        }
      } catch (err) {
        res.status(500).json({ error: "can't delete" });
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
