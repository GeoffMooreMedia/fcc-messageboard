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

  /* Get all threads for a board */
  app.route('/api/threads/:board').get((req,res)=>{
    //get the board from the database
    boardsCollection.findOne({name:req.params.board}).then(board=>{
      
      //find the threads for this board
      threadsCollection.find({_id:{$in:board.threads}}).project({delete_password:0,reported:0}).sort({bumped_on:-1}).limit(10).toArray((err,threads)=>{
        //if there was an error
        if(err)res.status(400).json({error:err});
        else{
          /* Process the replies */
          //loop through the threads
          threads.forEach(thread=>{
            //sort the replies by date created
            thread.replies.sort((a,b)=> b.created_on-a.created_on);
            //we only need the first three
            thread.replies = thread.replies.slice(0,3);
            //get rid of the delete_password and reported fields
            thread.replies.forEach(reply=>{
              delete reply.delete_password;
              delete reply.reported;
            })
          })

          //return the threads
          res.status(200).json(threads);
        }
      })
    }).catch(err=>res.status(400).json({error:err}));
  })

  /* Delete a thread by thread_id */
  app.route('/api/threads/:board').delete((req,res)=>{
    //delete the thread document if password matches
    threadsCollection.findOne({_id:new ObjectId(req.body.thread_id), delete_password:req.body.delete_password}).then(thread=>{
      //if there was no thread found
      if(!thread){
        res.status(403).send('incorrect password');
      }
      else{
        //array of promises to delete thread, replies, and board reference
        const promiseArr = [
          //delete the replies
          new Promise((resolve, reject)=>{
            //get the _ids of each reply to be deleted
            const replyIds = thread.replies.map(reply=>reply._id);
            //delete each reply from the database
            repliesCollection.deleteMany({_id:{$in:replyIds}}).then(()=>{
              resolve();
            }).catch(err=>reject(err));
          }),
          //update the board document
          new Promise((resolve,reject)=>{
            //remove the thread from the board document
            boardsCollection.updateOne({name:req.params.board},{$pull:{threads:req.body.thread_id}}).then(()=>resolve()).catch(err=>reject(err));
          }),
          //remove the thread document
          new Promise((resolve,reject)=>{
            threadsCollection.deleteOne({_id:req.body.thread_id}).then(()=>resolve()).catch(err=>reject(err));
          })
        ]
        //when everything has been deleted
        Promise.all(promiseArr).then(()=>{
          res.status(200).send('success');
        })
      }
      
    }).catch(err=>res.status(400).json({error:err}));
  })

  /* Report a thread */
  app.route('/api/threads/:board').put((req,res)=>{
    //update the thread
    threadsCollection.updateOne({_id:new ObjectId(req.body.thread_id)},{$set:{reported:true}}).then(()=>res.status(200).send('success')).catch(err=>res.status(400).json({error:err}));
  })
  
  /* post a new reply to a thread */
  app.route('/api/replies/:board').post((req,res)=>{
    //find the thread in the database to make sure it exists
    threadsCollection.findOne({_id:new ObjectId(req.body.thread_id)}).then(thread=>{
      //create the reply object
      let replyObj = {text:req.body.text,delete_password:req.body.delete_password,thread_id:thread._id, created_on:new Date(),reported:false};
      //add the new reply record
      repliesCollection.insertOne(replyObj).then(reply=>{
        //add the _id to the replyObj
        replyObj._id = reply.insertedId;
        //remove the thread_id
        delete replyObj.thread_id;
        //add to the thread's replies array
        threadsCollection.updateOne({_id:new ObjectId(req.body.thread_id)},{$push:{replies:replyObj},$set:{bumped_on:replyObj.created_on}}).then(()=>res.redirect(`/b/${req.params.board}/${req.body.thread_id}`)).catch(err=>res.status(400).json({error:err}));
      }).catch(err=>res.status(400).json({error:err}));
    }).catch(err=>res.status(400).json({error:err}));
  });

  /* Get a thread and all replies */
  app.route('/api/replies/:board').get((req,res)=>{
    //fetch the thread from the database
    threadsCollection.findOne({_id:new ObjectId(req.query.thread_id)},{projection:{delete_password:0, reported:0,'replies.delete_password':0, 'replies.reported':0}}).then(thread=>{
      res.status(200).json(thread);
    }).catch(err=>res.status(400).json({error:err}));
  })

  /* Report a reply */
  app.route('/api/replies/:board').put((req,res)=>{
    
    //report the reply in the replies collection
    repliesCollection.updateOne({_id:new ObjectId(req.body.reply_id)},{$set:{reported:true}}).then(()=>{
      //get the thread document
      threadsCollection.findOne({_id:new ObjectId(req.body.thread_id)}).then(thread=>{
        //find the index of the reply in the replies array
        const replyIndex = thread.replies.findIndex(reply=>reply._id==req.body.reply_id);
        //update the thread replies
        thread.replies[replyIndex].reported = true;
        //save the updated document to the database
        threadsCollection.updateOne({_id:new ObjectId(req.body.thread_id)},{$set:{replies:thread.replies}}).then(()=>res.status(200).send('success')).catch(err=>res.status(400).json({error:err}));
      }).catch(err=>res.status(400).json({error:err}));

    }).catch(err=>res.status(400).json({error:err}))
  })

  /* Delete a reply */
  app.route('/api/replies/:board').delete((req,res)=>{
    //delete the reply in the database
    repliesCollection.findOne({_id:new ObjectId(req.body.reply_id),delete_password:req.body.delete_password}).then(deleted=>{
      //if nothing deleted
      if(!deleted){
        res.status(403).send('incorrect password');
      }
      else{
        //get the thread document
        threadsCollection.findOne({_id:new ObjectId(req.body.thread_id)}).then(thread=>{
          //find the index of the reply in the replies array
          const replyIndex = thread.replies.findIndex(reply=>reply._id==req.body.reply_id);
          //update the reply text
          thread.replies[replyIndex].text = '[deleted]';
          //update the thread in the database
          threadsCollection.updateOne({_id:new ObjectId(req.body.thread_id)},{$set:{replies:thread.replies}}).then(()=>res.status(200).send('success')).catch(err=>res.status(400).json({error:err}));
        }).catch(err=>res.status(400).json({error:err}));
      }
    }).catch(err=>res.status(400).json({error:err}));
  })
};
