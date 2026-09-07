import { useEffect, useRef, useState } from 'react'
import './App.css'
import { sendMessage } from './api/chatClient.js'

const LOGO_PATH = '/psclogo.png'
const SESSION_STORAGE_KEY = 'psc_chat_session_id'

const AGENT_PHOTO = '/AI_chatbotimage.jpg'

// Public Service Commission WhatsApp Business number, digits only
// (country code, no leading +). Configure via VITE_WHATSAPP_NUMBER.
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || ''
const WHATSAPP_PROMPT =
  'Hello, I would like to speak with a Public Service Commission agent.'

const initialMessages = [
  {
    id: 1,
    sender: 'bot',
    text: 'Hello! How can I help you today?',
    time: '10:30 AM',
  },
]

function getOrCreateSessionId() {
  const canGenerateUuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
  const generateId = canGenerateUuid
    ? () => crypto.randomUUID()
    : () => `${Date.now()}-${Math.random()}`

  if (typeof localStorage === 'undefined') {
    return generateId()
  }

  const existingId = localStorage.getItem(SESSION_STORAGE_KEY)
  if (existingId) {
    return existingId
  }

  const newId = generateId()
  localStorage.setItem(SESSION_STORAGE_KEY, newId)
  return newId
}

const SESSION_ID = getOrCreateSessionId()

