const express = require('express');
const router = express.Router();
const mysql      = require('./config/mysql.js')();
const connection = mysql.init();
const request = require('request');
const knex = require('./config/knex.js');
connection.connect(function(err){
  if(err) {                                     // or restarting (takes a while sometimes).
    console.log('error when connecting to db:', err);
    setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
  }
});
connection.close

// main page( index - if not logged in go to log in page directly)
router.get('/', function(req, res, next) {
  res.redirect('/index');
});

router.get('/index', function(req, res, next) {
  let idnum = req.session.idn
  let selector = req.query.yearmonth // 연-월 (YYYY-MM) 형식
  if(!selector){
    let today = new Date()
    let month = today.getMonth() + 1 // JS 에서는 월이 기본적으로 0부터 시작
    if(month < 10){ // 10이하일 경우 앞자리수가 0 으로 mysql 과 호환되지않음
      month ='0' + month
    }
    selector = today.getFullYear() + "-" + month
  }
  req.session.indexdate = selector
  let controldate = new Date(selector.split('-')[0], parseInt(selector.split('-')[1])-1);
  // console.log(req.session.user);
  if(req.session.user){
    let sql = `SELECT DATE_FORMAT(now(), "%m") as month, alligner,sum(cost) as total FROM finance.account
      where userid = ? and DATE_FORMAT(time, "%Y-%m") = ? group by alligner order by alligner;
      SELECT sum(if(income=1, cost, -cost))+0 as total from finance.account where userid = ?;
      SELECT sum(if(income=1, cost, -cost))+0 as total, sum(if(income=1, cost, 0)) as income, sum(if(income=0, cost, 0)) as outcome
      from finance.account where userid = ? and DATE_FORMAT(time, "%Y-%m") = ?;`
    connection.query(sql, [idnum,selector,idnum,idnum, selector], function (error, results, fields) {
      // console.log(results)
      res.render('main/index', {controldate, yearmonth:selector, result1:results[0], result2:results[1], result3:results[2], name:req.session.user});
    });
  }else{
    res.redirect('login')
  }
});
router.get('/alpha', function(req, res, next){
  let responseData = {};
  let responseData1 = {};
  let idn = req.session.idn
  let indexdate = req.session.indexdate
  let sql = `SELECT ANY_VALUE(DATE_FORMAT(time, "%M")) as month, alligner, sum(cost) as total FROM finance.account 
    WHERE userid = ? and DATE_FORMAT(time, "%Y-%m") = ? and income = 0 
    group by alligner order by alligner; 
    SELECT * from (select date_format(DA.date_val, "%Y-%m-%d") paiddate,
    SUM(if(AC.userid = ? and AC.income = 0 and AC.cost, AC.cost, 0)) as dailyuse 
    FROM finance.date_all DA LEFT JOIN finance.account AC ON (AC.time = DA.date_val) GROUP BY paiddate) as a
    WHERE DATE_FORMAT(paiddate, "%Y-%m") = ?;`
  connection.query(sql,[idn, indexdate, idn, indexdate], function(err,rows){
    responseData.title = [];
    responseData.score = [];
    responseData1.title = [];
    responseData1.score = [];
    if(err) throw err;
    if(rows[0]){
      responseData.result = "ok";
      rows[0].forEach(function(val){
        responseData.title.push(val.alligner);
        responseData.score.push(val.total);
      })
      rows[1].forEach(function(val){
        responseData1.title.push(val.paiddate);
        responseData1.score.push(val.dailyuse);
      })
    }
    else{
      responseData.result = "none";
      responseData.score = "";
      responseData1.result = "none";
      responseData1.score = "";
    }
    res.json([responseData, responseData1]);
  });
});
router.get('/indexpmonth', function (req,res){
  let indexdate = req.session.indexdate.split('-');
  let newdate = new Date(indexdate[0], parseInt(indexdate[1])-1);
  newdate.setMonth(newdate.getMonth() - 1);
  let month = newdate.getMonth() + 1
  if(month<10){
    month = '0' + month;
  }
  let selector = newdate.getFullYear() + '-' + month
  if(req.session.user){
    res.redirect('index?yearmonth=' + selector);
  }else{
    res.redirect('login')
  }
});
router.get('/indexnmonth', function (req,res){
  let indexdate = req.session.indexdate.split('-');
  let newdate = new Date(indexdate[0], parseInt(indexdate[1])-1);
  newdate.setMonth(newdate.getMonth() + 1);
  let month = newdate.getMonth() + 1
  if(month<10){
    month = '0' + month;
  }
  let selector = newdate.getFullYear() + '-' + month
  if(req.session.user){
    res.redirect('index?yearmonth=' + selector);
  }else{
    res.redirect('login')
  }
});

