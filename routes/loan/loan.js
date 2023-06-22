const express = require('express');
const router = express.Router();

router.get('/loan', function(req, res, next) {
    if(req.session.user){
        res.render('main/loan/index')
    }else{
        res.redirect('login')
    }
});

module.exports = router;