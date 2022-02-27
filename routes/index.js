const express = require('express');
const app = express()
const router = express.Router();
const crypto = require('crypto');
const mysql      = require('./config/mysql.js')();
const connection = mysql.init();
// const bodyParser = require('body-parser')
// app.use(bodyParser.json());
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
  if(req.session.user){
    let sql = `SELECT DATE_FORMAT(now(), "%m") as month, alligner,sum(cost) as total FROM finance.account
      where userid = ? and DATE_FORMAT(time, "%Y-%m") = ? group by alligner order by alligner;
      SELECT sum(if(income=1, cost, -cost))+0 as total from finance.account where userid = ?;
      SELECT sum(if(income=1, cost, -cost))+0 as total, sum(if(income=1, cost, 0)) as income, sum(if(income=0, cost, 0)) as outcome
      from finance.account where userid = ? and DATE_FORMAT(time, "%Y-%m") = ?;`
    connection.query(sql, [idnum,selector,idnum,idnum, selector], function (error, results, fields) {
      console.log(results)
      res.render('main/index', {controldate, yearmonth:selector, result1:results[0], result2:results[1], result3:results[2], name:req.session.user});
    });
  }else{
    res.redirect('login')
  }
});
router.post('/alpha', function(req, res, next){
  let responseData = {};
  let responseData1 = {};
  let idn = req.session.idn
  let indexdate = req.session.indexdate
  let sql = `SELECT DATE_FORMAT(time, "%M") as month, alligner,sum(cost) as total FROM finance.account 
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
  let selector
  if(req.session.yearmonth) {
    selector = req.session.yearmonth
  }
  else {
    if (!selector) {
      if (req.query.yearmonth) {
        selector = req.query.yearmonth
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
  req.session.indexdate = selector
  if(req.session.user){
    let sql = `SELECT id, title, cost, alligner, detail, subord, income, DATE_FORMAT(time, "%y-%m-%d") as date
        FROM finance.account where userid = ? and DATE_FORMAT(time, "%Y-%m") = ? order by time desc;
        SELECT sum(if(income='0', cost, '0')) as summary FROM finance.account where userid = ? and DATE_FORMAT(time, "%Y-%m") = ? order by time desc;`
    connection.query(sql, [idnum, selector,idnum, selector], function (error, results, fields) {
      res.render('main/finance/latestdata', {yearmonth:selector, result:results[0], summary:results[1][0], name:req.session.user});
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
router.post('/latestdatachart', function (req, res){
  let responseData = {};
  let responseData1 = {};
  let idn = req.session.idn
  let indexdate = req.session.indexdate
  let sql = `SELECT DATE_FORMAT(time, "%M") as month, alligner,sum(cost) as total FROM finance.account 
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

router.get('/detail', function(req, res, next) {
  if(req.session.user){
    let assort = req.query.id;
    let sql = 'SELECT * FROM finance.account  where id = ?'
    connection.query(sql, [assort] , function (error, results, fields) {
      res.render('main/finance/detail', {result:results, name:req.session.user});
    });
  }else{
    res.redirect('login')
  }
});
router.get('/removedata', function(req, res, next){
  if(req.session.user){
    let sql = 'DELETE FROM `finance`.`account` WHERE `id` = ?;'
    connection.query(sql, req.query.id , function (error, results, fields) {
      res.redirect('latestdata');
    });
  }else{
    res.redirect('login')
  }
});

router.get('/adddata', function(req, res, next) {
  if(req.session.user){
    res.render('main/finance/adddata',{setting:req.session.setting, name:req.session.user});
  }else{
    res.redirect('login')
  }
});
router.post('/adddata', function(req, res, next) {
  let rb = req.body;
  let income = 0;
  if(rb.income === "1"){
    income = 1;
  };
  if(req.session.user){
    let sql = "INSERT INTO finance.account(title, cost, detail, time, alligner, subord, userid, income)VALUES(?,?,?,?,?,?,?,?);"
    let params = [rb.title, rb.cost, rb.details, rb.date, rb.alligner, rb.subord, req.session.idn, income];
    console.log(params);
    connection.query(sql,params,function (err, results, fields) {
      if(err){
        console.log(err);
      }else{
        console.log(results.insertId);
      }
    });
    res.redirect('/latestdata');
  }else{
    res.redirect('login')
  }
});

router.get('/fixedexpense', function(req, res, next) {
  if(req.session.user){
    let sql = `SELECT * FROM finance.fixedexpense where userid = ?; 
        SELECT sum(payment_num * price) as totalbill, sum(payment_num * price/12) as divbill,
        sum(if(payment_num=12, price, 0)) as monthbill, sum(if(payment_num=1, price, 0)) as yearbill
        FROM finance.fixedexpense where userid = ?;`
    connection.query(sql, [req.session.idn, req.session.idn] , function (error, results, fields) {
      console.log(results);
      res.render('main/finance/fixedexpense', {result:results[0], sum:results[1], name:req.session.user});
    });
  }else{
    res.redirect('login')
  }
});
router.get('/fixedexpenseadd', function(req, res, next) {
  if(req.session.user){
    res.render('main/finance/fixedexpenseadd', {name:req.session.user});
  }else{
    res.redirect('login')
  }
});
router.post('/fixedexpenseadd', function(req, res, next) {
  let rb = req.body
  if(req.session.user){
    let sql = "INSERT INTO finance.fixedexpense(title, category, comment, payment_num, price, userid)VALUES(?,?,?,?,?,?);"
    let params = [rb.title, rb.category, rb.comment, rb.payment_num, rb.price, req.session.idn];
    console.log(params);
    connection.query(sql,params,function (err, results, fields) {
      if(err){
        console.log(err);
      }else{
        console.log(results.insertId);
      }
    });
    res.redirect('/fixedexpense');
  }else{
    res.redirect('login')
  }
});

router.get('/report', function (req, res,next){
  let idn = req.session.idn
  if(req.session.user) {
    let sql =`SELECT 
    sum(if(income='1' and date_format(time, '%Y-%m-%d') <= 
    date_format(DATE_SUB(now(), INTERVAL 1 YEAR),'%Y-%m-%d'), cost, -cost)) as yearbefore, 
    sum(if(income='1' and date_format(time, '%Y-%m-%d') <= date_format(now(),'%Y-%m-%d'), cost, -cost)) as todaytotal
    from account where userid = ?;`
    connection.query(sql, [idn], function(err, result){
      if(err) {
        throw err
      }else {
        console.log(result)
        res.render('main/finance/report', {result, name: req.session.user})
      }
    })
  }else{
    res.redirect('login')
  }
})
router.post('/reportchart', function (req, res){
  let responseData = {};
  let idn = req.session.idn
  let sql = `Select 
        (SELECT sum(if(income='1', cost, -cost)) from account where userid = ? and time <= date_val) as value,
        (SELECT sum(if(income='1', cost, 0)) from account where userid = ? and time <= date_val) as income,
        (SELECT sum(if(income='0', cost, 0)) from account where userid = ? and time <= date_val) as expense,
        date_format(date_val, '%Y-%m-%d') as date_val from date_all
        where date_val <= date(now()) group by date_val`
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

// to but list ( wish list )
router.get('/tobuylist', function(req, res, next) {
  if(req.session.user){
    let sql = 'SELECT id, title, cost, priorty, stat, detail, DATE_FORMAT(duedate, "%y-%m-%d") as duedate FROM finance.crave where userid = ? order by id;'+
        'SELECT sum(if(stat = "requested", cost, 0)) as req_total, sum(if(stat = "requested" and Priorty>2, cost, 0)) as high_total FROM finance.crave where userid = ? order by id;'
    let val = [req.session.idn, req.session.idn]
    connection.query(sql, val, function (err, results, fields) {
      if(err) throw err;
      else{
        res.render('main/issuetracker/todo', {result:results[0], summary:results[1][0], name:req.session.user});
      }
    });
  }else{
    res.redirect('login')
  }
});

router.get('/addwish', function (req, res,next){
  if(req.session.user){
    res.render('main/compara/underconstruction',{name:req.session.user});
  }else{
    res.redirect('login')
  }
})

// Login
router.get('/login', function(req, res, next) {
  res.render('main/login/login');
});
router.post('/login', function(req, res, next) {
  let rb = req.body
  let inpw = rb.pw
  const sql = 'SELECT * FROM nodedb.account where id = ?'
  const params = [rb.id];
  connection.query(sql,params,function (err, results, fields) {
    if(err){
      console.log(err);
    }else{
      crypto.pbkdf2(inpw, results[0].salt, 100000, 64, 'sha512', (err, key) => {
        if (key.toString('base64') === results[0].password, results[0].permission >= 1){
          req.session.idname = rb.id;
          req.session.idn = results[0].number;
          req.session.user = results[0].name;
          req.session.permission = results[0].permission;
          req.session.setting = JSON.parse(results[0].settings);
          req.session.save();
          res.redirect('/index');
        }
        else{
          console.log("Wrong PW", key.toString('base64'), results[0].password)
          res.redirect('/login')
        }
      });
    }
  });
});
router.get('/logout', function(req, res, next){
  if (req.session.user) {
    console.log('로그아웃');
    req.session.destroy(
        function (err) {
          if (err) {
            console.log('세션 삭제 에러');
            return;
          }
          res.redirect('/index');
        }
    );
  } else {
    console.log('Not Loged in');
    res.redirect('/Login');
  }
})

router.get('/account', function(req, res, next){
  if(req.session.user){
    res.render('main/login/account', {name:req.session.user, id:req.session.idname, permission:req.session.permission});
  }else{
    res.redirect('login')
  }
});
router.get('/register', function(req, res, next) {
  res.render('main/login/register');
});
router.post('/register', function(req, res, next){
  let rb = req.body
  let inpw = rb.pw
  crypto.randomBytes(32, function(err, buf) {
    crypto.pbkdf2(inpw, buf.toString('base64'), 100000, 64, 'sha512', (err, key) => {
      const sql = 'INSERT into nodedb.account(id, password, name, salt)VALUES(?, ?, ?, ?)'
      const params = [rb.id, key.toString('base64'), rb.name, buf.toString('base64')];
      connection.query(sql, params, function(err, result, next){
        if(err){
          console.log(err);
        }
        else{
          res.redirect('/index')
        }
      })
    });
  });
});

router.get('/settings', function(req, res, next){
  if(req.session.user){
    let sql = "SELECT settings FROM nodedb.account where number = ?"
    connection.query(sql, [req.session.idn], function (error, results, fields) {
      let result = JSON.parse(results[0].settings)
      req.session.setting = result
      res.render('main/login/setting', {result, name:req.session.user });
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