// From here is latest data
router.get('/latestdata', function(req, res, next) {
  let idnum = req.session.idn
  let selector = ''
  if(req.query.yearmonth) {
    selector = req.query.yearmonth
  }
  else {
    if (selector === '') {
      if (req.session.yearmonth) {
        selector = req.session.yearmonth
      } else {
        let today = new Date()
        let month = today.getMonth() + 1 // JS 에서는 월이 기본적으로 0부터 시작
        if (month < 10) { // 10이하일 경우 앞자리수가 0 으로 mysql 과 호환되지않음
          month = '0' + month
        }
        selector = today.getFullYear() + "-" + month
      }
    }
  }
  req.session.yearmonth = selector
  req.session.indexdate = selector
  if(req.session.user){
    let sql = `SELECT id, title, cost, alligner, detail, subord, income, DATE_FORMAT(time, "%y-%m-%d") as date
        FROM finance.account where userid = ? and DATE_FORMAT(time, "%Y-%m") = ? order by time desc;
        SELECT sum(if(income='0', cost, '0')) as summary FROM finance.account where userid = ? and DATE_FORMAT(time, "%Y-%m") = ? order by time desc;`
    connection.query(sql, [idnum, selector,idnum, selector], function (error, results, fields) {
      res.render('main/finance/latestdata', {csrfToken:req.csrfToken(), setting:req.session.setting, yearmonth:selector, result:results[0], summary:results[1][0], name:req.session.user});
    });
  }else{
    res.redirect('login')
  }
});
router.get('/latestdatapmonth', function (req,res){
  let indexdate = req.session.indexdate.split('-');
  let newdate = new Date(indexdate[0], parseInt(indexdate[1])-1);
  newdate.setMonth(newdate.getMonth() - 1);
  let month = newdate.getMonth() + 1
  if(month<10){
    month = '0' + month;
  }
  let selector = newdate.getFullYear() + '-' + month
  if(req.session.user){
    res.redirect('latestdata?yearmonth=' + selector);
  }else{
    res.redirect('login')
  }
});
router.get('/latestdatanmonth', function (req,res){
  let indexdate = req.session.indexdate.split('-');
  let newdate = new Date(indexdate[0], parseInt(indexdate[1])-1);
  newdate.setMonth(newdate.getMonth() + 1);
  let month = newdate.getMonth() + 1
  if(month<10){
    month = '0' + month;
  }
  let selector = newdate.getFullYear() + '-' + month
  if(req.session.user){
    res.redirect('latestdata?yearmonth=' + selector);
  }else{
    res.redirect('login')
  }
});
router.get('/latestdatachart', function (req, res){
  let responseData = {};
  let responseData1 = {};
  let idn = req.session.idn
  let indexdate = req.session.indexdate
  let sql = `SELECT ANY_VALUE(DATE_FORMAT(time, "%M")) as month, alligner,sum(cost) as total FROM finance.account 
    where userid = ? and DATE_FORMAT(time, "%Y-%m") = ? and income = 0 group by alligner order by alligner; 
    select * from (select date_format(DA.date_val, "%Y-%m-%d") paiddate,
     sum(if(AC.userid = ? and AC.income = 0 and AC.cost, AC.cost, 0)) as dailyuse
      from finance.date_all 
      DA left join finance.account AC on (AC.time = DA.date_val) group by paiddate) as a
    where DATE_FORMAT(paiddate, "%Y-%m") = ?;`
  connection.query(sql,[idn, indexdate, idn, indexdate], function(err,rows){
    responseData.title = [];
    responseData.score = [];
    responseData1.title = [];
    responseData1.score = [];
    if(err) throw err;
    if(rows[0]){
      responseData.result = "ok";
      rows[0].forEach(function(val){
        responseData.title.push(val.alligner);
        responseData.score.push(val.total);
      })
      rows[1].forEach(function(val){
        responseData1.title.push(val.paiddate);
        responseData1.score.push(val.dailyuse);
      })
    }
    else{
      responseData.result = "none";
      responseData.score = "";
      responseData1.result = "none";
      responseData1.score = "";
    }
    res.json([responseData, responseData1]);
  });
})
// detail for object ( knex applied)
router.route('/detail')
    .get(function(req, res, next) {
        if(req.session.user){
          knex.select('*')
              .from('account')
              .where('id', req.query.id)
              .then((results)=>{
                res.render('main/finance/detail', {csrfToken:req.csrfToken(), id:req.query.id, result:results, name:req.session.user});
              })
              .catch((err)=>{
                console.log(err)
              })
        }else{
          res.redirect('login')
        }
    })
    .post(function(req, res, next){
        if(req.session.user){
            knex.update({
                    title:req.body.title,
                    cost:req.body.cost.replace(',', ''),
                    detail:req.body.detail,
                    time:req.body.time,
                    alligner:req.body.alligner,
                    subord:req.body.subord
                })
                .from('account')
                .where('id', req.body.id)
                .then((results)=>{
                  console.log(results)
                  res.redirect('/detail?id=' + req.body.id)
                })
                .catch((err)=>{
                  console.log(err)
                })
        }else{
          res.redirect('login')
        }
    })

