const messageInput = document.getElementById('messageInput');
const thinkBtn = document.getElementById('thinkBtn');
const searchBtn = document.getElementById('searchBtn');
const sendBtn = document.getElementById('sendBtn');
const chatContainer = document.getElementById('chatContainer');
const messageListWrapper = document.getElementById('messageListWrapper');

const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
const contentArea = document.getElementById('contentArea');

// Sidebar toggle functionality
toggleSidebarBtn.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  if (sidebar.classList.contains('collapsed')) {
    contentArea.style.marginLeft = '60px';
    chatContainer.style.width = 'calc(100% - 60px)';
    chatContainer.style.left = '60px';
  } else {
    contentArea.style.marginLeft = '250px';
    chatContainer.style.width = 'calc(100% - 250px)';
    chatContainer.style.left = '250px';
  }
});

thinkBtn.addEventListener('click', function() {
  this.classList.toggle('active');
});

searchBtn.addEventListener('click', function() {
  this.classList.toggle('active');
});

messageInput.addEventListener('input', () => {
  const singleLineHeight = 48;
  const twoLinesHeight = 72;
  
  messageInput.style.height = 'auto';
  
  if (messageInput.value.trim() === '') {
    messageInput.style.height = singleLineHeight + 'px';
    sendBtn.classList.remove('active-send');
  } else {
    messageInput.style.height = (messageInput.scrollHeight > twoLinesHeight) 
      ? messageInput.scrollHeight + 'px'
      : singleLineHeight + 'px';
    sendBtn.classList.add('active-send');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const singleLineHeight = 48;
  const twoLinesHeight = 72;
  
  if (messageInput.value.trim() !== '') {
    messageInput.style.height = 'auto';
    messageInput.style.height = (messageInput.scrollHeight > twoLinesHeight) 
      ? messageInput.scrollHeight + 'px'
      : singleLineHeight + 'px';
    sendBtn.classList.add('active-send');
  } else {
    messageInput.style.height = singleLineHeight + 'px';
    sendBtn.classList.remove('active-send');
  }

  if (sidebar.classList.contains('collapsed')) {
    contentArea.style.marginLeft = '60px';
    chatContainer.style.width = 'calc(100% - 60px)';
    chatContainer.style.left = '60px';
  } else {
    contentArea.style.marginLeft = '250px';
    chatContainer.style.width = 'calc(100% - 250px)';
    chatContainer.style.left = '250px';
  }
});

function appendMessage(text, type) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('chat-message', type);
  messageDiv.textContent = text;
  messageListWrapper.appendChild(messageDiv);
  messageListWrapper.scrollTop = messageListWrapper.scrollHeight;
}

// Функция для эффекта печати по одному символу
function typeWriter(text, element, speed = 20, callback) {
  let i = 0;
  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      messageListWrapper.scrollTop = messageListWrapper.scrollHeight;
      setTimeout(type, speed);
    } else if (callback) {
      callback();
    }
  }
  type();
}

// Функция для отправки сообщения в Gemini API и потокового получения ответа
async function sendToGemini(message, botMessageDiv) {
  const apiKey = 'AIzaSyBEgswMo2xyzcOki16ewHgkfbEgm-02Ar0';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;
  const payload = {
    contents: [
      {
        parts: [
          {
            text: message
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('API request failed: ' + response.statusText);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let isTyping = false;

    function processBuffer() {
      if (buffer && !isTyping) {
        isTyping = true;
        const textToType = buffer;
        buffer = ''; // Очищаем буфер сразу
        typeWriter(textToType, botMessageDiv, 16, () => {
          isTyping = false;
          processBuffer(); // Проверяем, есть ли новый текст в буфере
        });
      }
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        processBuffer(); // Обрабатываем оставшийся буфер
        break;
      }
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          try {
            const json = JSON.parse(data);
            const text = json.candidates[0].content.parts[0].text;
            buffer += text;
            processBuffer(); // Запускаем печать, если возможно
          } catch (e) {
            console.error('Error parsing JSON:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
    botMessageDiv.textContent = 'Error: Unable to get response from Gemini.';
  }
}

// Обработчик события для кнопки отправки
sendBtn.addEventListener('click', () => {
  const messageText = messageInput.value.trim();
  if (messageText) {
    appendMessage(messageText, 'user-message');
    messageInput.value = '';
    messageInput.style.height = '48px';
    sendBtn.classList.remove('active-send');

    // Создаем placeholder для сообщения бота
    const botMessageDiv = document.createElement('div');
    botMessageDiv.classList.add('chat-message', 'bot-message');
    botMessageDiv.textContent = '';
    messageListWrapper.appendChild(botMessageDiv);
    messageListWrapper.scrollTop = messageListWrapper.scrollHeight;

    // Отправляем запрос в Gemini
    sendToGemini(messageText, botMessageDiv);
  }
});

messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendBtn.click();
  }
});