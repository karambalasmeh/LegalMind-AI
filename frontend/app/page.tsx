"use client"

import { useState, useRef, useEffect } from "react"
import axios from "axios"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Send, Scale, BookOpen, User, Sparkles, Loader2, Gavel, Network, List, Plus, MessageSquare, Trash2 } from "lucide-react"
import LegalGraph from "@/components/LegalGraph"

type Source = {
  id: string
  title: string
  text: string
  score: number
}

type Message = {
  role: "user" | "assistant"
  content: string
}

type ChatSession = {
  id: string
  title: string
  messages: Message[]
  sources: Source[]
  createdAt: number
}

const STORAGE_KEY = "legalmind_chat_sessions"

export default function Dashboard() {
  const [query, setQuery] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)

  const [viewMode, setViewMode] = useState<"list" | "graph">("list")

  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  const scrollViewportRef = useRef<HTMLDivElement>(null)

  const [leftSidebarWidth, setLeftSidebarWidth] = useState(256)
  const [rightSidebarWidth, setRightSidebarWidth] = useState(384)
  const [isResizingLeft, setIsResizingLeft] = useState(false)
  const [isResizingRight, setIsResizingRight] = useState(false)

  const LEFT_MIN = 200
  const LEFT_MAX = 400
  const RIGHT_MIN = 280
  const RIGHT_MAX = 600

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = Math.min(LEFT_MAX, Math.max(LEFT_MIN, e.clientX))
        setLeftSidebarWidth(newWidth)
      }
      if (isResizingRight) {
        const newWidth = Math.min(RIGHT_MAX, Math.max(RIGHT_MIN, window.innerWidth - e.clientX))
        setRightSidebarWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizingLeft(false)
      setIsResizingRight(false)
    }

    if (isResizingLeft || isResizingRight) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isResizingLeft, isResizingRight])


  const scrollToBottom = () => {
    if (scrollViewportRef.current) {
      const viewport = scrollViewportRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const sessions: ChatSession[] = JSON.parse(stored)
        setChatSessions(sessions)
        if (sessions.length > 0) {
          const mostRecent = sessions[0]
          setActiveChatId(mostRecent.id)
          setMessages(mostRecent.messages)
          setSources(mostRecent.sources || [])
        }
      } catch (e) {
        console.error("Failed to parse chat sessions", e)
      }
    }
  }, [])

  useEffect(() => {
    if ((messages.length === 0 && sources.length === 0) || !activeChatId) return

    setChatSessions((prev) => {
      const updated = prev.map((session) =>
        session.id === activeChatId
          ? { ...session, messages, sources, title: generateTitle(messages) }
          : session
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [messages, sources, activeChatId])

  const generateTitle = (msgs: Message[]): string => {
    const firstUserMsg = msgs.find((m) => m.role === "user")
    if (!firstUserMsg) return "New Chat"
    const title = firstUserMsg.content.slice(0, 30)
    return title.length < firstUserMsg.content.length ? title + "..." : title
  }

  const startNewChat = () => {
    if (messages.length > 0 && activeChatId) {
    }

    const newId = Date.now().toString()
    const newSession: ChatSession = {
      id: newId,
      title: "New Chat",
      messages: [],
      sources: [],
      createdAt: Date.now(),
    }

    setChatSessions((prev) => {
      const updated = [newSession, ...prev]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
    setActiveChatId(newId)
    setMessages([])
    setSources([])
  }

  const loadChat = (session: ChatSession) => {
    setActiveChatId(session.id)
    setMessages(session.messages)
    setSources(session.sources || [])
  }

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setChatSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
    if (activeChatId === id) {
      setActiveChatId(null)
      setMessages([])
      setSources([])
    }
  }


  const formatAIResponse = (text: string) => {
    let formatted = text.replace(/(###)/g, "\n\n$1");
    formatted = formatted.replace(/(\n- )/g, "\n\n- ");
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "**$1**");
    return formatted;
  }

  const handleSend = async () => {
    if (!query.trim()) return

    const userMsg: Message = { role: "user", content: query }
    setMessages((prev) => [...prev, userMsg])
    setQuery("")
    setIsLoading(true)
    setSources([])

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/v1/chat", {
        query: userMsg.content,
        history: []
      })

      const data = response.data
      const botMsg: Message = { role: "assistant", content: data.answer }
      setMessages((prev) => [...prev, botMsg])

      if (data.sources && data.sources.length > 0) {
        setSources(data.sources)
      }

    } catch (error) {
      console.error("Error:", error)
      const errorMsg: Message = { role: "assistant", content: "⚠️ Connection Error: Please ensure the backend is running." }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">

      <aside
        style={{ width: leftSidebarWidth }}
        className="bg-slate-950 text-white hidden md:flex flex-col border-r border-slate-800 shrink-0 z-20"
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-2 bg-slate-950">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-900/20">
            <Scale className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">LegalMind</span>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <button
              onClick={startNewChat}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-lg shadow-blue-900/30 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </button>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">History</p>
              <div className="space-y-1">
                {chatSessions.length === 0 ? (
                  <p className="text-xs text-slate-600 px-2 py-4 text-center">No previous chats</p>
                ) : (
                  chatSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => loadChat(session)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors border truncate flex items-center gap-2 group
                        ${activeChatId === session.id
                          ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                          : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-800/50'
                        }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                      <span className="truncate flex-1">{session.title}</span>
                      <Trash2
                        onClick={(e) => deleteChat(session.id, e)}
                        className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-red-400 transition-opacity"
                      />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center border border-white/10">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="text-sm overflow-hidden">
              <p className="font-medium text-slate-200 truncate">Karam Balasmeh</p>
              <p className="text-xs text-slate-500">Legal Engineer</p>
            </div>
          </div>
        </div>
      </aside>

      <div
        onMouseDown={() => setIsResizingLeft(true)}
        className={`w-1 hover:w-1.5 bg-transparent hover:bg-blue-500/50 cursor-col-resize transition-all hidden md:block shrink-0 ${isResizingLeft ? 'bg-blue-500' : ''}`}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-white h-full relative">

        <header className="h-16 border-b flex items-center justify-between px-6 bg-white/80 backdrop-blur-sm sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-slate-500" />
            <h2 className="font-semibold text-slate-800">Consultation Session</h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            System Online
          </div>
        </header>

        <div className="flex-1 min-h-0 relative bg-slate-50/30" ref={scrollViewportRef}>
          <ScrollArea className="h-full p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-8 pb-4">

              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center mt-32 text-center space-y-6 opacity-0 animate-in fade-in duration-1000 slide-in-from-bottom-5 fill-mode-forwards">
                  <div className="h-24 w-24 bg-white rounded-3xl flex items-center justify-center mb-2 shadow-sm border border-slate-100">
                    <Scale className="h-12 w-12 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">LegalMind AI</h3>
                    <p className="text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                      Your AI-powered legal assistant grounded in official California statutes.
                      Ask about penalties, regulations, and legal codes.
                    </p>
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>

                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm mt-1
                            ${msg.role === 'user' ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'}`}>
                    {msg.role === 'user' ? <User className="h-4 w-4 text-white" /> : <Sparkles className="h-4 w-4 text-blue-600" />}
                  </div>

                  <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <Card className={`px-5 py-4 shadow-sm text-sm leading-7 
                                ${msg.role === 'user'
                        ? 'bg-slate-900 text-white border-slate-900 rounded-2xl rounded-tr-sm'
                        : 'bg-white text-slate-800 border-slate-200 rounded-2xl rounded-tl-sm'}`}>

                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none prose-slate">
                          <ReactMarkdown
                            components={{
                              h3: ({ node, ...props }) => <h3 className="text-blue-600 font-bold mt-4 mb-2 uppercase text-xs tracking-wider border-b border-blue-50 pb-1" {...props} />,
                              strong: ({ node, ...props }) => <span className="font-bold text-slate-900 bg-slate-100 px-1 py-0.5 rounded mx-0.5" {...props} />,
                              ul: ({ node, ...props }) => <ul className="my-2 space-y-1 list-none pl-0" {...props} />,
                              li: ({ node, ...props }) => (
                                <li className="flex gap-2 text-slate-700 mb-1" {...props}>
                                  <span className="text-blue-400 mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0 block"></span>
                                  <span>{props.children}</span>
                                </li>
                              ),
                              p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />
                            }}
                          >
                            {formatAIResponse(msg.content)}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                      )}
                    </Card>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-slate-100 shrink-0" />
                  <Card className="p-4 space-y-2 w-full max-w-md bg-white border-slate-100">
                    <div className="h-2 bg-slate-100 rounded w-3/4" />
                    <div className="h-2 bg-slate-100 rounded w-1/2" />
                    <div className="h-2 bg-slate-100 rounded w-5/6" />
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="p-4 bg-white border-t border-slate-100 shrink-0 z-10">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-center">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                placeholder="Ask a legal question..."
                className="pr-12 h-12 text-base shadow-sm border-slate-200 focus-visible:ring-blue-600 focus-visible:ring-1 rounded-xl bg-slate-50 transition-all focus:bg-white"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !query.trim()}
                size="icon"
                className={`absolute right-1.5 h-9 w-9 rounded-lg transition-all duration-300 ${query.trim() ? 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200' : 'bg-slate-200 text-slate-400'}`}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <div className="text-center mt-3">
              <p className="text-[10px] text-slate-400 font-medium bg-slate-50 inline-block px-3 py-1 rounded-full border border-slate-100">
                AI can make mistakes. Verify with official sources.
              </p>
            </div>
          </div>
        </div>
      </main>

      <div
        onMouseDown={() => setIsResizingRight(true)}
        className={`w-1 hover:w-1.5 bg-transparent hover:bg-blue-500/50 cursor-col-resize transition-all hidden xl:block shrink-0 ${isResizingRight ? 'bg-blue-500' : ''}`}
      />

      <aside
        style={{ width: rightSidebarWidth }}
        className="border-l border-slate-200 bg-slate-50/50 hidden xl:flex flex-col shrink-0"
      >

        <div className="h-16 border-b border-slate-200 bg-white/50 flex items-center justify-between px-4 sticky top-0 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2 text-slate-700">
            {viewMode === 'list' ? <BookOpen className="h-4 w-4 text-blue-600" /> : <Network className="h-4 w-4 text-blue-600" />}
            <h3 className="font-semibold text-sm">Evidence</h3>
          </div>

          <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="List View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'graph' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Graph View"
            >
              <Network className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">

          {viewMode === 'list' && (
            <ScrollArea className="h-full w-full p-4">
              {sources.length === 0 ? (
                <div className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
                  <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center">
                    <BookOpen className="h-6 w-6 opacity-40" />
                  </div>
                  <p className="text-sm font-medium">No citations loaded</p>
                </div>
              ) : (
                <div className="space-y-3 pb-20">
                  {sources.map((src) => (
                    <Card
                      key={src.id}
                      onClick={() => setSelectedSource(src)}
                      className="group bg-white border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer active:scale-[0.98]"
                    >
                      <div className="p-3 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Gavel className="h-3 w-3 text-blue-500" />
                          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                            Statute Match
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${src.score > 0.8 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                          {(src.score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-slate-600 leading-relaxed font-serif italic line-clamp-3">
                          "{src.text}"
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}

          {viewMode === 'graph' && (
            <div className="h-full w-full p-2 bg-slate-50/50">
              <LegalGraph query={messages.length > 0 ? messages[messages.length - 1].content : ""} sources={sources} />
            </div>
          )}

        </div>
      </aside>

      <Dialog open={!!selectedSource} onOpenChange={() => setSelectedSource(null)}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-slate-800">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Legal Statute View
            </DialogTitle>
            <DialogDescription className="font-mono text-xs text-slate-400 pt-1">
              ID: {selectedSource?.id}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0 mt-4 border rounded-md p-4 bg-slate-50">
            <p className="text-sm leading-7 text-slate-700 font-serif whitespace-pre-wrap break-words">
              {selectedSource?.text}
            </p>
          </ScrollArea>

          <div className="flex justify-between items-center mt-4 border-t pt-4">
            <span className="text-xs text-slate-400 font-mono">
              Relevance Score: {(selectedSource?.score || 0 * 100).toFixed(2)}%
            </span>
            <Button variant="outline" size="sm" onClick={() => setSelectedSource(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}