// remove expenditure data ( knex )
router.get('/removedata', function(req, res, next){
  if(req.session.user){
    knex.delete()
        .from('account')
        .where('id', req.query.id)
        .then((results)=>{
          console.log(results)
          res.redirect('latestdata');
        })
        .catch((err)=>{
          console.log(err)
        })
  }else{
    res.redirect('login')
  }
});
// add data form
router.post('/adddata', function(req, res, next) {
  if(req.session.user){
    let rb = req.body;
    let cost = rb.cost.replace(/,/g, '');
    let income = 0;
    if(rb.income === "1"){
      income = 1;
    };
    knex('account').insert({
      title:rb.title,
      cost:cost,
      detail:rb.details,
      time:rb.date,
      alligner:rb.alligner,
      subord:rb.subord,
      userid:req.session.idn,
      income:income
    })
        .then((results)=>{
          console.log(results);
          res.redirect('/latestdata');
        })
        .catch((err)=>{
          console.log(err)
        })
  }else{
    res.redirect('login')
  }
});

//knex raw
router.get('/report', function (req, res,next){
  let idn = req.session.idn
  if(req.session.user) {
    let sql = `SELECT sum(if(income='1', cost, -cost)) as yearbefore,
        sum(if(income='1', cost, 0)) as income,
        sum(if(income='0', cost, 0)) as spend 
        from account where userid = ?  and time >= DATE_SUB(now(), INTERVAL 1 YEAR);
        SELECT date_format(time, '%Y-%m') as month, sum(if(income='1', cost, -cost)) as value,
        sum(if(income='1', cost, 0)) as income, sum(if(income='0', cost, 0)) as spend 
        from finance.account where userid = ? and time >= DATE_SUB(now(), INTERVAL 1 YEAR)
        group by month order by month desc;`
    knex.raw(sql, [idn, idn])
        .then((results) => {
          let result = results[0][0]
          let table  = results[0][1]
          res.render('main/report/report', {result, table, name: req.session.user})
        })
        .catch((err) => {
          console.log(err)
        })
  }else{
    res.redirect('login')
  }
})
router.get('/reportchart', function (req, res){
  let responseData = {};
  let idn = req.session.idn
  let sql = `Select 
        (SELECT sum(if(income='1', cost, -cost)) from account where userid = ? and time <= date_val) as value,
        (SELECT sum(if(income='1', cost, 0)) from account where userid = ? and time <= date_val) as income,
        (SELECT sum(if(income='0', cost, 0)) from account where userid = ? and time <= date_val) as expense,
        date_format(date_val, '%Y-%m-%d') as date_val from date_all
        where date_val <= date(now()) and date_val >= date_add(now(), interval -1 year) group by date_val`
  connection.query(sql,[idn,idn,idn] , function(err,result){
    responseData.value = [];
    responseData.income = [];
    responseData.expense = [];
    responseData.date = [];
    if(err) throw err;
    if(result){
      responseData.result = "ok";
      result.forEach(function(val){
        responseData.value.push(val.value);
        responseData.income.push(val.income);
        responseData.expense.push(val.expense);
        responseData.date.push(val.date_val);
      })
    }
    else{
      responseData.value = "none";
      responseData.income = "none";
      responseData.expense = "none";
      responseData.date = "";
    }
    res.json([responseData]);
  });
})

