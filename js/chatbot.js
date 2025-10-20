// SachiDev Chatbot Integration
// Handles UI interactions and connects to the chatbot service

import SachiDevChatbot from '../services/chatbot/index.js';

class ChatbotUI {
  constructor() {
    this.chatbot = new SachiDevChatbot();
    this.isOpen = false;
    this.isMinimized = false;
    this.isTyping = false;
    this.db = null; // Will be set when database is available
    this.isWelcomeScreen = true;

    this.initializeElements();
    this.attachEventListeners();
    this.initializeChatbot();
  }

  initializeElements() {
    this.toggleBtn = document.getElementById('chatbot-toggle');
    this.container = document.getElementById('chatbot-container');
    this.welcomeScreen = document.getElementById('chatbot-welcome');
    this.messagesContainer = document.getElementById('chatbot-messages');
    this.inputArea = document.getElementById('chatbot-input-area');
    this.input = document.getElementById('chatbot-input');
    this.sendBtn = document.getElementById('chatbot-send');
    this.minimizeBtn = document.getElementById('chatbot-minimize');
    this.closeBtn = document.getElementById('chatbot-close');
    this.suggestionsContainer = document.getElementById('chatbot-suggestions');
    this.topicCards = document.querySelectorAll('.chatbot-topic-card');
  }

