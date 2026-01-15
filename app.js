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

// 认证相关变量
let currentUser = null;
let userId = null;

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
    initAuth(); // 初始化认证功能
    updateTotalScore();
    
    // 检查用户登录状态
    checkAuthStatus();
});

// 初始化认证功能
function initAuth() {
    // 初始化登录/注册模态框
    const authModal = document.getElementById('authModal');
    const loginModalBtn = document.getElementById('loginModalBtn');
    const closeAuthBtn = document.getElementById('closeAuth');
    
    // 切换登录/注册表单
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // 登录/注册按钮
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    
    // 登出按钮
    const logoutBtn = document.getElementById('logoutBtn');
    
    // 显示登录模态框
    loginModalBtn.addEventListener('click', function() {
        authModal.style.display = 'flex';
    });
    
    // 关闭登录模态框
    closeAuthBtn.addEventListener('click', function() {
        authModal.style.display = 'none';
        clearAuthForms();
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        if (event.target === authModal) {
            authModal.style.display = 'none';
            clearAuthForms();
        }
    });
    
    // 切换到注册表单
    switchToRegister.addEventListener('click', function(e) {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        clearAuthForms();
    });
    
    // 切换到登录表单
    switchToLogin.addEventListener('click', function(e) {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        clearAuthForms();
    });
    
    // 登录按钮点击事件
    loginBtn.addEventListener('click', login);
    
    // 注册按钮点击事件
    registerBtn.addEventListener('click', register);
    
    // 登出按钮点击事件
    logoutBtn.addEventListener('click', logout);
    
    // 添加Supabase Auth会话监听器
    if (window.supabase) {
        // 监听会话变化
        window.supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session);
            
            if (event === 'SIGNED_IN' && session) {
                // 用户登录
                currentUser = session.user;
                userId = session.user.id;
                updateUIForAuthenticatedUser();
                loadDataFromSupabase();
            } else if (event === 'SIGNED_OUT') {
                // 用户登出
                currentUser = null;
                userId = null;
                updateUIForUnauthenticatedUser();
            } else if (event === 'INITIAL_SESSION' && session) {
                // 初始会话存在
                currentUser = session.user;
                userId = session.user.id;
                updateUIForAuthenticatedUser();
                loadDataFromSupabase();
            } else if (event === 'INITIAL_SESSION' && !session) {
                // 初始会话不存在
                currentUser = null;
                userId = null;
                updateUIForUnauthenticatedUser();
            }
        });
    }
}

// 清空认证表单
function clearAuthForms() {
    // 清空登录表单
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    
    // 清空注册表单
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerConfirmPassword').value = '';
}

// 检查用户登录状态
async function checkAuthStatus() {
    try {
        if (!window.supabase) {
            console.error('Supabase客户端未初始化');
            return;
        }
        
        // 检查用户会话
        const { data, error } = await window.supabase.auth.getSession();
        
        if (error) {
            console.error('检查登录状态失败:', error);
            return;
        }
        
        if (data.session) {
            // 用户已登录
            currentUser = data.session.user;
            userId = data.session.user.id;
            updateUIForAuthenticatedUser();
            
            // 加载用户数据
            await loadDataFromSupabase();
        } else {
            // 用户未登录
            currentUser = null;
            userId = null;
            updateUIForUnauthenticatedUser();
        }
    } catch (error) {
        console.error('检查登录状态失败:', error);
    }
}

// 更新已认证用户的UI
function updateUIForAuthenticatedUser() {
    // 显示用户邮箱和登出按钮
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('userEmail').style.display = 'inline-block';
    document.getElementById('logoutBtn').style.display = 'inline-block';
    
    // 隐藏登录按钮
    document.getElementById('loginModalBtn').style.display = 'none';
    
    // 关闭登录模态框
    document.getElementById('authModal').style.display = 'none';
}

// 更新未认证用户的UI
function updateUIForUnauthenticatedUser() {
    // 隐藏用户邮箱和登出按钮
    document.getElementById('userEmail').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'none';
    
    // 显示登录按钮
    document.getElementById('loginModalBtn').style.display = 'inline-block';
    
    // 清空数据
    clearUserData();
}

// 清空用户数据
function clearUserData() {
    scores = [0, 0, 0, 0, 0];
    positions = [];
    profitData = {
        today: 0,
        year: 0,
        history: {}
    };
    
    // 清空本地存储
    localStorage.removeItem('scoreHistory');
    localStorage.removeItem('positions');
    localStorage.removeItem('profitData');
    
    // 更新UI
    updateTotalScore();
    renderPositions();
    renderProfit();
    updateChart();
}

