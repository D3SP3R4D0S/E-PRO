var data1 = {
    labels: [],
    datasets: [
        {
            label: 'Watst of money',
            data: [],
            backgroundColor: [
                'rgba(255, 99, 132)',
                'rgba(54, 162, 235)',
                'rgba(255, 206, 86)',
                'rgba(75, 192, 192)',
                'rgba(153, 102, 255)',
                'rgba(255, 159, 64)'
            ],
            hoverOffset: 4
        }
    ]
};
var data2 = {
    labels: [
    ],
    datasets: [
        {
            label: 'daily use',
            data: [
            ],
            backgroundColor: [
                'rgba(30, 100, 120)'
            ]
        }
    ]
};

var options = {
    aspectRatio : 2,
    plugins : {
        legend : {
            position : "right"
        }
    }
};
var option2 = {
    aspectRatio : 2,
    plugins:{
        legend:{
            display : false
        }
    }
};

var ctx1 = document.getElementById("myChart").getContext('2d');
var ctx2 = document.getElementById("myChart2").getContext('2d');
var myBarChart = new Chart(ctx1, {
    type: 'doughnut',
    data: data1,
    options: options
});
var myLineChart = new Chart(ctx2, {
    type: 'bar',
    data: data2,
    options: option2
});

var button = document.getElementById("sendAjax")

sendAjax('/latestdatachart');

function sendAjax(url) {
    var oReq = new XMLHttpRequest();

    oReq.open('GET', url);
    oReq.setRequestHeader('Content-Type', "application/json") // json 형태로 보낸다
    oReq.send();

    oReq.addEventListener('load', function() {
        var result = JSON.parse(oReq.responseText);
        var comp_data = data1.datasets[0].data;

        data1.labels = result[0].title
        comp_data = result[0].score;

        data1.datasets[0].data = comp_data;
        myBarChart.update();
        var result = JSON.parse(oReq.responseText);
        var comp_data2 = data2.datasets[0].data;

        data2.labels = result[1].title
        comp_data2 = result[1].score

        data2.datasets[0].data = comp_data2;
        myLineChart.update();
    })
}