//investment
router.get('/investment', function(req, res, next){
  if(req.session.user){
    let sql = 'SELECT * FROM investment WHERE userid = ?;'
    let val = [req.session.idn]
    connection.query(sql, val, function (err, results) {
      if(err){
        console.log(err);
      } else{
        let url = 'https://quotation-api-cdn.dunamu.com/v1/forex/recent?codes=FRX.KRWUSD'
        request({url: url,method: "GET"}, function(err,response, body){
          res.render('main/investment/investmgmt', {csrfToken:req.csrfToken(),currency:JSON.parse(body)[0], result:results, name: req.session.user});
        })
      }
    })
  }else{
    res.redirect('login')
  }
});
router.get('/investmentadd', function(req, res){
  if(req.session.user){
    res.render('main/investment/investmentadd', {csrfToken:req.csrfToken(),name:req.session.user});
  }else{
    res.redirect('login')
  }
})
router.post('/investmentadd', function(req, res){
  if(req.session.user){
    let rb = req.body
    let dividendo = rb.dividendo
    let dividend = rb.dividend
    let sql = "INSERT INTO investment (`userid`, `item`, `buying`, `currency`, `count`, `dividendo`, `dividend`, `boughtdate`) VALUES (?,?,?,?,?,?,?,?);"
    let params = [req.session.idn, rb.item, rb.buying, rb.currency, rb.count, dividendo, dividend, rb.boughtdate];
    connection.query(sql, params, function (err, results) {
      if(err) throw err;
      else{
        res.redirect('investment');
      }
    })
  }else{
    res.redirect('login')
  }
});
router.post('/investmentedit', function (req, res){
  if(req.session.user){
    req.session.investid = req.body.id
    let rb = req.body
    res.render('main/investment/investmentedit', {rb,csrfToken:req.csrfToken(), name:req.session.user});
  }else{
    res.redirect('login')
  }
});
router.post('/investmentapply', function (req, res, next){
  if(req.session.user){
    let rb = req.body
    let sql = "UPDATE investment SET  `item` = ?, `buying` = ?, `currency` = ?, `count` = ?, `dividendo` = ?, `dividend` = ?, `boughtdate` = ?  WHERE (`id` = ?);"
    let params = [rb.item, rb.buying, rb.currency, rb.count, rb.dividendo, rb.dividend, rb.boughtdate, req.session.investid];
    connection.query(sql,params,function (err) { if(err) console.log(err);});
    res.redirect('/investment');
  }else{
    res.redirect('login')
  }
});

//Vehicle management
router.get('/vehiclemanage', function(req, res, next){
  if(req.session.user){
    let sql = `SELECT * FROM vehicle WHERE userid = ?;
                SELECT * FROM vexpendables WHERE userid = ?`
    let val = [req.session.idn]
    connection.query(sql, [val, val], function (err, results) {
      if(err) throw err;
      else if(results[0].length > 0) {
        console.log(results)
        res.render('main/vehicle/vehiclemgmt', {csrfToken:req.csrfToken(), result:results[0][0], data3:results[1], name: req.session.user});
      }else{
        res.redirect('addvehicle')
      }
    })
  }else{
    res.redirect('login')
  }
});
router.get('/addvehicle', function(req, res){
  if(req.session.user){
    let sql = 'SELECT * FROM vehicle WHERE userid = ?;'
    let val = [req.session.idn]
    connection.query(sql, val, function (err, results) {
      if(err) throw err;
      else if(results.length === 0) {
        res.render('main/vehicle/addvehicle', {csrfToken:req.csrfToken(), name: req.session.user});
      }else{
        res.redirect('vehiclemanage')
      }
    })
  }else{
    res.redirect('login')
  }
});
router.post('/addvehicle', function(req, res){
  if(req.session.user){
    let rb = req.body
    let sql = "INSERT INTO vehicle (userid, title, number, mileage, detail, produced) VALUES (?, ?, ?, ?, ?, ?);"
    let params = [req.session.idn, rb.title, rb.number, rb.mileage.replace(',', ''), rb.detail, rb.produced];
    connection.query(sql, params, function (err, results) {
      if(err) throw err;
      else{
        res.redirect('vehiclemanage');
      }
    })
  }else{
    res.redirect('login')
  }
});
router.post('/veadd', function(req, res){
  if(req.session.user){
    let rb = req.body
    let sql = "INSERT INTO vexpendables (userid, title, lifecycle, lastdate, cost, comment) VALUES (?, ?, ?, ?, ?, ?);"
    let params = [req.session.idn, rb.title, rb.lifecycle, rb.lastdate, rb.cost, rb.comment];
    connection.query(sql, params, function (err, results) {
      if(err) throw err;
      else{
        res.redirect('vehiclemanage');
      }
    })
  }else{
    res.redirect('login')
  }
});

