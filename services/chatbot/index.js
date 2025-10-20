// SachiDev - General Purpose Chatbot with Video Database Integration
// Features: Database access, Internet search, General knowledge, Video recommendations

class SachiDevChatbot {
  constructor() {
    this.apiKey = 'AIzaSyBa32nw_x0mjmno4IN4RqTn1A2DQeD_4GE';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
    this.conversationHistory = [];
    this.isTyping = false;
    this.db = null; // Will be initialized with database connection
  }

  // Initialize database connection
  async initDatabase(supabaseClient) {
    this.db = supabaseClient;
  }

  // Main chat function
  async chat(message, context = {}) {
    try {
      this.isTyping = true;

      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      // Determine if we need to search the database or internet
      const needsDatabaseSearch = this.shouldSearchDatabase(message);
      const needsInternetSearch = this.shouldSearchInternet(message);

      let contextData = '';

      // Search database if needed
      if (needsDatabaseSearch && this.db) {
        const dbResults = await this.searchDatabase(message);
        contextData += `\n\nDatabase Context:\n${dbResults}`;
      }

      // Search internet if needed
      if (needsInternetSearch) {
        const internetResults = await this.searchInternet(message);
        contextData += `\n\nInternet Context:\n${internetResults}`;
      }

      // Generate response using Gemini
      const response = await this.generateResponse(message, contextData, context);

      // Add bot response to history
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

  // Determine if we should search the database
  shouldSearchDatabase(message) {
    const dbKeywords = [
      'video', 'videos', 'course', 'tutorial', 'lesson', 'learn', 'education',
      'show', 'find', 'search', 'recommend', 'suggest', 'watch', 'view',
      'programming', 'code', 'javascript', 'python', 'react', 'node', 'web',
      'math', 'mathematics', 'algebra', 'calculus', 'geometry', 'statistics',
      'science', 'physics', 'chemistry', 'biology', 'history', 'language',
      'saved', 'bookmark', 'favorite', 'popular', 'trending', 'new'
    ];

    return dbKeywords.some(keyword =>
      message.toLowerCase().includes(keyword)
    );
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

  // Determine if we should search the internet
  shouldSearchInternet(message) {
    const internetKeywords = [
      'latest', 'recent', 'news', 'update', 'current', 'today', 'now',
      'what is', 'how to', 'explain', 'definition', 'meaning',
      'formula', 'equation', 'theorem', 'proof', 'example'
    ];

    return internetKeywords.some(keyword =>
      message.toLowerCase().includes(keyword)
    );
  }

  // Search database for relevant or computed results
  async searchDatabase(query) {
    try {
      if (!this.db) return '';

      const q = String(query || '').toLowerCase();

      // Helper to format a video entry
      const fmt = (video, idx) => {
        const link = video.youtube_link || video.youtubeLink || video.video_url || video.videoUrl || '#';
        const title = video.title || 'Untitled';
        const cat = video.category || 'Unknown';
        const dur = video.duration || video.duration_text || '0:00';
        const views = typeof video.views === 'number' ? video.views : parseInt(video.views, 10) || 0;
        const ratingVal = typeof video.rating === 'number' ? video.rating : parseFloat(video.rating) || null;
        const rating = ratingVal != null ? ratingVal.toFixed(1) : 'N/A';
        const desc = (video.description || '').substring(0, 140);
        return `**${idx}. [${title}](${link})**\n📚 Category: ${cat}  ⏱️ ${dur}  👀 ${views}  ⭐ ${rating}\n📝 ${desc}...`;
      };

      // 1) Handle meta queries that require computation
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

      // Utility to fetch a reasonable set of rows for computation
      const fetchAllForCompute = async () => {
        const sel = 'id,title,description,category,views,rating,duration,youtube_link,video_url,thumbnail,upload_date';
        const { data, error } = await this.db.from('EduVideoDB').select(sel).limit(500);
        if (error) throw error;
        return data || [];
      };

      if (asksLongest || asksShortest) {
        const rows = await fetchAllForCompute();
        if (!rows.length) return 'No videos found in our database.';
        const sorted = rows
          .map(v => ({ ...v, __dur: this.parseDurationToSeconds(v.duration) }))
          .sort((a, b) => (asksLongest ? b.__dur - a.__dur : a.__dur - b.__dur));
        const top = sorted.slice(0, 3);
        const header = asksLongest ? '📏 Longest Videos' : '⏱️ Shortest Videos';
        let out = `${header} (based on duration):\n\n`;
        top.forEach((v, i) => { out += fmt(v, i + 1) + '\n\n'; });
        return out.trim();
      }

      if (asksMostViewed) {
        const { data, error } = await this.db
          .from('EduVideoDB')
          .select('*')
          .order('views', { ascending: false })
          .limit(5);
        if (error) throw error;
        if (!data || !data.length) return 'No videos found in our database.';
        let out = '🔥 Most Viewed Videos:\n\n';
        data.forEach((v, i) => { out += fmt(v, i + 1) + '\n\n'; });
        return out.trim();
      }

      if (asksHighestRated) {
        const { data, error } = await this.db
          .from('EduVideoDB')
          .select('*')
          .order('rating', { ascending: false, nullsFirst: false })
          .limit(5);
        if (error) throw error;
        if (!data || !data.length) return 'No videos found in our database.';
        let out = '⭐ Highest Rated Videos:\n\n';
        data.forEach((v, i) => { out += fmt(v, i + 1) + '\n\n'; });
        return out.trim();
      }

      if (asksNewest || asksOldest) {
        const { data, error } = await this.db
          .from('EduVideoDB')
          .select('*')
          .order('upload_date', { ascending: asksNewest ? false : true })
          .limit(5);
        if (error) throw error;
        if (!data || !data.length) return 'No videos found in our database.';
        let out = `${asksNewest ? '🆕 Newest' : '📼 Oldest'} Videos:\n\n`;
        data.forEach((v, i) => { out += fmt(v, i + 1) + '\n\n'; });
        return out.trim();
      }

      // 2) Text search across multiple tokens and columns
      const tokens = q
        .split(/\s+/)
        .map(t => t.trim())
        .filter(t => t.length > 1 && !['which', 'what', 'do', 'you', 'have', 'the', 'a', 'an', 'is', 'of', 'for', 'to'].includes(t));

      let orExpr = '';
      if (tokens.length) {
        const parts = [];
        tokens.forEach((t) => {
          parts.push(`title.ilike.%${t}%`);
          parts.push(`description.ilike.%${t}%`);
          parts.push(`category.ilike.%${t}%`);
        });
        orExpr = parts.join(',');
      }

      let queryBuilder = this.db.from('EduVideoDB').select('*').limit(8);
      if (orExpr) queryBuilder = queryBuilder.or(orExpr);
      const { data, error } = await queryBuilder;
      if (error) throw error;

      if (!data || data.length === 0) {
        // Fallback: show top viewed if no text match
        const { data: top, error: err2 } = await this.db
          .from('EduVideoDB')
          .select('*')
          .order('views', { ascending: false })
          .limit(5);
        if (err2) throw err2;
        if (!top || !top.length) return 'No videos found in our database.';
        let out = '🎥 No direct matches. Here are popular videos instead:\n\n';
        top.forEach((v, i) => { out += fmt(v, i + 1) + '\n\n'; });
        return out.trim();
      }

      let results = '🎥 Relevant Videos from Our Database:\n\n';
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
      // For now, we'll simulate internet search with math-related responses
      // In a real implementation, you would use a search API like Google Custom Search
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
      } else {
        throw new Error('Invalid response format from API');
      }

    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  // Get conversation history
  getHistory() {
    return this.conversationHistory;
  }

  // Clear conversation history
  clearHistory() {
    this.conversationHistory = [];
  }

  // Check if bot is currently typing
  isCurrentlyTyping() {
    return this.isTyping;
  }

  // Get general knowledge suggestions
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

  // Get video-related suggestions
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

// Export the chatbot class
export default SachiDevChatbot;