// 登录功能
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // 简单验证
    if (!email || !password) {
        alert('请输入邮箱和密码');
        return;
    }
    
    try {
        if (!window.supabase) {
            console.error('Supabase客户端未初始化');
            alert('Supabase客户端未初始化，请刷新页面重试');
            return;
        }
        
        // 调用Supabase登录API
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('登录失败:', error);
            alert('登录失败: ' + error.message);
            return;
        }
        
        // 登录成功
        currentUser = data.user;
        userId = data.user.id;
        updateUIForAuthenticatedUser();
        clearAuthForms();
        
        // 加载用户数据
        await loadDataFromSupabase();
        
        console.log('登录成功');
    } catch (error) {
        console.error('登录失败:', error);
        alert('登录失败: ' + error.message);
    }
}

// 注册功能
async function register() {
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    // 简单验证
    if (!email || !password || !confirmPassword) {
        alert('请填写完整信息');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('两次输入的密码不一致');
        return;
    }
    
    if (password.length < 6) {
        alert('密码长度至少为6位');
        return;
    }
    
    try {
        if (!window.supabase) {
            console.error('Supabase客户端未初始化');
            alert('Supabase客户端未初始化，请刷新页面重试');
            return;
        }
        
        // 调用Supabase注册API
        const { data, error } = await window.supabase.auth.signUp({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('注册失败:', error);
            alert('注册失败: ' + error.message);
            return;
        }
        
        // 注册成功
        alert('注册成功，请登录');
        
        // 切换到登录表单
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
        clearAuthForms();
        
        console.log('注册成功');
    } catch (error) {
        console.error('注册失败:', error);
        alert('注册失败: ' + error.message);
    }
}

// 登出功能
async function logout() {
    try {
        if (!window.supabase) {
            console.error('Supabase客户端未初始化');
            return;
        }
        
        // 调用Supabase登出API
        const { error } = await window.supabase.auth.signOut();
        
        if (error) {
            console.error('登出失败:', error);
            alert('登出失败: ' + error.message);
            return;
        }
        
        // 登出成功
        currentUser = null;
        userId = null;
        updateUIForUnauthenticatedUser();
        
        console.log('登出成功');
    } catch (error) {
        console.error('登出失败:', error);
        alert('登出失败: ' + error.message);
    }
}

// 从Supabase加载所有数据
async function loadDataFromSupabase() {
    // 检查用户是否已登录
    if (!userId) {
        console.error('用户未登录，无法加载数据');
        return;
    }
    
    try {
        // 检查Supabase是否已初始化
        if (!window.supabase) {
            console.error('Supabase客户端未初始化');
            alert('Supabase客户端未初始化，请刷新页面重试');
            return;
        }
        
        // 加载评分数据
        await loadScoresFromSupabase();
        
        // 加载收益数据
        await loadProfitsFromSupabase();
        
        // 加载持仓数据
        await loadPositionsFromSupabase();
        
        // 更新图表和相关性分析
        updateChart();
        updateCorrelation();
        renderPositions();
        renderProfit();
        
        console.log('数据加载完成');
    } catch (error) {
        console.error('加载数据失败:', error);
        alert('加载数据失败，请刷新页面重试');
    }
}

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

// 从Supabase加载评分数据
async function loadScoresFromSupabase() {
    const { data, error } = await window.supabase
        .from('trading_scores')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });
    
    if (error) {
        console.error('加载评分数据失败:', error);
        throw error;
    }
    
    // 转换为本地格式
    let scoreHistory = {};
    if (data && Array.isArray(data)) {
        data.forEach(record => {
            scoreHistory[record.date] = {
                total: record.total_score,
                dimensions: record.dimensions
            };
        });
    }
    
    // 保存到localStorage（作为缓存）
    localStorage.setItem('scoreHistory', JSON.stringify(scoreHistory));
    
    // 获取今日分数
    const today = new Date().toISOString().split('T')[0];
    if (scoreHistory[today]) {
        scores = scoreHistory[today].dimensions;
        updateTotalScore();
    }
}

