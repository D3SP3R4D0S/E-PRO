var data1 = {
    labels: [],
    datasets: [
        {
            label: 'Total Account',
            data: [],
            backgroundColor: [
                'rgba(0,255,6,0.2)',
            ],
            borderColor: [
                'rgb(9,238,0)',
            ],
            borderWidth: 2
        },
        {
            label: 'Income',
            data: [],
            backgroundColor: [
                'rgba(0,18,154,0.2)',
            ],
            borderColor: [
                'rgb(0,3,160)',
            ],
            borderWidth: 2
        },
        {
            label: 'Expense',
            data: [],
            backgroundColor: [
                'rgb(168,0,0)',
            ],
            borderColor: [
                'rgb(158,0,0)',
            ],
            borderWidth: 2
        }
    ]
};

var options = {
    elements:{
        point : {
            radius : 0
        }
    }
};

var ctx1 = document.getElementById("reportchart").getContext('2d');

var reportchart = new Chart(ctx1, {
    type: 'line',
    data: data1,
    options: options
});

sendAjax('/reportchart');

function sendAjax(url) {
    var oReq = new XMLHttpRequest();

    oReq.open('POST', url);
    oReq.setRequestHeader('Content-Type', "application/json") // json 형태로 보낸다
    oReq.send();

    oReq.addEventListener('load', function() {
        let result = JSON.parse(oReq.responseText)[0];
        data1.labels = result.date

        data1.datasets[0].data = result.value;
        data1.datasets[1].data = result.income;
        data1.datasets[2].data = result.expense;
        reportchart.update();
    })
}