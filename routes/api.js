/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;

module.exports = function (app) {
  let boardsCollection;
  let repliesCollection;
  let threadsCollection;
  
  //initialize the database connection
  const client = new MongoClient(MONGODB_CONNECTION_STRING, { useNewUrlParser: true });
  client.connect(err => {
    if(err) throw err;
    boardsCollection = client.db("messageboard").collection("boards");
    repliesCollection = client.db("messageboard").collection("replies");
    threadsCollection = client.db("messageboard").collection("threads");
    console.log('DB Connected');
  });

  
  app.route('/api/threads/:board').post((req,res)=>{
    //find the board in the database
    boardsCollection.findOne({name:req.params.board}).then(board=>{
      //insert a new thread into the threads collection
      threadsCollection.insert({text,delete_password,created_on:new Date(), bumped_on:new Date(),reported:false,replies:[]})
      .catch(err=>res.status(400).json({error:err}))
    }).catch(err=>res.status(400).json({error:err}));
  });
    
  app.route('/api/replies/:board');

};