function App() {
  const [isOpen, setIsOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('home')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState(initialMessages)
  const [isTyping, setIsTyping] = useState(false)

  const messagesEndRef = useRef(null)
  const lastMessage = messages[messages.length - 1]

  useEffect(() => {
    if (activeTab !== 'conversation') {
      return
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, isTyping, activeTab])

  function createMessageId() {
    if (
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function'
    ) {
      return crypto.randomUUID()
    }

    return `${Date.now()}-${Math.random()}`
  }

  function getCurrentTime() {
    return new Intl.DateTimeFormat('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date())
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const trimmedMessage = input.trim()

    if (!trimmedMessage) {
      return
    }

    const userMessage = {
      id: createMessageId(),
      sender: 'user',
      text: trimmedMessage,
      time: getCurrentTime(),
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
    ])

    setInput('')
    setIsTyping(true)

    try {
      const { reply } = await sendMessage(SESSION_ID, trimmedMessage)

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId(),
          sender: 'bot',
          text: reply,
          time: getCurrentTime(),
        },
      ])
    } catch (error) {
      console.error('Sending message failed:', error)

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId(),
          sender: 'bot',
          text: 'Sorry, something went wrong on our end. Please try again in a moment.',
          time: getCurrentTime(),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  function handleTalkToAgent() {
    if (!WHATSAPP_NUMBER) {
      window.alert(
        'The WhatsApp handoff number has not been configured yet.',
      )
      return
    }

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_PROMPT)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <main className="app">
      <div className="chatbot-container">
        {isOpen ? (
          <section
            className="chatbot-window"
            aria-label="Public Service Assistant"
          >
            <header className="chatbot-header">
              <div className="chatbot-brand">
                <div className="chatbot-logo-container">
                  <img
                    src={LOGO_PATH}
                    alt="Public Service Commission"
                    className="chatbot-logo"
                  />
                </div>

                <div className="chatbot-brand-text">
                  <h1>Public Service Assistant</h1>

                  <p className="chatbot-subtitle">
                    We are here to help you
                  </p>

                  <div className="chatbot-status">
                    <span className="status-dot" />
                    <span>Online</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={() => setIsOpen(false)}
                aria-label="Close chatbot"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </header>

            {activeTab === 'home' ? (
              <>
                {lastMessage && (
                  <button
                    type="button"
                    className="home-recent"
                    onClick={() => setActiveTab('conversation')}
                  >
                    <img
                      src={LOGO_PATH}
                      alt=""
                      className="home-recent-avatar"
                    />

                    <span className="home-recent-copy">
                      <strong>Public Service Assistant</strong>
                      <small>Get instant answers powered by Heidi</small>
                    </span>

                    <span className="home-recent-meta">
                      <span className="home-recent-time">
                        {lastMessage.time}
                      </span>

                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M21 11.5a8.4 8.4 0 0 1-8.4 8.4 8.3 8.3 0 0 1-3.83-.92L3 20.5l1.62-4.13a8.3 8.3 0 0 1-1.02-4.02A8.4 8.4 0 0 1 12 3.6a8.4 8.4 0 0 1 8.4 8.4Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </button>
                )}

                <div className="home-view">
                  <button
                    type="button"
                    className="home-card"
                    onClick={handleTalkToAgent}
                  >
                    <span className="home-card-icon home-card-icon--whatsapp">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M12 2a10 10 0 0 0-8.62 15.03L2 22l5.1-1.34A10 10 0 1 0 12 2Zm0 18.2a8.17 8.17 0 0 1-4.17-1.14l-.3-.18-3.03.8.81-2.95-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.13c-.24-.12-1.45-.72-1.68-.8-.22-.08-.39-.12-.55.12-.16.24-.63.8-.78.97-.14.16-.28.18-.53.06-.24-.12-1.02-.38-1.95-1.21-.72-.64-1.2-1.44-1.35-1.68-.14-.24-.02-.37.11-.5.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.02s.87 2.35.99 2.51c.12.16 1.71 2.62 4.15 3.67.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z"
                        />
                      </svg>
                    </span>

                    <span className="home-card-copy">
                      <strong>Chat with us</strong>
                      <small>Continue the conversation on WhatsApp</small>
                    </span>

                    <svg
                      className="home-card-arrow"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M9 6l6 6-6 6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {AGENT_PHOTO && (
                    <div className="home-photo">
                      <img src={AGENT_PHOTO} alt="Illustration of Heidi, the PSC AI assistant" />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div
                  className="chatbot-messages"
                  aria-live="polite"
                >
                  {messages.map((message) => (
                    <article
                      key={message.id}
                      className={`message-row message-row--${message.sender}`}
                    >
                      {message.sender === 'bot' && (
                        <img
                          src={LOGO_PATH}
                          alt=""
                          className="message-avatar"
                        />
                      )}

                      <div className="message-content">
                        <div
                          className={`message-bubble message-bubble--${message.sender}`}
                        >
                          {message.text}
                        </div>

                        <div
                          className={`message-meta message-meta--${message.sender}`}
                        >
                          <span>{message.time}</span>

                          {message.sender === 'user' && (
                            <span
                              className="message-checks"
                              aria-label="Message delivered"
                            >
                              ✓✓
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}

                  {isTyping && (
                    <article className="message-row message-row--bot">
                      <img
                        src={LOGO_PATH}
                        alt=""
                        className="message-avatar"
                      />

                      <div
                        className="typing-indicator"
                        aria-label="PSC is typing"
                      >
                        <span />
                        <span />
                        <span />
                      </div>
                    </article>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <form
                  className="chatbot-form"
                  onSubmit={handleSubmit}
                >
                  <div className="message-input-wrap">
                    <input
                      className="message-input"
                      type="text"
                      value={input}
                      onChange={(event) =>
                        setInput(event.target.value)
                      }
                      placeholder="Write a message"
                      aria-label="Type your message"
                      autoComplete="off"
                    />

                    <button
                      type="submit"
                      className="send-button"
                      disabled={isTyping}
                      aria-label="Send message"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M22 2 11 13"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />

                        <path
                          d="m22 2-7 20-4-9-9-4Z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  </div>

                  <p className="privacy-note">
                    By chatting, you agree to our{' '}
                    <strong>privacy policy</strong>.
                  </p>
                </form>
              </>
            )}

            <nav className="tab-bar">
              <button
                type="button"
                className={`tab-button${activeTab === 'home' ? ' tab-button--active' : ''}`}
                onClick={() => setActiveTab('home')}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M3 11.5 12 4l9 7.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Home</span>
              </button>

              <button
                type="button"
                className={`tab-button${activeTab === 'conversation' ? ' tab-button--active' : ''}`}
                onClick={() => setActiveTab('conversation')}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M21 11.5a8.4 8.4 0 0 1-8.4 8.4 8.3 8.3 0 0 1-3.83-.92L3 20.5l1.62-4.13a8.3 8.3 0 0 1-1.02-4.02A8.4 8.4 0 0 1 12 3.6a8.4 8.4 0 0 1 8.4 8.4Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Conversation</span>
              </button>
            </nav>
          </section>
        ) : (
          <button
            type="button"
            className="chatbot-launcher"
            onClick={() => setIsOpen(true)}
            aria-label="Open Public Service Assistant"
          >
            <span className="launcher-logo-wrap">
              <img
                src={LOGO_PATH}
                alt=""
                className="launcher-logo"
              />
            </span>

            <span className="launcher-copy">
              <strong>Let&apos;s Chat!</strong>
            </span>
          </button>
        )}
      </div>
    </main>
  )
}

export default App