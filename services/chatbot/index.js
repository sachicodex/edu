// SachiDev - General Purpose Chatbot with Video Database Integration
// Features: Database access, Internet search, General knowledge, Video recommendations
import { collection, getDocs, limit, query as fsQuery } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

class SachiDevChatbot {
  constructor() {
    this.apiKey = 'AIzaSyBa32nw_x0mjmno4IN4RqTn1A2DQeD_4GE';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
    this.conversationHistory = [];
    this.isTyping = false;
    this.db = null; // Firestore instance
  }

  // Initialize database connection
  async initDatabase(firestoreDb) {
    this.db = firestoreDb;
  }

  // Main chat function
  async chat(message, context = {}) {
    try {
      this.isTyping = true;

      this.conversationHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      const needsDatabaseSearch = this.shouldSearchDatabase(message);
      const needsInternetSearch = this.shouldSearchInternet(message);

      let contextData = '';

      if (needsDatabaseSearch && this.db) {
        const dbResults = await this.searchDatabase(message);
        contextData += `\n\nDatabase Context:\n${dbResults}`;
      }

      if (needsInternetSearch) {
        const internetResults = await this.searchInternet(message);
        contextData += `\n\nInternet Context:\n${internetResults}`;
      }

      const response = await this.generateResponse(message, contextData, context);

      this.conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date()
      });

