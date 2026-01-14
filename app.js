// 全局变量
let scores = [0, 0, 0, 0, 0];
let chart = null;
let positions = [];
let profitData = {
    today: 0,
    year: 0,
    history: {}
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initTime();
    initMarketAlert();
    initScoreButtons();
    initSaveButton();
    initAlertModal();
    initChart();
    initPositions();
    initProfit();
    updateTotalScore();
});

// 初始化时间显示
function initTime() {
    function updateTime() {
        const now = new Date();
        const timeString = now.toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('currentTime').textContent = timeString;
    }
    
    updateTime();
    setInterval(updateTime, 1000);
}

// 初始化市场提醒
function initMarketAlert() {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    let marketStatus = '休市';
    
    // 周一到周五，9:15-11:30, 13:00-15:00 为开盘时间
    if (day >= 1 && day <= 5) {
        const currentMinutes = hour * 60 + minute;
        const morningStart = 9 * 60 + 15;
        const morningEnd = 11 * 60 + 30;
        const afternoonStart = 13 * 60;
        const afternoonEnd = 15 * 60;
        
        if ((currentMinutes >= morningStart && currentMinutes <= morningEnd) || 
            (currentMinutes >= afternoonStart && currentMinutes <= afternoonEnd)) {
            marketStatus = '开盘中';
        } else if (currentMinutes < morningStart) {
            marketStatus = '早盘未开始';
        } else if (currentMinutes > morningEnd && currentMinutes < afternoonStart) {
            marketStatus = '午间休市';
        } else {
            marketStatus = '今日已收盘';
        }
    }
    
    document.getElementById('marketAlert').textContent = `A股盘面：${marketStatus}`;
}

// 初始化评分按钮
function initScoreButtons() {
    const scoreButtons = document.querySelectorAll('.score-btn');
    
    scoreButtons.forEach(button => {
        button.addEventListener('click', function() {
            const dimension = parseInt(this.dataset.dimension);
            const score = parseInt(this.dataset.score);
            
            // 更新当前维度分数
            scores[dimension] = score;
            
            // 更新UI
            updateDimensionScore(dimension, score);
            updateTotalScore();
        });
    });
}

// 更新单个维度分数
function updateDimensionScore(dimension, score) {
    // 更新当前分数显示
    document.getElementById(`score${dimension}`).textContent = score;
    
    // 更新按钮状态
    const buttons = document.querySelectorAll(`[data-dimension="${dimension}"]`);
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.dataset.score) === score) {
            btn.classList.add('active');
        }
    });
}

// 更新总分和状态
function updateTotalScore() {
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const statusElement = document.getElementById('scoreStatus');
    
    // 更新总分显示
    document.getElementById('totalScore').textContent = totalScore;
    
    // 更新状态
    let status = '';
    let statusClass = '';
    
    if (totalScore >= 8) {
        status = '优秀';
        statusClass = 'pass';
    } else if (totalScore >= 6) {
        status = '合格';
        statusClass = 'warning';
    } else {
        status = '不合格';
        statusClass = 'danger';
    }
    
    statusElement.textContent = status;
    statusElement.className = `score-status ${statusClass}`;
}

// 初始化保存按钮
function initSaveButton() {
    const saveBtn = document.getElementById('saveBtn');
    
    saveBtn.addEventListener('click', function() {
        saveTodayScore();
        checkAlertCondition();
        updateChart();
    });
}

// 保存今日分数到localStorage
function saveTodayScore() {
    const today = new Date().toISOString().split('T')[0];
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    
    // 获取历史分数
    let scoreHistory = JSON.parse(localStorage.getItem('scoreHistory')) || {};
    
    // 保存今日分数
    scoreHistory[today] = {
        total: totalScore,
        dimensions: [...scores],
        timestamp: Date.now()
    };
    
    // 只保留最近30天的数据
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    // 过滤旧数据
    const filteredHistory = {};
    for (const [date, data] of Object.entries(scoreHistory)) {
        if (date >= thirtyDaysAgoStr) {
            filteredHistory[date] = data;
        }
    }
    
    // 保存回localStorage
    localStorage.setItem('scoreHistory', JSON.stringify(filteredHistory));
    
    // 显示保存成功
    alert('今日评分已保存！');
}

// 初始化图表
function initChart() {
    const ctx = document.getElementById('scoreChart').getContext('2d');
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '每日得分',
                data: [],
                borderColor: '#FF7F00',
                backgroundColor: 'rgba(255, 127, 0, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#FF7F00',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 16
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    ticks: {
                        stepSize: 2,
                        font: {
                            size: 14
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 12
                        },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
    
    updateChart();
}

// 更新图表数据
function updateChart() {
    const scoreHistory = JSON.parse(localStorage.getItem('scoreHistory')) || {};
    
    // 转换为数组并按日期排序
    const historyArray = Object.entries(scoreHistory)
        .map(([date, data]) => ({ date, total: data.total }))
        .sort((a, b) => a.date.localeCompare(b.date));
    
    // 准备图表数据
    const labels = historyArray.map(item => item.date);
    const data = historyArray.map(item => item.total);
    
    // 更新图表
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
}

// 检查预警条件
function checkAlertCondition() {
    const scoreHistory = JSON.parse(localStorage.getItem('scoreHistory')) || {};
    const historyArray = Object.entries(scoreHistory)
        .map(([date, data]) => ({ date, total: data.total }))
        .sort((a, b) => b.date.localeCompare(a.date)); // 按日期倒序
    
    // 检查连续3天低于6分
    let consecutiveLowDays = 0;
    for (const item of historyArray.slice(0, 3)) {
        if (item.total < 6) {
            consecutiveLowDays++;
        } else {
            break;
        }
    }
    
    if (consecutiveLowDays >= 3) {
        showAlertModal();
    }
}

// 初始化预警模态框
function initAlertModal() {
    const closeBtn = document.getElementById('closeAlert');
    const modal = document.getElementById('alertModal');
    
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// 显示预警模态框
function showAlertModal() {
    const modal = document.getElementById('alertModal');
    modal.style.display = 'flex';
}

// 注册Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js')
            .then(function(registration) {
                console.log('Service Worker 注册成功:', registration.scope);
            })
            .catch(function(error) {
                console.log('Service Worker 注册失败:', error);
            });
    });
}

