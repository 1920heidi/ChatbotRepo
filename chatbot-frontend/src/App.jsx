import { useEffect, useRef, useState } from 'react'
import './App.css'

const LOGO_PATH = '/psclogo.png'

const initialMessages = [
  {
    id: 1,
    sender: 'bot',
    text: 'Hello! How can I help you today?',
    time: '10:30 AM',
  },
]

function App() {
  const [isOpen, setIsOpen] = useState(true)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState(initialMessages)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isTyping, setIsTyping] = useState(false)

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, isTyping])

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

  function getBotReply(message) {
    const normalizedMessage = message.toLowerCase()

    if (
      normalizedMessage.includes('job') ||
      normalizedMessage.includes('vacancy') ||
      normalizedMessage.includes('apply')
    ) {
      return 'Please visit the PSC recruitment portal for current vacancies and application guidelines.'
    }

    if (
      normalizedMessage.includes('contact') ||
      normalizedMessage.includes('phone') ||
      normalizedMessage.includes('email')
    ) {
      return 'You can find the Commission’s official contact details in the Contact Us section of the PSC website.'
    }

    if (
      normalizedMessage.includes('tender') ||
      normalizedMessage.includes('procurement')
    ) {
      return 'Please visit the Tenders section of the PSC website for current procurement opportunities and notices.'
    }

    return 'Thank you. I have received your message. How else may I assist you?'
  }

  function handleSubmit(event) {
    event.preventDefault()

    const trimmedMessage = input.trim()

    if (!trimmedMessage && !selectedFile) {
      return
    }

    const submittedFile = selectedFile

    const messageText = submittedFile
      ? `${trimmedMessage || 'Please review this attachment.'}\nAttached: ${submittedFile.name}`
      : trimmedMessage

    const userMessage = {
      id: createMessageId(),
      sender: 'user',
      text: messageText,
      time: getCurrentTime(),
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
    ])

    setInput('')
    setSelectedFile(null)
    setIsTyping(true)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    window.setTimeout(() => {
      const botMessage = {
        id: createMessageId(),
        sender: 'bot',
        text: submittedFile
          ? 'The attachment has been received. File analysis will be enabled after the chatbot is connected to the backend document-processing service.'
          : getBotReply(trimmedMessage),
        time: getCurrentTime(),
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        botMessage,
      ])

      setIsTyping(false)
    }, 900)
  }

  function handleAttachmentClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const maximumSize = 10 * 1024 * 1024

    if (file.size > maximumSize) {
      window.alert('Please select a file smaller than 10 MB.')
      event.target.value = ''
      return
    }

    setSelectedFile(file)
  }

  function removeSelectedFile() {
    setSelectedFile(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
                ×
              </button>
            </header>

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

            {selectedFile && (
              <div className="selected-file">
                <span>{selectedFile.name}</span>

                <button
                  type="button"
                  onClick={removeSelectedFile}
                  aria-label="Remove attachment"
                >
                  ×
                </button>
              </div>
            )}

            <form
              className="chatbot-form"
              onSubmit={handleSubmit}
            >
              <input
                ref={fileInputRef}
                className="hidden-file-input"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              />

              <button
                type="button"
                className="attachment-button"
                onClick={handleAttachmentClick}
                aria-label="Attach a file"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M21.4 11.6 12 21a6 6 0 0 1-8.5-8.5l10-10a4 4 0 0 1 5.7 5.7L9.9 17.5a2 2 0 0 1-2.8-2.8l8.6-8.6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <input
                className="message-input"
                type="text"
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                placeholder="Type your message..."
                aria-label="Type your message"
                autoComplete="off"
              />

              <button
                type="submit"
                className="send-button"
                disabled={isTyping}
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

                <span>Send</span>
              </button>
            </form>

            <footer className="chatbot-footer">
              <span>A VALUES-DRIVEN</span>
              <span className="footer-dot">•</span>
              <span>CITIZEN-CENTRIC</span>
              <span className="footer-dot">•</span>
              <span>EXCELLENCE</span>
            </footer>
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