router.get('/settings', function(req, res, next){
  if(req.session.user){
    let sql = "SELECT settings FROM nodedb.account where number = ?"
    connection.query(sql, [req.session.idn], function (error, results, fields) {
      let result = JSON.parse(results[0].settings)
      req.session.setting = result
      res.render('main/login/setting', {result, csrfToken:req.csrfToken(), name:req.session.user });
    });
  }else{
    res.redirect('login')
  }
});
router.post('/addsettingmethod', function(req, res, next){
  if(req.session.user){
    let settings = req.session.setting
    let value = req.body.value
    settings.method.push(value)
    let sql = `UPDATE nodedb.account SET settings = ? WHERE (number = ?);`
    connection.query(sql, [JSON.stringify(settings), req.session.idn], function (error, results, fields) {
      if(error){
        console.log(error)
      }
    });
    res.redirect('/settings');
  }else{
    res.redirect('login')
  }
});
router.post('/addsettingpaidfor', function(req, res, next){
  if(req.session.user){
    let settings = req.session.setting
    let value = req.body.value
    settings.paidfor.push(value)
    let sql = `UPDATE nodedb.account SET settings = ? WHERE (number = ?);`
    connection.query(sql, [JSON.stringify(settings), req.session.idn], function (error, results, fields) {
      if(error){
        console.log(error)
      }
    });
    res.redirect('/settings');
  }else{
    res.redirect('login')
  }
});
router.post('/addsettingalligner', function(req, res, next){
  if(req.session.user){
    let settings = req.session.setting
    let value = req.body.value
    settings.alligner.push(value)
    let sql = `UPDATE nodedb.account SET settings = ? WHERE (number = ?);`
    connection.query(sql, [JSON.stringify(settings), req.session.idn], function (error, results, fields) {
      if(error){
        console.log(error)
      }
    });
    res.redirect('/settings');
  }else{
    res.redirect('login')
  }
});
router.post('/removesetting', function(req, res, next){
  if(req.session.user){
    let settings = req.session.setting
    let value = req.body.value
    let option = req.body.option
    if(option === "method") {
      for(let i = 0; i < settings.method.length; i++) {
        if(settings.method[i] === value){
          settings.method.splice(i, 1);
          i--;
        }
      }
    } else if(option === "paidfor") {
      for(let i = 0; i < settings.paidfor.length; i++) {
        if (settings.paidfor[i] === value) {
          settings.paidfor.splice(i, 1);
          i--;
        }
      }
    } else if(option === "alligner") {
        for(let i = 0; i < settings.alligner.length; i++) {
          if (settings.alligner[i] === value) {
            settings.alligner.splice(i, 1);
            i--;
          }
        }
    }
    let sql = `UPDATE nodedb.account SET settings = ? WHERE (number = ?);`
    connection.query(sql, [JSON.stringify(settings), req.session.idn], function (error, results, fields) {
      if(error){
        console.log(error)
      }
    });
    res.redirect('settings');
  }else{
    res.redirect('login')
  }
});
// Others
router.get('/sitemap', function(req, res, next) {
  if(req.session.user){

    res.render('main/sitemap', {name:req.session.user });
  }else{
    res.redirect('login')
  }
});

module.exports = router;