import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { T } from '../translations'

export default function ChatPanel({ messages, onSend, isLoading, lang }) {
  const t = T[lang]
  const [input, setInput] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('')
  const bottomRef = useRef(null)
  const fileRef = useRef(null)
  const recognitionRef = useRef(null)
  const autoStopTimer = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const stopListening = useCallback(() => {
    if (autoStopTimer.current) clearTimeout(autoStopTimer.current)
    try { recognitionRef.current?.stop() } catch {}
    setIsListening(false)
  }, [])

  const toggleVoice = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setVoiceStatus('Voice not supported. Use Chrome browser.')
      return
    }

    if (isListening) {
      stopListening()
      setVoiceStatus('')
      return
    }

    // Create fresh instance each time to avoid stale state
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = lang === 'ta' ? 'ta-IN' : 'en-IN'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setVoiceStatus(lang === 'ta' ? 'கேட்கிறேன்...' : 'Listening...')
    }

    recognition.onresult = (event) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setInput(transcript)
      setVoiceStatus(lang === 'ta' ? 'கேட்கிறேன்... பேசுங்கள்' : 'Listening... keep speaking')
    }

    recognition.onend = () => {
      setIsListening(false)
      setVoiceStatus('')
      if (autoStopTimer.current) clearTimeout(autoStopTimer.current)
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      if (autoStopTimer.current) clearTimeout(autoStopTimer.current)
      const errMap = {
        'not-allowed': 'Mic blocked. Click the lock icon in the address bar and allow microphone.',
        'no-speech': 'No speech heard. Tap the mic and speak clearly.',
        'audio-capture': 'No microphone found. Check your device.',
        'network': 'Network error. Check your connection.',
        'aborted': '',
      }
      setVoiceStatus(errMap[event.error] || `Mic error: ${event.error}`)
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
      // Auto-stop after 15 seconds
      autoStopTimer.current = setTimeout(() => {
        stopListening()
        setVoiceStatus('Auto-stopped after 15s. Tap mic to continue.')
      }, 15000)
    } catch (e) {
      setVoiceStatus(`Could not start mic: ${e.message}`)
    }
  }, [isListening, lang, stopListening])

  const speakResponse = useCallback((text) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const clean = text.replace(/[#*_`\-|>]/g, '').replace(/\n+/g, '. ').slice(0, 800)
    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN'
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }, [lang])

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const clearImage = () => {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text && !imageFile) return
    stopListening()
    onSend(text || 'Please analyze this crop image.', imageFile)
    setInput('')
    clearImage()
    setVoiceStatus('')
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
                <img src={msg.image} alt="Uploaded crop" className="w-48 rounded mb-2" />
              )}
              {msg.role === 'agent' ? (
                <div className="agent-markdown">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  <button
                    onClick={() => speakResponse(msg.content)}
                    className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted hover:text-paddy transition-colors"
                    title="Read aloud"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 010 7.07" />
                      <path d="M19.07 4.93a10 10 0 010 14.14" />
                    </svg>
                    {t.readAloud}
                  </button>
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
        {voiceStatus && (
          <p className={`text-xs rounded-lg px-3 py-1.5 mb-2 ${
            voiceStatus.includes('Listening') || voiceStatus.includes('கேட்கிறேன்')
              ? 'text-paddy bg-paddy-light/40 animate-pulse'
              : 'text-laterite bg-laterite-light/50'
          }`}>{voiceStatus}</p>
        )}
        {imagePreview && (
          <div className="mb-2 flex items-center gap-2">
            <img src={imagePreview} alt="Preview" className="h-14 rounded border border-paddy-light" />
            <button type="button" onClick={clearImage} className="text-xs text-laterite hover:underline">
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
          <button
            type="button"
            onClick={toggleVoice}
            className={`p-2 rounded-md transition-colors ${
              isListening
                ? 'bg-laterite/15 text-laterite animate-pulse'
                : 'text-ink-muted hover:text-paddy hover:bg-paddy-light/40'
            }`}
            title={isListening ? t.stopListening : t.voiceInput}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
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
            placeholder={isListening ? (lang === 'ta' ? 'பேசுங்கள்...' : 'Speak now...') : t.placeholder}
            disabled={isLoading}
            className={`flex-1 px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-1 disabled:opacity-50 placeholder:text-ink-muted/60 ${
              isListening
                ? 'border-laterite/50 bg-laterite/5 focus:border-laterite/50 focus:ring-laterite/20'
                : 'border-paddy-light/50 focus:border-paddy/50 focus:ring-paddy/20'
            }`}
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
