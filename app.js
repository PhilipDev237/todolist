//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

const url = "mongodb+srv://admin-philip:ox3HhhNMWtbmevob@cluster0.3qjttdf.mongodb.net/todolistDB";

// connect to mongodb 
mongoose.connect(url);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// mongoose schema
const itemsSchema = new mongoose.Schema({
   name : String
});

// mongoose model
const Item = mongoose.model("Item", itemsSchema);

// new document
const item1 = new Item({
    name: "Buy Food"
});

const item2 = new Item({
    name: "Cook Food"
});

const item3 = new Item({
    name: "Eat food"
});

const defaultItems = [item1, item2, item3];

//list schema
const listSchema = {
  name: String,
  items: [itemsSchema]
};

// list model
const List = mongoose.model("List", listSchema);

// home page
app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems){
    if( foundItems.length === 0){
      // add new items to db
      Item.insertMany(defaultItems, function(err){
          if(err){
            console.log(err);
          }else{
            console.log("Successfully added");
          }
      });

      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });  
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if(listName === "Today"){
    newItem.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/"+ listName);
    })
  }    
});

//delete
app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(err){
        console.log(err);
      }else{
        res.redirect("/");
        console.log("Successfully deleted item");
      }
    });
  }else{
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }  
});

// dynamic routes
app.get("/:page", function(req,res){
  const customPage = _.capitalize(req.params.page); // always capitalize custom pages

  List.findOne({name: customPage}, function(err, foundItems){
    if(err){
      console.log(err);
    }else{
      if(!foundItems){
        const list = new List({
          name: customPage,
          items: defaultItems
        });

        list.save();
        res.redirect("" + customPage);

      }else{
        res.render("list", {listTitle: foundItems.name, newListItems: foundItems.items});
      }
    }     
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
