// Your Discord webhook URL
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Optional: Configure which log levels you want to send to Discord
const LOG_LEVELS_TO_DISCORD = ['error', 'warn', 'info']; // 'debug', 'log'

class DiscordLogger {
  constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };

    // Override console methods
    this.setupConsoleOverrides();
  }

  setupConsoleOverrides() {
    // Override each console method
    Object.keys(this.originalConsole).forEach((level) => {
      console[level] = (...args) => {
        // Call the original console method first
        this.originalConsole[level](...args);

        // Send to Discord if configured for this level
        if (LOG_LEVELS_TO_DISCORD.includes(level)) {
          this.sendToDiscord(level, args);
        }
      };
    });
  }

  async sendToDiscord(level, args) {
    if (!DISCORD_WEBHOOK_URL) {
      return;
    }

    try {
      // Format the message for Discord
      const message = this.formatMessage(level, args);

      // Send to Discord webhook using global fetch
      await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message.content,
          embeds: message.embeds,
        }),
      });
    } catch (error) {
      // Use original console to avoid infinite loops
      this.originalConsole.error('Failed to send log to Discord:', error);
    }
  }

  formatMessage(level, args) {
    // Get server information
    const environment = process.env.NODE_ENV || 'development';
    const serverName = process.env.SERVER_NAME || 'NextJS Server';

    // Format arguments into a string
    const messageContent = args.map(arg => {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';

      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return '[Circular Object]';
        }
      }
      return String(arg);
    }).join(' ');

    // Create color based on log level
    const colors = {
      error: 0xFF0000,  // Red
      warn: 0xFFA500,   // Orange
      info: 0x0000FF,   // Blue
      debug: 0x808080,  // Gray
      log: 0x008000,    // Green
    };

    // Format as Discord embed
    return {
      content: `**[${serverName}]** New ${level} log from ${environment}`,
      embeds: [{
        title: `${level.toUpperCase()} Log`,
        description: `\`\`\`\n${messageContent.substring(0, 4000)}\n\`\`\``,
        color: colors[level] || 0x000000,
        timestamp: new Date().toISOString(),
      }]
    };
  }
}

// Create singleton instance
let logger;

export function initLogger() {
  if (!logger && typeof window === 'undefined') {
    // Only initialize on the server side
    logger = new DiscordLogger();
    console.info('Discord logger initialized');
  }
  return logger;
}