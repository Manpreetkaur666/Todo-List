const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
const date = require(__dirname+"/date.js");
require('dotenv').config({path: '.env'});


const app = express();
const DATABASE_URL = process.env.DATABASE_URL;
const day = date();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
mongoose.connect(DATABASE_URL);

/************************************** Items Schema *************************************/
// Creating a schema
const itemsSchema = new mongoose.Schema({
  name: String
})
// Creating a model of Schema
const Item = mongoose.model('Item',itemsSchema);
const item1 = new Item({
  name: "Welcome to todo List"
});
const item2 = new Item({
  name: "Press + button to add in the list"
});
const item3 = new Item({
  name: "Press delete to remove the items"
});

/************************************** Default values *************************************/

const defaultItems = [item1];


/************************************** Lists Schema *************************************/
//creat a list schema
const listsSchema = new mongoose.Schema({
  name: String,
  listItems: [itemsSchema]
})
const List = mongoose.model('List',listsSchema);

/************************************** GET for home route *************************************/
app.get('/', function(req,res){

Item.find({},function(error,foundItems){
  if(error){
    console.log("Problems findind the data.");
  }else{
    if (foundItems.length === 0) {

      Item.insertMany(defaultItems, function(error, docs) {
            if(error){
              console.log("Problem saving the data.")
            }else{
              console.log("Successfully added items into the collection fruits.")
            }
          });
          res.redirect('/');
      
    } else {
      console.log("there is alreading a starting data")
    }
    console.log(foundItems);
    res.render('list',{listTitle: "Today", newListItems: foundItems});

  }
});

});

/************************************** GET for /:paranName route *******************************/

app.get('/:paranName',function(req,res){

  const customListName = _.upperFirst(req.params.paranName);
  console.log(customListName);
  List.findOne({name:customListName},function(error,foundList){
    if(!error){
             if(!foundList){
                 //create a new List
                 const list = new List ({
                       name: customListName,
                       listItems: defaultItems
                  });
                list.save();
                res.redirect("/" + customListName);
              }
             else{
                  res.render('list',{listTitle: customListName, newListItems: foundList.listItems});
                
                 }
    }
    else{
        console.log(error);
      }
  });
});

/************************************** POST for home route *************************************/
//post function for both routes
app.post('/',function(request,response){

  const itemName = request.body.newItem;
  const titleName = request.body.list;

  const enteredItem = new Item({
        name: itemName
      });
   
    if (titleName === "Today") {
      enteredItem.save();
      response.redirect('/');
    } else {
         List.findOne({name: titleName}, function(error, foundList){
          foundList.listItems.push(enteredItem);
          foundList.save();
          response.redirect('/' + titleName);
         });      
    }
  });

/************************************** POST for DELETE route *************************************/
//post function for delete checked item.
app.post('/delete',function(req,res){

  const checkItemId = req.body.deleteItemCheck;
  const listName = req.body.listName;
  console.log(listName);

  if(listName === "Today"){
    Item.findByIdAndRemove(checkItemId,function(error){
      if(!error){
        res.redirect("/");
      }
      else{
        console.log("No documents matched the query. Deleted 0 documents.");
      }
    });
  }
  else{
    List.findOneAndUpdate({name: listName},{$pull: {listItems: {_id: checkItemId}}},function(error,foundlist){

      if(!error){
        res.redirect('/'+ listName);
        console.log("succes delete");
      }
      else{
        console.log("error occured!");
      }
    })
  }

   
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port,function(){
    console.log("The server is running on port: 3000");
});