// 初始化核心持仓功能
function initPositions() {
    loadPositions();
    renderPositions();
    
    const addPositionBtn = document.getElementById('addPositionBtn');
    addPositionBtn.addEventListener('click', addPosition);
}

// 从localStorage加载持仓数据
function loadPositions() {
    const savedPositions = localStorage.getItem('positions');
    if (savedPositions) {
        positions = JSON.parse(savedPositions);
    }
}

// 保存持仓数据到localStorage
function savePositions() {
    localStorage.setItem('positions', JSON.stringify(positions));
}

// 渲染持仓列表
function renderPositions() {
    const positionsList = document.getElementById('positionsList');
    
    if (positions.length === 0) {
        positionsList.innerHTML = '<p style="color: #666; text-align: center;">暂无核心持仓</p>';
        return;
    }
    
    positionsList.innerHTML = positions.map((position, index) => {
        const isHighRisk = position.percentage > 30;
        return `
            <div class="position-item">
                <div class="position-header">
                    <div class="position-name">${position.name}</div>
                    <div class="position-percentage ${isHighRisk ? 'high-risk' : ''}">
                        ${position.percentage}%
                    </div>
                </div>
                <div class="position-logic">${position.logic}</div>
                <button class="delete-position-btn" onclick="deletePosition(${index})">删除</button>
            </div>
        `;
    }).join('');
}

// 添加新持仓
function addPosition() {
    const stockName = document.getElementById('stockName').value.trim();
    const stockPosition = parseFloat(document.getElementById('stockPosition').value);
    const stockLogic = document.getElementById('stockLogic').value.trim();
    
    // 验证输入
    if (!stockName || isNaN(stockPosition) || stockPosition <= 0) {
        alert('请填写完整的股票名称和有效仓位');
        return;
    }
    
    // 检查仓位是否超过30%
    if (stockPosition > 30) {
        alert('违背持仓原则，请先留意风险！');
    }
    
    // 创建新持仓对象
    const newPosition = {
        name: stockName,
        percentage: stockPosition,
        logic: stockLogic
    };
    
    // 添加到持仓列表
    positions.push(newPosition);
    
    // 保存并渲染
    savePositions();
    renderPositions();
    
    // 清空表单
    document.getElementById('stockName').value = '';
    document.getElementById('stockPosition').value = '';
    document.getElementById('stockLogic').value = '';
}

// 删除持仓
function deletePosition(index) {
    if (confirm('确定要删除这个持仓吗？')) {
        positions.splice(index, 1);
        savePositions();
        renderPositions();
    }
}

// 初始化收益记录功能
function initProfit() {
    loadProfitData();
    renderProfit();
    
    const saveProfitBtn = document.getElementById('saveProfitBtn');
    saveProfitBtn.addEventListener('click', saveTodayProfit);
}

// 从localStorage加载收益数据
function loadProfitData() {
    const savedProfit = localStorage.getItem('profitData');
    if (savedProfit) {
        profitData = JSON.parse(savedProfit);
    } else {
        // 初始化收益数据
        profitData = {
            today: 0,
            year: 0,
            history: {}
        };
    }
    
    // 检查并更新今年累计收益
    updateYearlyProfit();
}

// 保存收益数据到localStorage
function saveProfitData() {
    localStorage.setItem('profitData', JSON.stringify(profitData));
}

// 保存今日收益
function saveTodayProfit() {
    const todayProfitInput = document.getElementById('todayProfit');
    const todayProfit = parseFloat(todayProfitInput.value);
    
    if (isNaN(todayProfit)) {
        alert('请输入有效的收益数值');
        return;
    }
    
    // 获取今日日期
    const today = new Date().toISOString().split('T')[0];
    
    // 保存今日收益到历史记录
    profitData.today = todayProfit;
    profitData.history[today] = todayProfit;
    
    // 更新今年累计收益
    updateYearlyProfit();
    
    // 保存到localStorage
    saveProfitData();
    
    // 渲染更新
    renderProfit();
    
    // 清空输入框
    todayProfitInput.value = '';
    
    // 显示保存成功
    alert('今日收益已保存！');
}

// 更新今年累计收益
function updateYearlyProfit() {
    const currentYear = new Date().getFullYear();
    let totalProfit = 0;
    
    // 遍历历史记录，计算今年累计收益
    for (const [date, profit] of Object.entries(profitData.history)) {
        const recordYear = new Date(date).getFullYear();
        if (recordYear === currentYear) {
            totalProfit += profit;
        }
    }
    
    profitData.year = totalProfit;
}

// 渲染收益数据
function renderProfit() {
    const todayProfitValue = document.getElementById('todayProfitValue');
    const yearProfitValue = document.getElementById('yearProfitValue');
    
    // 渲染今日收益
    const todayFormatted = profitData.today.toFixed(2);
    todayProfitValue.textContent = `¥${todayFormatted}`;
    todayProfitValue.className = `profit-value ${profitData.today < 0 ? 'negative' : ''}`;
    
    // 渲染今年累计收益
    const yearFormatted = profitData.year.toFixed(2);
    yearProfitValue.textContent = `¥${yearFormatted}`;
    yearProfitValue.className = `profit-value ${profitData.year < 0 ? 'negative' : ''}`;
}