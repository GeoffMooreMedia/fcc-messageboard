/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');
const expect = chai.expect;
let testThread1;
let testThread2;//need 2 because we need to delete one and we cant change order

chai.use(chaiHttp);

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {
    
     suite('POST', function() {
      test('New Thread',done=>{
        chai.request(server)
        .post('/api/threads/test')
        .send({text: `Test thread ${new Date().toString()}`,delete_password:'testPassword'})
        .end(function(err, res){
            assert.isNull(err);
            //check for redirect
            expect(res).to.redirect;

          done();
        });
      })
    }); 
    
    suite('GET', function() {
      test('Get threads',done=>{
        chai.request(server).get('/api/threads/test').send().end((err,res)=>{
          
          assert.isNull(err);
          //response should be OK
          assert.isOk(res);
          //store the threads for easy access
          const threads = res.body;
          //threads should be an array
          assert.isArray(threads);
          //make sure there are only ten records returned 
          assert.isAtMost(threads.length,10);
          
          //check the replies of each thread
          threads.forEach(thread=>{
            //check for the delete_password and reported keys
            assert.doesNotHaveAnyKeys(thread,['delete_password','reported']);
            //should be no more than three
            assert.isAtMost(thread.replies.length,3);
            //check each reply
            thread.replies.forEach(reply=>{
              //check for delete_password and reported keys
              assert.doesNotHaveAnyKeys(reply,['delete_password','reported']);
            })
          })
          //store the last thread for later use
          testThread1 = threads[1];
          testThread2 = threads[0];
          done();
        })
        
      })
    });
    
    suite('DELETE', function() {
      test('Try to delete with a bad password',done=>{
        chai.request(server).delete('/api/threads/test').send({thread_id:testThread1._id,delete_password:'badPassword'}).end((err,res)=>{
          //should throw a 403, unauthorized, status
          assert.equal(res.status,403);
          //should show incorrect password message
          assert.equal(res.text,'incorrect password');
          done();
        })
        
      })
      test('Delete a thread',done=>{
        
        chai.request(server).delete('/api/threads/test').send({thread_id:testThread1._id,delete_password:'testPassword'}).end((err,res)=>{
          //should be no error
          assert.isNull(err);
          //response should be OK
          assert.isOk(res);
          //should report success
          assert.equal(res.text,'success');
          done();
        })
        
      })
      
    });
    
    suite('PUT', function() {
      test('Report a thread',done=>{
        chai.request(server).put('/api/threads/test').send({thread_id:testThread2._id}).end((err,res)=>{
          //should be no error
          assert.isNull(err);
          //response should be OK
          assert.isOk(res);
          //should report success
          assert.equal(res.text,'success');
          done();
        })
      })
    });
    

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      test('Post a new reply to a thread',done=>{
        chai.request(server).post('/api/replies/test').send({text:`Test reply ${new Date().toString()}`,thread_id:testThread2._id,delete_password:'testPassword'}).end((err,res)=>{
          //should be no error
          assert.isNull(err);
          //should redirect
          expect(res).to.redirect;
          done();
        })
      })
    });
    
    suite('GET', function() {
      
    });
    
    suite('PUT', function() {
      
    });
    
    suite('DELETE', function() {
      
    });
    
  });

});
