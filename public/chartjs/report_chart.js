var data1 = {
    labels: [],
    datasets: [
        {
            label: 'Total Account',
            yAxisID: 'y2',
            data: [],
            backgroundColor: [
                '#2980B940',
            ],
            borderColor: [
                '#2980B9',
            ],
            borderWidth: 2
        },
        {
            label: 'Income',
            yAxisID: 'y2',
            data: [],
            backgroundColor: [
                '#27AE6040',
            ],
            borderColor: [
                '#27AE60',
            ],
            borderWidth: 2
        },
        {
            label: 'Expense',
            yAxisID: 'y',
            data: [],
            backgroundColor: [
                '#D3540040',
            ],
            borderColor: [
                '#D35400',
            ],
            borderWidth: 2
        }
    ]
};

var options = {
    elements:{
        point : {
            radius : 2
        }
    },
    scales: {
        x: {
            title: {
                display: true,
                text: 'Date'
            }
        },
        y: {
            type: 'linear',

            position: 'left',
            stack: 'demo',
            stackWeight: 1,
        },
        y2: {
            type: 'linear',
            offset: true,
            position: 'left',
            stack: 'demo',
            stackWeight: 2,
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

    oReq.open('GET', url);
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