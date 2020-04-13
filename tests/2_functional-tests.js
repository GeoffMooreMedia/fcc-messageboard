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

chai.use(chaiHttp);

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {
    
     suite('POST', function() {
      test('New Thread',done=>{
        chai.request(server)
        .post('/api/threads/test')
        .send({text: `Test thread${new Date().toString()}`,delete_password:'testPassword'})
        .end(function(err, res){
            assert.isNull(err);
            //check for redirect
            expect(res).to.redirect;

          done();
        });
      })
    }); 
    
    suite('GET', function() {
      
    });
    
    suite('DELETE', function() {
      
    });
    
    suite('PUT', function() {
      
    });
    

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      
    });
    
    suite('GET', function() {
      
    });
    
    suite('PUT', function() {
      
    });
    
    suite('DELETE', function() {
      
    });
    
  });

});
