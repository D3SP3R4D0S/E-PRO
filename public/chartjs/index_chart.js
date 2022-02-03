var data1 = {
    labels: [],
    datasets: [
        {
            label: 'Watst of money',
            data: [],
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
                'rgba(255,99,132,1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
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
                'rgba(30, 100, 120, 0.2)'
            ],
            borderColor: [
                'rgba(30,100,120,1)'
            ],
            borderWidth: 2
        }
    ]
};

var options = {
};

var ctx1 = document.getElementById("myChart").getContext('2d');
var ctx2 = document.getElementById("myChart2").getContext('2d');
var myBarChart = new Chart(ctx1, {
    type: 'bar',
    data: data1,
    options: options
});
var myLineChart = new Chart(ctx2, {
    type: 'line',
    data: data2,
    options: options
});

var button = document.getElementById("sendAjax")

sendAjax('/alpha');

function sendAjax(url) {
    var oReq = new XMLHttpRequest();

    oReq.open('POST', url);
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