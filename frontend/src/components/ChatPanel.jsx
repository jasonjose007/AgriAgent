import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { T } from '../translations'

export default function ChatPanel({ messages, onSend, isLoading, lang }) {
  const t = T[lang]
  const [input, setInput] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const bottomRef = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text && !imageFile) return
    onSend(text || 'Please analyze this crop image.', imageFile)
    setInput('')
    clearImage()
  }

  const handleSuggestion = (text) => {
    if (isLoading) return
    onSend(text, null)
  }

  const showWelcome = messages.length === 0

  return (
    <div className="w-[55%] flex flex-col border-r border-paddy-light/40">
      <div className="px-4 py-2.5 border-b border-paddy-light/30">
        <h2 className="font-display font-semibold text-paddy-dark text-sm">
          {t.chatTitle}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto chat-scroll px-4 py-4 space-y-4">
        {showWelcome && (
          <div className="space-y-4">
            <div className="max-w-lg bg-white rounded-lg rounded-tl-none px-4 py-3 border border-paddy-light/40">
              <p className="text-sm leading-relaxed text-ink">{t.welcome}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[t.suggestScheme, t.suggestPrice, t.suggestMulti, t.suggestDisease].map(
                (suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(suggestion)}
                    className="text-left text-xs px-3 py-2 bg-paddy-light/40 border border-paddy/15 rounded-lg text-paddy-dark hover:bg-paddy-light transition-colors max-w-xs leading-snug"
                  >
                    {suggestion}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-lg px-4 py-3 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-paddy text-white rounded-tr-none'
                  : 'bg-white border border-paddy-light/40 rounded-tl-none'
              }`}
            >
              {msg.image && (
                <img
                  src={msg.image}
                  alt="Uploaded crop"
                  className="w-48 rounded mb-2"
                />
              )}
              {msg.role === 'agent' ? (
                <div className="agent-markdown">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="leading-relaxed">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-paddy-light/40 rounded-lg rounded-tl-none px-4 py-3 flex items-center gap-1.5">
              <span className="typing-dot w-2 h-2 bg-paddy/50 rounded-full inline-block" />
              <span className="typing-dot w-2 h-2 bg-paddy/50 rounded-full inline-block" />
              <span className="typing-dot w-2 h-2 bg-paddy/50 rounded-full inline-block" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-paddy-light/30 bg-white/50">
        {imagePreview && (
          <div className="mb-2 flex items-center gap-2">
            <img src={imagePreview} alt="Preview" className="h-14 rounded border border-paddy-light" />
            <button
              type="button"
              onClick={clearImage}
              className="text-xs text-laterite hover:underline"
            >
              Remove
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="p-2 text-ink-muted hover:text-paddy transition-colors rounded-md hover:bg-paddy-light/40"
            title={t.uploadPhoto}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.placeholder}
            disabled={isLoading}
            className="flex-1 px-3 py-2 text-sm border border-paddy-light/50 rounded-lg bg-white focus:outline-none focus:border-paddy/50 focus:ring-1 focus:ring-paddy/20 disabled:opacity-50 placeholder:text-ink-muted/60"
          />
          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !imageFile)}
            className="px-4 py-2 text-sm font-medium bg-paddy text-white rounded-lg hover:bg-paddy-mid transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t.send}
          </button>
        </div>
      </form>
    </div>
  )
}