// 保存今日分数到Supabase
async function saveTodayScore() {
    // 检查用户是否已登录
    if (!userId) {
        console.error('用户未登录，无法保存数据');
        alert('保存失败: 用户未登录');
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    
    // 保存到Supabase（先删除当天数据，再插入新数据）
    // 1. 删除当天数据
    await window.supabase
        .from('trading_scores')
        .delete()
        .eq('user_id', userId)
        .eq('date', today);
    
    // 2. 插入新数据
    const { data, error } = await window.supabase
        .from('trading_scores')
        .insert({
            user_id: userId,
            date: today,
            dimensions: scores,
            total_score: totalScore
        })
        .select();
    
    if (error) {
        console.error('保存评分失败:', error);
        alert('保存失败: ' + error.message);
        return;
    }
    
    if (!userId) {
        console.error('用户未登录，无法保存数据');
        alert('保存失败: 用户未登录');
        return;
    }
    
    // 更新本地缓存
    let scoreHistory = JSON.parse(localStorage.getItem('scoreHistory')) || {};
    scoreHistory[today] = {
        total: totalScore,
        dimensions: [...scores]
    };
    localStorage.setItem('scoreHistory', JSON.stringify(scoreHistory));
    
    // 更新图表和雷达图
    updateChart();
    updateCorrelation();
    
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
}

// 更新图表数据
function updateChart() {
    try {
        const scoreHistory = JSON.parse(localStorage.getItem('scoreHistory')) || {};
        
        // 转换为数组并按日期排序
        const historyArray = Object.entries(scoreHistory)
            .map(([date, data]) => ({ date, total: data.total }))
            .sort((a, b) => a.date.localeCompare(b.date));
        
        // 准备图表数据
        const labels = historyArray.map(item => item.date);
        const data = historyArray.map(item => item.total);
        
        // 更新图表
        if (chart && chart.data && chart.data.datasets) {
            chart.data.labels = labels;
            chart.data.datasets[0].data = data;
            chart.update();
        }
        
        // 更新其他图表（仅当已初始化时）
        if (radarChart) {
            updateRadarChart();
        }
        if (correlationChart) {
            updateCorrelation();
        }
    } catch (error) {
        console.error('更新图表失败:', error);
    }
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
}

// 更新雷达图数据
function updateRadarChart() {
    try {
        const scoreHistory = JSON.parse(localStorage.getItem('scoreHistory')) || {};
        
        // 计算各维度平均得分
        const dimensionScores = [0, 0, 0, 0, 0];
        let totalEntries = 0;
        
        for (const [date, data] of Object.entries(scoreHistory)) {
            if (data && data.dimensions) {
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
        if (radarChart && radarChart.data && radarChart.data.datasets) {
            radarChart.data.datasets[0].data = avgScores;
            radarChart.update();
        }
    } catch (error) {
        console.error('更新雷达图失败:', error);
    }
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
    renderPositions();
    
    const addPositionBtn = document.getElementById('addPositionBtn');
    addPositionBtn.addEventListener('click', addPosition);
}

// 从Supabase加载持仓数据
async function loadPositionsFromSupabase() {
    const { data, error } = await window.supabase
        .from('core_positions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
    
    if (error) {
        console.error('加载持仓数据失败:', error);
        throw error;
    }
    
    // 转换为本地格式
    positions = [];
    if (data && Array.isArray(data)) {
        positions = data.map(record => ({
            id: record.id,
            name: record.name,
            percentage: record.percentage,
            logic: record.logic
        }));
    }
    
    // 保存到localStorage（作为缓存）
    localStorage.setItem('positions', JSON.stringify(positions));
}

// 保存持仓数据到Supabase
async function savePositions() {
    try {
        // 清空现有持仓数据
        await window.supabase
            .from('core_positions')
            .delete()
            .eq('user_id', userId);
        
        // 批量插入新数据
        if (positions.length > 0) {
            const positionData = positions.map(pos => ({
                user_id: userId,
                name: pos.name,
                percentage: pos.percentage,
                logic: pos.logic
            }));
            
            await window.supabase
            .from('core_positions')
            .insert(positionData);
        }
        
        // 保存到localStorage（作为缓存）
        localStorage.setItem('positions', JSON.stringify(positions));
    } catch (error) {
        console.error('保存持仓数据失败:', error);
    }
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
    renderProfit();
    
    const saveProfitBtn = document.getElementById('saveProfitBtn');
    saveProfitBtn.addEventListener('click', saveTodayProfit);
}

// 从Supabase加载收益数据
async function loadProfitsFromSupabase() {
    const { data, error } = await window.supabase
        .from('trading_profits')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });
    
    if (error) {
        console.error('加载收益数据失败:', error);
        throw error;
    }
    
    // 转换为本地格式
    let history = {};
    if (data && Array.isArray(data)) {
        data.forEach(record => {
            history[record.date] = record.profit;
        });
    }
    
    // 更新本地数据
    profitData.history = history;
    
    // 获取今日收益
    const today = new Date().toISOString().split('T')[0];
    profitData.today = history[today] || 0;
    
    // 计算今年累计收益
    updateYearlyProfit();
    
    // 保存到localStorage（作为缓存）
    localStorage.setItem('profitData', JSON.stringify(profitData));
}

// 保存收益数据到Supabase
async function saveProfitData() {
    // 保存当前收益到Supabase
    const today = new Date().toISOString().split('T')[0];
    
    // 1. 删除当天数据
    await window.supabase
        .from('trading_profits')
        .delete()
        .eq('user_id', userId)
        .eq('date', today);
    
    // 2. 插入新数据
    const { data, error } = await window.supabase
        .from('trading_profits')
        .insert({
            user_id: userId,
            date: today,
            profit: profitData.today
        })
        .select();
    
    if (error) {
        console.error('保存收益数据失败:', error);
        return;
    }
    
    // 保存到localStorage（作为缓存）
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
async function saveTodayProfit() {
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
    
    // 保存到Supabase
    await saveProfitData();
    
    // 渲染更新
    renderProfit();
    updateCorrelation();
    
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