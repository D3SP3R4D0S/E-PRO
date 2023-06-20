const express = require('express');
const router = express.Router();
const knex = require('./config/knex.js');

router.get('/loan', function(req, res, next) {
    if(req.session.user){
        res.render('loan/index')
    }else{
        res.redirect('login')
    }
});

module.exports = router;