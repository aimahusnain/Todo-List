//jshint esversion:6
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";
import serverless from "serverless-http";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://muhammadhusnain:vzH8iZUxdPeNlTLQ@todolist-cluster.zwdtc7n.mongodb.net/todolistDB", { useNewUrlParser: true });

const itemSchema = {
  name: String
}

const Item = mongoose.model(
  "Item",
  itemSchema
)

// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + Button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];
const listSchema = {
  name: String,
  items: [itemSchema]
};
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


const List = mongoose.model("List", listSchema);

app.get("/", async function (req, res) {
  try {
    const foundItems = await Item.find({});
    
    console.log(foundItems);
    
    if (foundItems.length === 0 ) {
      Item.insertMany(defaultItems)
        .then(() => {
          console.log("Pass");
        })
        .catch((err) => {
          console.log("Fail");
          console.error(err);
        });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });

    }
    
  } catch (err) {
    console.error(err);
  }
});

app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

try {
  const foundList = await List.findOne({ name: customListName }).exec();

  if (!foundList) {
    const list = new List({
      name: customListName,
      items: defaultItems
    });

    await list.save();
    res.redirect("/" + customListName);
  } else {
    res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
  }
} catch (err) {
  console.error(err);
}


});

app.post("/", async function (req, res) {
  try {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
      name: itemName
    });

    if (listName === "Today") {
      await item.save();
      res.redirect("/");
    } else {
      const foundList = await List.findOne({ name: listName });
      if (foundList) {
        foundList.items.push(item);
        await foundList.save();
        res.redirect("/" + listName);
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred.");
  }
});


app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    try {
    const result = await Item.findByIdAndDelete(checkedItemId);
    if (result) {
      console.log("Successfully deleted your task");
    } else {
      console.log("Task not found");
    }
  } catch (err) {
    console.error("Error deleting task:", err);
  }
  res.redirect("/");  
  } else {
List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } })
  .then(() => {
    res.redirect("/" + listName);
  })
  .catch((err) => {
    console.error(err);
    // Handle the error as needed
    res.status(500).send("An error occurred.");
  });

  }

  
});


app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(4000, function() {
  console.log("Server started on port 4000");
});