  attachEventListeners() {
    // Toggle chatbot
    this.toggleBtn.addEventListener('click', () => this.toggleChatbot());

    // Send message
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Auto-resize textarea
    this.input.addEventListener('input', () => this.autoResizeTextarea());

    // Minimize/close
    this.minimizeBtn.addEventListener('click', () => this.minimizeChatbot());
    this.closeBtn.addEventListener('click', () => this.closeChatbot());

    // Suggestion clicks
    this.suggestionsContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('chatbot-suggestion')) {
        const suggestion = e.target.getAttribute('data-suggestion');
        this.input.value = suggestion;
        this.sendMessage();
      }
    });

    // Topic card clicks
    this.topicCards.forEach(card => {
      card.addEventListener('click', () => {
        const topic = card.getAttribute('data-topic');
        this.handleTopicClick(topic);
      });
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeChatbot();
      }
    });
  }

  async initializeChatbot() {
    // Initialize database connection when available
    if (window.supabase) {
      await this.chatbot.initDatabase(window.supabase);
    }

    // Update suggestions periodically
    this.updateSuggestions();
  }

  toggleChatbot() {
    if (this.isOpen) {
      this.closeChatbot();
    } else {
      this.openChatbot();
    }
  }

  openChatbot() {
    this.isOpen = true;
    this.isMinimized = false;
    this.container.classList.add('open');
    this.container.classList.remove('closing');
    this.toggleBtn.classList.add('hidden');

    if (this.isWelcomeScreen) {
      this.showWelcomeScreen();
    } else {
      this.showChatInterface();
    }
  }

  showWelcomeScreen() {
    this.welcomeScreen.style.display = 'flex';
    // Center welcome screen content as requested
    this.welcomeScreen.style.alignItems = 'center';
    this.welcomeScreen.style.justifyContent = 'center';
    this.messagesContainer.style.display = 'none';
    this.inputArea.style.display = 'none';

    // Hide suggestions on welcome screen per user request
    if (this.suggestionsContainer) {
      this.suggestionsContainer.style.display = 'none';
    }
  }

  showChatInterface() {
    this.welcomeScreen.style.display = 'none';
    this.messagesContainer.style.display = 'flex';
    this.inputArea.style.display = 'flex';
    this.input.focus();
    this.scrollToBottom();

    // Hide suggestions when in chat mode
    this.suggestionsContainer.style.display = 'none';
  }

  handleTopicClick(topic) {
    this.isWelcomeScreen = false;
    this.showChatInterface();

    // Add welcome message based on topic
    const topicMessages = {
      education: "I'd love to help you with education! What specific topic would you like to learn about?",
      productivity: "Let's boost your productivity! What area would you like to improve?",
      health: "Health and wellness is so important! What aspect would you like to focus on?"
    };

    this.addMessage('assistant', topicMessages[topic] || "Great choice! How can I help you today?");
    this.updateSuggestions();
  }

  closeChatbot() {
    this.isOpen = false;
    this.isMinimized = false;

    // Add closing animation
    this.container.classList.add('closing');
    this.container.classList.remove('open');

    // Show toggle button after animation
    setTimeout(() => {
      this.toggleBtn.classList.remove('hidden');
      this.container.classList.remove('closing');
    }, 400); // Match the CSS transition duration
  }

  minimizeChatbot() {
    this.isMinimized = !this.isMinimized;
    if (this.isMinimized) {
      this.container.classList.add('minimized');
    } else {
      this.container.classList.remove('minimized');
    }
  }

  async sendMessage() {
    const message = this.input.value.trim();
    if (!message || this.isTyping) return;

    // Hide suggestions when user starts chatting
    this.suggestionsContainer.style.display = 'none';

    // Add user message to UI
    this.addMessage('user', message);
    this.input.value = '';
    this.autoResizeTextarea();
    this.scrollToBottom();

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Get context from current page
      const context = this.getPageContext();

      // Send to chatbot
      const response = await this.chatbot.chat(message, context);

      // Remove typing indicator
      this.hideTypingIndicator();

      // Add bot response to UI
      this.addMessage('assistant', response);
      this.scrollToBottom();

      // Update suggestions
      this.updateSuggestions();

    } catch (error) {
      console.error('Error sending message:', error);
      this.hideTypingIndicator();
      this.addMessage('assistant', "I'm sorry, I encountered an error. Please try again.");
    }
  }

  addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chatbot-message ${role}`;

    // Avatar removed per request: no avatar is rendered for assistant responses

    const contentDiv = document.createElement('div');
    contentDiv.className = 'chatbot-message-content';

    // Format content with links and formatting
    contentDiv.innerHTML = this.formatMessageContent(content);

    messageDiv.appendChild(contentDiv);

    this.messagesContainer.appendChild(messageDiv);
  }

  formatMessageContent(content) {
    // Format markdown-style links
    content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: var(--sachi-primary); text-decoration: underline;">$1</a>');

    // Format bold text
    content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Format code blocks
    content = content.replace(/`([^`]+)`/g, '<code style="background: var(--sachi-gray); padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>');

    // Format lists
    content = content.replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>');
    content = content.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');

    // Convert line breaks to paragraphs
    content = content.replace(/\n\n/g, '</p><p>');
    content = content.replace(/\n/g, '<br>');

    return `<p>${content}</p>`;
  }

  showTypingIndicator() {
    this.isTyping = true;
    this.sendBtn.disabled = true;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'chatbot-typing';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
      <span>Chatbot is thinking</span>
      <div class="chatbot-typing-dots">
        <div class="chatbot-typing-dot"></div>
        <div class="chatbot-typing-dot"></div>
        <div class="chatbot-typing-dot"></div>
      </div>
    `;

    this.messagesContainer.appendChild(typingDiv);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    this.isTyping = false;
    this.sendBtn.disabled = false;

    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  autoResizeTextarea() {
    this.input.style.height = 'auto';
    this.input.style.height = Math.min(this.input.scrollHeight, 100) + 'px';
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  getPageContext() {
    // Get current page context for better responses
    const context = {
      currentPage: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    // Add video context if on a video page
    const videoTitle = document.querySelector('.video-title');
    if (videoTitle) {
      context.currentVideo = {
        title: videoTitle.textContent,
        category: document.querySelector('.video-category')?.textContent || 'Unknown'
      };
    }

    // Add search context if search is active
    const searchInput = document.getElementById('search-input');
    if (searchInput && searchInput.value) {
      context.currentSearch = searchInput.value;
    }

    return context;
  }

  updateSuggestions() {
    // Get fresh suggestions from chatbot
    const generalSuggestions = this.chatbot.getGeneralSuggestions();
    const videoSuggestions = this.chatbot.getVideoSuggestions();

    // Mix and take first 4 suggestions
    const allSuggestions = [...generalSuggestions, ...videoSuggestions];
    const shuffled = allSuggestions.sort(() => 0.5 - Math.random());
    const selectedSuggestions = shuffled.slice(0, 4);

    // Update suggestion buttons
    this.suggestionsContainer.innerHTML = selectedSuggestions
      .map(suggestion => `
        <button class="chatbot-suggestion" data-suggestion="${suggestion}">
          ${suggestion.length > 25 ? suggestion.substring(0, 25) + '...' : suggestion}
        </button>
      `).join('');
  }

  // Public method to set database connection
  setDatabase(db) {
    this.db = db;
    this.chatbot.initDatabase(db);
  }

  // Public method to open chatbot with specific message
  openWithMessage(message) {
    this.openChatbot();
    this.input.value = message;
    this.input.focus();
  }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.chatbotUI = new ChatbotUI();

  // Set up database connection when available
  if (window.supabase) {
    window.chatbotUI.setDatabase(window.supabase);
  }
});

// Export for use in other modules
export default ChatbotUI;