      this.isTyping = false;
      return response;
    } catch (error) {
      console.error('Chatbot error:', error);
      this.isTyping = false;
      return "I'm sorry, I encountered an error. Please try again or rephrase your question.";
    }
  }

  shouldSearchDatabase(message) {
    const dbKeywords = [
      'video', 'videos', 'course', 'tutorial', 'lesson', 'learn', 'education',
      'show', 'find', 'search', 'recommend', 'suggest', 'watch', 'view',
      'programming', 'code', 'javascript', 'python', 'react', 'node', 'web',
      'math', 'mathematics', 'algebra', 'calculus', 'geometry', 'statistics',
      'science', 'physics', 'chemistry', 'biology', 'history', 'language',
      'saved', 'bookmark', 'favorite', 'popular', 'trending', 'new'
    ];

    return dbKeywords.some((keyword) => message.toLowerCase().includes(keyword));
  }

  // Utility: parse duration "HH:MM:SS" or "MM:SS" into seconds
  parseDurationToSeconds(d) {
    try {
      if (d == null) return 0;
      if (typeof d === 'number') return d;
      const parts = String(d).split(':').map((n) => parseInt(n, 10) || 0);
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      return 0;
    } catch (_) {
      return 0;
    }
  }

  parseUploadDate(v) {
    if (!v) return 0;
    if (typeof v?.toDate === 'function') return v.toDate().getTime();
    const t = new Date(v).getTime();
    return Number.isNaN(t) ? 0 : t;
  }

  normalizeVideo(row) {
    return {
      id: row.id || '',
      title: row.title || 'Untitled',
      description: row.description || '',
      category: row.category || 'Unknown',
      duration: row.duration || row.duration_text || '0:00',
      views: typeof row.views === 'number' ? row.views : parseInt(row.views, 10) || 0,
      rating: typeof row.rating === 'number' ? row.rating : parseFloat(row.rating) || null,
      youtube_link: row.youtube_link || row.youtubeLink || null,
      video_url: row.video_url || row.videoUrl || null,
      upload_date: row.upload_date || null,
    };
  }

  shouldSearchInternet(message) {
    const internetKeywords = [
      'latest', 'recent', 'news', 'update', 'current', 'today', 'now',
      'what is', 'how to', 'explain', 'definition', 'meaning',
      'formula', 'equation', 'theorem', 'proof', 'example'
    ];

    return internetKeywords.some((keyword) => message.toLowerCase().includes(keyword));
  }

  async fetchVideos(limitCount = 500) {
    const snap = await getDocs(fsQuery(collection(this.db, 'EduVideoDB'), limit(limitCount)));
    return snap.docs.map((doc) => this.normalizeVideo({ id: doc.id, ...doc.data() }));
  }

  async searchDatabase(query) {
    try {
      if (!this.db) return '';

      const q = String(query || '').toLowerCase();
      const rows = await this.fetchVideos(500);

      const fmt = (video, idx) => {
        const link = video.youtube_link || video.video_url || '#';
        const title = video.title || 'Untitled';
        const cat = video.category || 'Unknown';
        const dur = video.duration || '0:00';
        const views = typeof video.views === 'number' ? video.views : parseInt(video.views, 10) || 0;
        const ratingVal = typeof video.rating === 'number' ? video.rating : parseFloat(video.rating) || null;
        const rating = ratingVal != null ? ratingVal.toFixed(1) : 'N/A';
        const desc = (video.description || '').substring(0, 140);
        return `**${idx}. [${title}](${link})**\nCategory: ${cat}  Duration: ${dur}  Views: ${views}  Rating: ${rating}\n${desc}...`;
      };

      const asksLongest = (q.includes('longest') && q.includes('video')) ||
        (q.includes('longest') && q.includes('duration')) ||
        (q.includes('max') && q.includes('duration')) ||
        (q.includes('duration') && (q.includes('long') || q.includes('longer')));

      const asksShortest = (q.includes('shortest') && q.includes('video')) ||
        (q.includes('shortest') && q.includes('duration')) ||
        (q.includes('duration') && q.includes('short'));

      const asksMostViewed = q.includes('most viewed') || (q.includes('most') && q.includes('view'));
      const asksHighestRated = q.includes('highest rated') || q.includes('top rated') || (q.includes('best') && q.includes('rating'));
      const asksNewest = q.includes('newest') || q.includes('latest') || q.includes('recent');
      const asksOldest = q.includes('oldest');

      if (asksLongest || asksShortest) {
        if (!rows.length) return 'No videos found in our database.';
        const sorted = rows
          .map((v) => ({ ...v, __dur: this.parseDurationToSeconds(v.duration) }))
          .sort((a, b) => (asksLongest ? b.__dur - a.__dur : a.__dur - b.__dur));
        const top = sorted.slice(0, 3);
        const header = asksLongest ? 'Longest Videos' : 'Shortest Videos';
        let out = `${header} (based on duration):\n\n`;
        top.forEach((v, i) => { out += fmt(v, i + 1) + '\n\n'; });
        return out.trim();
      }

      if (asksMostViewed) {
        const data = rows.slice().sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
        if (!data.length) return 'No videos found in our database.';
        let out = 'Most Viewed Videos:\n\n';
        data.forEach((v, i) => { out += fmt(v, i + 1) + '\n\n'; });
        return out.trim();
      }

      if (asksHighestRated) {
        const data = rows.slice().sort((a, b) => (b.rating ?? -Infinity) - (a.rating ?? -Infinity)).slice(0, 5);
        if (!data.length) return 'No videos found in our database.';
        let out = 'Highest Rated Videos:\n\n';
        data.forEach((v, i) => { out += fmt(v, i + 1) + '\n\n'; });
        return out.trim();
      }

      if (asksNewest || asksOldest) {
        const data = rows.slice().sort((a, b) => {
          const delta = this.parseUploadDate(a.upload_date) - this.parseUploadDate(b.upload_date);
          return asksNewest ? -delta : delta;
        }).slice(0, 5);
        if (!data.length) return 'No videos found in our database.';
        let out = `${asksNewest ? 'Newest' : 'Oldest'} Videos:\n\n`;
        data.forEach((v, i) => { out += fmt(v, i + 1) + '\n\n'; });
        return out.trim();
      }

      const tokens = q
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 1 && !['which', 'what', 'do', 'you', 'have', 'the', 'a', 'an', 'is', 'of', 'for', 'to'].includes(t));

      const data = rows
        .filter((row) => {
          if (!tokens.length) return true;
          const haystack = `${row.title} ${row.description} ${row.category}`.toLowerCase();
          return tokens.some((t) => haystack.includes(t));
        })
        .slice(0, 8);

      if (!data.length) {
        const top = rows.slice().sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
        if (!top.length) return 'No videos found in our database.';
        let out = 'No direct matches. Here are popular videos instead:\n\n';
        top.forEach((v, i) => { out += fmt(v, i + 1) + '\n\n'; });
        return out.trim();
      }

      let results = 'Relevant Videos from Our Database:\n\n';
      data.forEach((video, index) => {
        results += fmt(video, index + 1) + '\n\n';
      });
      return results.trim();
    } catch (error) {
      console.error('Database search error:', error);
      return 'Error searching database.';
    }
  }

  // Search internet for current information
  async searchInternet(query) {
    try {
      const mathTopics = {
        'algebra': 'Algebra is a branch of mathematics dealing with symbols and the rules for manipulating these symbols.',
        'calculus': 'Calculus is the mathematical study of continuous change, in the same way that geometry is the study of shape.',
        'geometry': 'Geometry is a branch of mathematics concerned with questions of shape, size, relative position of figures, and the properties of space.',
        'statistics': 'Statistics is the discipline that concerns the collection, organization, analysis, interpretation, and presentation of data.',
        'trigonometry': 'Trigonometry is a branch of mathematics that studies relationships between side lengths and angles of triangles.'
      };

      const lowerQuery = query.toLowerCase();
      for (const [topic, description] of Object.entries(mathTopics)) {
        if (lowerQuery.includes(topic)) {
          return `Current information about ${topic}: ${description}`;
        }
      }

      return 'No specific current information found, but I can help with general math concepts.';
    } catch (error) {
      console.error('Internet search error:', error);
      return 'Error searching internet.';
    }
  }

  // Generate response using Gemini API
  async generateResponse(message, contextData, userContext) {
    try {
      const systemPrompt = `You are SachiDev, a helpful and knowledgeable AI assistant for an educational video platform. 

Your personality:
- Friendly, professional, and approachable
- Enthusiastic about learning and education
- Helpful and resourceful
- Clear and concise in explanations
- Encouraging and supportive

Your capabilities:
- Answer any general knowledge questions (like ChatGPT)
- Help users find relevant educational videos
- Provide explanations on any topic
- Suggest learning resources and strategies
- Help with homework, projects, and assignments
- Answer questions about technology, science, arts, business, etc.
- Provide step-by-step solutions to problems

When users ask about videos or learning content:
- Always search the database first if relevant
- Provide direct links to videos when available
- Suggest multiple relevant videos
- Include video details like duration, rating, and description

Always maintain a helpful, professional tone. If you reference videos, make sure to provide clickable links and relevant details.

${contextData ? `Additional Context: ${contextData}` : ''}

Current conversation history:
${this.conversationHistory.slice(-6).map(msg => `${msg.role}: ${msg.content}`).join('\n')}`;

      const requestBody = {
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nUser: ${message}\n\nSachiDev:`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      }
      throw new Error('Invalid response format from API');
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  getHistory() {
    return this.conversationHistory;
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  isCurrentlyTyping() {
    return this.isTyping;
  }

  getGeneralSuggestions() {
    return [
      "What is artificial intelligence?",
      "How does photosynthesis work?",
      "Explain quantum computing",
      "What are the benefits of exercise?",
      "How to learn programming?",
      "What is climate change?",
      "Explain machine learning",
      "How to improve productivity?",
      "What is blockchain technology?",
      "How to manage stress?"
    ];
  }

  getVideoSuggestions() {
    return [
      "Show me programming tutorials",
      "Find math videos for beginners",
      "Recommend science documentaries",
      "What coding courses do you have?",
      "Show me business videos",
      "Find language learning content",
      "What's trending in education?",
      "Show me technology videos",
      "Find history documentaries",
      "Recommend skill development videos"
    ];
  }
}

export default SachiDevChatbot;
