// ========== 游戏化系统 ==========
let gameState = {
    points: 0,
    level: 1,
    questionCount: 0,
    achievements: []
};

// 从localStorage加载游戏数据
function loadGameState() {
    const saved = localStorage.getItem('einsteinGameState');
    if (saved) {
        gameState = JSON.parse(saved);
        updateUI();
    }
}

// 保存游戏数据
function saveGameState() {
    localStorage.setItem('einsteinGameState', JSON.stringify(gameState));
}

// 更新UI显示
function updateUI() {
    document.getElementById('points').textContent = gameState.points;
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('question-count').textContent = gameState.questionCount;
}

// 增加积分
function addPoints(amount) {
    gameState.points += amount;

    // 升级逻辑
    const newLevel = Math.floor(gameState.points / 100) + 1;
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        showAchievement(`升级到 Lv.${newLevel}！`, '继续加油！🎉');
    }

    saveGameState();
    updateUI();

    // 动画效果
    animatePoints();
}

// 积分动画
function animatePoints() {
    const pointsEl = document.getElementById('points');
    pointsEl.style.transform = 'scale(1.3)';
    pointsEl.style.color = '#ffd700';
    setTimeout(() => {
        pointsEl.style.transform = 'scale(1)';
        pointsEl.style.color = 'white';
    }, 300);
}

// 显示成就
function showAchievement(title, desc) {
    const popup = document.getElementById('achievement-popup');
    const descEl = document.getElementById('achievement-desc');

    descEl.textContent = desc || title;
    popup.classList.add('show');

    // 播放音效（如果有）
    playSound('achievement');

    setTimeout(() => {
        popup.classList.remove('show');
    }, 3000);
}

// 音效系统（可选）
function playSound(type) {
    // 可以添加音效播放逻辑
    console.log(`播放音效: ${type}`);
}

// ========== 聊天功能 ==========
document.addEventListener('DOMContentLoaded', () => {
    loadGameState();

    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatMessages = document.getElementById('chat-messages');
    const loadingOverlay = document.getElementById('loading-overlay');

    // 添加消息到聊天窗口
    function addMessage(content, sender) {
        // 移除提示卡片
        const tipCards = document.querySelector('.tip-cards');
        if (tipCards && sender === 'user') {
            tipCards.remove();
        }

        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        messageElement.textContent = content;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 发送消息
    async function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;

        // 显示用户消息
        addMessage(message, 'user');
        userInput.value = '';

        // 增加提问计数
        gameState.questionCount++;
        updateUI();

        // 显示加载动画
        loadingOverlay.style.display = 'flex';

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            // 隐藏加载动画
            loadingOverlay.style.display = 'none';

            // 显示AI回答
            addMessage(data.response, 'bot');

            // 奖励积分
            addPoints(10);

            // 检查成就
            checkAchievements();

        } catch (error) {
            console.error('Error during fetch:', error);
            loadingOverlay.style.display = 'none';
            addMessage('抱歉，我这里出了一点小问题，请稍后再试。😅', 'bot');
        }
    }

    // 检查成就
    function checkAchievements() {
        // 第一次提问
        if (gameState.questionCount === 1 && !gameState.achievements.includes('first')) {
            gameState.achievements.push('first');
            showAchievement('初识物理！', '你提出了第一个问题！🌟');
            saveGameState();
        }

        // 10个问题
        if (gameState.questionCount === 10 && !gameState.achievements.includes('curious')) {
            gameState.achievements.push('curious');
            showAchievement('好奇宝宝！', '已经问了10个问题啦！🎈');
            saveGameState();
        }

        // 50个问题
        if (gameState.questionCount === 50 && !gameState.achievements.includes('scholar')) {
            gameState.achievements.push('scholar');
            showAchievement('物理学者！', '问了50个问题，真厉害！🏆');
            saveGameState();
        }
    }

    // 发送按钮点击事件
    sendButton.addEventListener('click', sendMessage);

    // 回车键发送
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    // 表情按钮（可选功能）
    document.getElementById('emoji-btn').addEventListener('click', () => {
        const emojis = ['😊', '🤔', '💡', '🌟', '🚀', '⭐', '🎉', '👍'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        userInput.value += randomEmoji;
        userInput.focus();
    });
});

// ========== 快速提问功能 ==========
function askQuestion(question) {
    const userInput = document.getElementById('user-input');
    userInput.value = question;
    userInput.focus();

    // 自动发送
    setTimeout(() => {
        document.getElementById('send-button').click();
    }, 300);
}

// ========== 主题切换（可选） ==========
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

// ========== 键盘快捷键 ==========
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K 清空输入
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('user-input').value = '';
    }

    // Esc 取消输入
    if (e.key === 'Escape') {
        document.getElementById('user-input').value = '';
        document.getElementById('user-input').blur();
    }
});

// ========== 复制功能 ==========
function copyMessage(button) {
    const messageText = button.parentElement.querySelector('.message-text').textContent;
    navigator.clipboard.writeText(messageText).then(() => {
        button.textContent = '已复制！';
        setTimeout(() => {
            button.textContent = '复制';
        }, 2000);
    });
}

// ========== 语音功能（可选，需要Web Speech API） ==========
function speak(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }
}

// ========== 初始化欢迎动画 ==========
window.addEventListener('load', () => {
    // 延迟显示欢迎消息
    setTimeout(() => {
        const welcomeBubble = document.querySelector('.welcome-bubble');
        if (welcomeBubble) {
            welcomeBubble.style.animation = 'fadeIn 0.5s ease-out';
        }
    }, 500);

    // 如果是第一次访问，显示引导
    if (!localStorage.getItem('visited')) {
        localStorage.setItem('visited', 'true');
        showAchievement('欢迎来到时空实验室！', '快来向爱因斯坦提问吧！🎉');
    }
});

// ========== 统计功能 ==========
function getStats() {
    return {
        totalQuestions: gameState.questionCount,
        totalPoints: gameState.points,
        currentLevel: gameState.level,
        achievements: gameState.achievements.length
    };
}

// ========== 重置进度（用于测试） ==========
function resetProgress() {
    if (confirm('确定要重置所有进度吗？')) {
        localStorage.clear();
        location.reload();
    }
}

// ========== 导出聊天记录 ==========
function exportChat() {
    const messages = document.querySelectorAll('.message');
    let chatText = '爱因斯坦对话记录\\n\\n';

    messages.forEach(msg => {
        const sender = msg.classList.contains('user-message') ? '我' : '爱因斯坦';
        chatText += `${sender}: ${msg.textContent}\\n\\n`;
    });

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `爱因斯坦对话_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
}

// 添加到window对象，方便调试
window.einsteinGame = {
    getStats,
    resetProgress,
    exportChat,
    addPoints,
    showAchievement
};

console.log('%c🧪 爱因斯坦的时空实验室', 'font-size: 24px; color: #667eea; font-weight: bold;');
console.log('%c欢迎来到物理的奇妙世界！', 'font-size: 14px; color: #764ba2;');
console.log('提示: 使用 window.einsteinGame 查看可用功能');
