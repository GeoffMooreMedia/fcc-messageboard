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
    //initialize the thread object
    const threadObj = {text:req.body.text,delete_password:req.body.delete_password,created_on:new Date(), bumped_on:new Date(),reported:false,replies:[]};
    //create a thread in the threads collection
    threadsCollection.insertOne(threadObj).then(thread=>{
      //update the threads array in the board record
      boardsCollection.updateOne(
        {name:req.params.board},
        //add the threads _id to the boards threads array
        {$push:{threads:thread.insertedId}},
        //create the board if it doesn't exist yet
        {upsert:true}
      ).then(()=>{
        res.redirect(`/b/${req.params.board}`);
      }).catch(err=>res.status(400).json({error:err}));
    }).catch(err=>res.status(400).json({error:err}));
  });
  app.route('/api/threads/:board').get((req,res)=>{
    //get the board from the database
    boardsCollection.findOne({name:req.params.board}).then(board=>{
      //find the threads for this board
      threadsCollection.find({_id:{$in:board.threads}}).then(threads=>{
        console.log(threads);
      }).catch(err=>res.status(400).json({error:err}));
    }).catch(err=>res.status(400).json({error:err}));
  })
    
  app.route('/api/replies/:board').post((req,res)=>{
    //find the thread in the database to make sure it exists
    threadsCollection.findOne({_id:req.body.thread_id}).then(thread=>{
      //create the reply object
      let replyObj = {text:req.body.text,delete_password:req.body.delete_password,thread_id:req.body.thread_id, created_on:new Date(),reported:false};
      //add the new reply record
      repliesCollection.insertOne(replyObj).then(reply=>{
        //add the _id to the replyObj
        replyObj._id = reply.insertedId;
        //remove the thread_id
        delete replyObj.thread_id;
        //add to the thread's replies array
        threadsCollection.updateOne({_id:req.body.thread_id},{$push:{replies:replyObj},$set:{bumped_on:replyObj.created_on}}).then(()=>res.redirect(`/b/${req.params.board}/${req.body.thread_id}`)).catch(err=>res.status(400).json({error:err}));
      }).catch(err=>res.status(400).json({error:err}));
    }).catch(err=>res.status(400).json({error:err}));
  });

};
