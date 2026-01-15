// 全局变量
let scores = [0, 0, 0, 0, 0];
let chart = null;
let radarChart = null;
let correlationChart = null;
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
    initRadarChart();
    initCorrelationChart();
    initPositions();
    initProfit();
    initExport();
    updateTotalScore();
    updateCorrelation();
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
    
    // 更新其他图表
    updateRadarChart();
    updateCorrelation();
}

// 初始化雷达图
function initRadarChart() {
    const ctx = document.getElementById('radarChart').getContext('2d');
    
    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['盘前准备', '信号执行', '风险控制', '盘中定力', '复盘归档'],
            datasets: [{
                label: '平均得分',
                data: [0, 0, 0, 0, 0],
                backgroundColor: 'rgba(255, 107, 107, 0.2)',
                borderColor: '#FF6B6B',
                borderWidth: 3,
                pointBackgroundColor: '#FF6B6B',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5
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
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 2,
                    ticks: {
                        stepSize: 0.5,
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
    
    updateRadarChart();
}

// 更新雷达图数据
function updateRadarChart() {
    const scoreHistory = JSON.parse(localStorage.getItem('scoreHistory')) || {};
    
    if (Object.keys(scoreHistory).length === 0) {
        radarChart.data.datasets[0].data = [0, 0, 0, 0, 0];
        radarChart.update();
        return;
    }
    
    // 计算各维度平均得分
    const dimensionScores = [0, 0, 0, 0, 0];
    let totalEntries = 0;
    
    for (const [date, data] of Object.entries(scoreHistory)) {
        if (data.dimensions) {
            dimensionScores[0] += data.dimensions[0];
            dimensionScores[1] += data.dimensions[1];
            dimensionScores[2] += data.dimensions[2];
            dimensionScores[3] += data.dimensions[3];
            dimensionScores[4] += data.dimensions[4];
            totalEntries++;
        }
    }
    
    // 计算平均值
    const avgScores = dimensionScores.map(score => totalEntries > 0 ? (score / totalEntries).toFixed(1) : 0);
    
    // 更新雷达图
    radarChart.data.datasets[0].data = avgScores;
    radarChart.update();
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
                <!-- 显示模式 -->
                <div class="position-view" id="positionView-${index}">
                    <div class="position-header">
                        <div class="position-name">${position.name}</div>
                        <div class="position-percentage ${isHighRisk ? 'high-risk' : ''}">
                            ${position.percentage}%
                        </div>
                    </div>
                    <div class="position-logic">${position.logic}</div>
                    <div class="position-actions">
                        <button class="edit-position-btn" onclick="editPosition(${index})">修改</button>
                        <button class="delete-position-btn" onclick="deletePosition(${index})">删除</button>
                    </div>
                </div>
                
                <!-- 编辑模式 -->
                <div class="position-edit" id="positionEdit-${index}" style="display: none;">
                    <input type="text" id="editName-${index}" value="${position.name}" class="position-edit-input">
                    <input type="number" id="editPercentage-${index}" value="${position.percentage}" step="0.1" min="0" max="100" class="position-edit-input">
                    <textarea id="editLogic-${index}" class="position-edit-textarea">${position.logic}</textarea>
                    <div class="position-edit-actions">
                        <button class="save-edit-btn" onclick="saveEdit(${index})">保存</button>
                        <button class="cancel-edit-btn" onclick="cancelEdit(${index})">取消</button>
                    </div>
                </div>
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

// 进入编辑模式
function editPosition(index) {
    // 隐藏显示模式
    document.getElementById(`positionView-${index}`).style.display = 'none';
    // 显示编辑模式
    document.getElementById(`positionEdit-${index}`).style.display = 'block';
}

// 保存修改
function saveEdit(index) {
    const name = document.getElementById(`editName-${index}`).value.trim();
    const percentage = parseFloat(document.getElementById(`editPercentage-${index}`).value);
    const logic = document.getElementById(`editLogic-${index}`).value.trim();
    
    if (!name || isNaN(percentage) || percentage <= 0) {
        alert('请填写完整的股票名称和有效仓位');
        return;
    }
    
    // 检查仓位是否超过30%
    if (percentage > 30) {
        alert('违背持仓原则，请先留意风险！');
    }
    
    // 更新持仓数据
    positions[index] = {
        name: name,
        percentage: percentage,
        logic: logic
    };
    
    // 保存到localStorage
    savePositions();
    
    // 重新渲染持仓列表
    renderPositions();
}

// 取消编辑
function cancelEdit(index) {
    // 隐藏编辑模式
    document.getElementById(`positionEdit-${index}`).style.display = 'none';
    // 显示显示模式
    document.getElementById(`positionView-${index}`).style.display = 'block';
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

// 初始化相关性图表
function initCorrelationChart() {
    const ctx = document.getElementById('correlationChart').getContext('2d');
    
    correlationChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: '得分 vs 收益',
                data: [],
                backgroundColor: 'rgba(77, 150, 255, 0.8)',
                borderColor: '#4D96FF',
                borderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
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
                x: {
                    title: {
                        display: true,
                        text: '今日得分',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    beginAtZero: true,
                    max: 10,
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '今日收益 (元)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
}

// 计算相关性系数
function calculateCorrelation() {
    const scoreHistory = JSON.parse(localStorage.getItem('scoreHistory')) || {};
    const profitHistory = profitData.history;
    
    // 准备数据点
    const dataPoints = [];
    
    for (const [date, scoreData] of Object.entries(scoreHistory)) {
        if (profitHistory[date] !== undefined) {
            dataPoints.push({
                x: scoreData.total,
                y: profitHistory[date]
            });
        }
    }
    
    if (dataPoints.length < 3) {
        return {
            correlation: 0,
            points: []
        };
    }
    
    // 计算平均值
    const avgX = dataPoints.reduce((sum, point) => sum + point.x, 0) / dataPoints.length;
    const avgY = dataPoints.reduce((sum, point) => sum + point.y, 0) / dataPoints.length;
    
    // 计算相关性系数
    let numerator = 0;
    let sumSqX = 0;
    let sumSqY = 0;
    
    for (const point of dataPoints) {
        const xDiff = point.x - avgX;
        const yDiff = point.y - avgY;
        
        numerator += xDiff * yDiff;
        sumSqX += xDiff * xDiff;
        sumSqY += yDiff * yDiff;
    }
    
    const denominator = Math.sqrt(sumSqX * sumSqY);
    const correlation = denominator === 0 ? 0 : numerator / denominator;
    
    return {
        correlation: parseFloat(correlation.toFixed(2)),
        points: dataPoints
    };
}

// 更新相关性分析
function updateCorrelation() {
    const result = calculateCorrelation();
    const correlationValue = document.getElementById('correlationValue');
    const correlationInterpretation = document.getElementById('correlationInterpretation');
    
    // 更新相关性系数
    correlationValue.textContent = result.correlation;
    
    // 更新散点图
    correlationChart.data.datasets[0].data = result.points;
    correlationChart.update();
    
    // 更新解释文本
    let interpretation = '';
    if (result.points.length < 3) {
        interpretation = '暂无足够数据进行分析（需要至少3个数据点）';
    } else {
        if (result.correlation > 0.7) {
            interpretation = '高度正相关：得分高时收益也高，交易系统表现良好！';
        } else if (result.correlation > 0.3) {
            interpretation = '中度正相关：得分与收益有一定关联，交易系统基本有效。';
        } else if (result.correlation > -0.3) {
            interpretation = '弱相关或无相关：得分与收益关联不大，需要检查交易系统。';
        } else if (result.correlation > -0.7) {
            interpretation = '中度负相关：得分高时收益反而低，交易系统可能存在问题！';
        } else {
            interpretation = '高度负相关：得分高时收益低，得分低时收益高，说明只是运气好，长期很危险！';
        }
    }
    correlationInterpretation.textContent = interpretation;
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
    yearProfitValue.className = `profit-value ${yearProfitValue < 0 ? 'negative' : ''}`;
}

// 初始化导出功能
function initExport() {
    const exportImageBtn = document.getElementById('exportImageBtn');
    const exportPDFBtn = document.getElementById('exportPDFBtn');
    
    exportImageBtn.addEventListener('click', exportAsImage);
    exportPDFBtn.addEventListener('click', exportAsPDF);
}

// 导出为图片
async function exportAsImage() {
    const container = document.querySelector('.container');
    
    try {
        // 使用html2canvas将页面转换为canvas
        const canvas = await html2canvas(container, {
            scale: 2, // 提高分辨率
            useCORS: true, // 允许跨域图片
            backgroundColor: '#ffffff'
        });
        
        // 将canvas转换为图片链接
        const imageUrl = canvas.toDataURL('image/png');
        
        // 创建下载链接
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `交易复盘报告_${new Date().toISOString().split('T')[0]}.png`;
        link.click();
    } catch (error) {
        console.error('导出图片失败:', error);
        alert('导出图片失败，请重试');
    }
}

// 导出为PDF
async function exportAsPDF() {
    const container = document.querySelector('.container');
    
    try {
        // 使用html2canvas将页面转换为canvas
        const canvas = await html2canvas(container, {
            scale: 2, // 提高分辨率
            useCORS: true, // 允许跨域图片
            backgroundColor: '#ffffff'
        });
        
        // 导入jsPDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        // 计算PDF尺寸和缩放比例
        const imgWidth = 210; // A4宽度，单位mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // 将canvas转换为图片并添加到PDF
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        
        // 保存PDF
        pdf.save(`交易复盘报告_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
        console.error('导出PDF失败:', error);
        alert('导出PDF失败，请重试');
    }
}