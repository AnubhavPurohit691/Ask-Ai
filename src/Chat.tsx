import React, { ReactEventHandler, ReactNode, useEffect, useRef, useState } from 'react'
import {Send} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { ChatSession, GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai'
const genAi = new GoogleGenerativeAI("AIzaSyC5kOlabvOg3lD_VH1gmhqV-CJ2Nlc5E6E")
const model = genAi.getGenerativeModel({ model: "gemini-1.5-pro" })

interface messages{
    sender:string
    text:string
    isGenerating: boolean
}
export const Chat = () => {
  const [message, setmessage] = useState<messages[]>([])
  const [input, setinput] = useState<string>("")
  const [istyping, setistyping] = useState(false)
  const messageendref = useRef<HTMLDivElement>(null)
  const chatsessionref = useRef<ChatSession | null>(null)
  const scrollTobottom = () => {
    messageendref.current?.scrollIntoView({ behavior: "smooth" })
  }
  const handleonsubmit=async(e:React.FormEvent)=>{
 e.preventDefault()
 if(!input)return
 setmessage((prev)=>[...prev,{sender:'user',text:input,isGenerating:false}])
 setinput("")
 setistyping(true)


 try {
let fullresponse=""
const result =await chatsessionref.current?.sendMessageStream(input)
setmessage((prev)=>[...prev,{sender:"ai",text:'',isGenerating:true}])

for await (const chunk of result?.stream as AsyncIterable<{ text(): string }>){
const chunktext=chunk.text()
fullresponse+=chunktext

setmessage((prev)=>[...prev.slice(0,-1),{sender:"ai",text:fullresponse,isGenerating:true}])
}
setmessage((prev)=>[...prev.slice(0,-1),{sender:"ai",text:fullresponse,isGenerating:false}])

setistyping(false)
 } catch (error) {
    console.log(error)
    setistyping(false)
    setmessage((prev)=>[...prev,{sender:"ai",text:"Sorry,there was an error",isGenerating:false}])
 }
}

  useEffect(() => {
    scrollTobottom()
    if (!chatsessionref.current) {
      chatsessionref.current = model.startChat({
        generationConfig: {
          temperature: 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
        history: [],
      })
    }

  }, [message])
  return <>
    <div className='flex flex-col h-screen bg-gray-200'>
      <header className='bg-blue-600 text-white p-4'>
        <h1 className='text-2xl text-center font-bold'>Ask AI</h1>
      </header>
      <div className='flex-1 overflow-y-auto p-4'>
        {message.map((message, index) => (
          <div
            key={index}
            className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`inline-block p-2 rounded-lg ${
                message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'
              }`}
            >
              {message.sender === 'user' ? (
                message.text
              ) : (
                <ReactMarkdown
                  className={`prose max-w-none ${message.isGenerating ? 'typing-animation' : ''}`}
                >
                  {message.text || 'Thinking...'}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}

        {istyping && (
          <div className='flex justify-start'>
            <div className='inline-block p-2 rounded-lg bg-gray-300'>Typing...</div>
          </div>
        )}
        <div ref={messageendref} />
      </div>
      <form onSubmit={handleonsubmit} className='p-4 bg-white'>
        <div className="flex items-center">
          <input
            type="text"
            className="flex-1 p-2 border rounded-l-lg focus:outline-none"
            value={input}
            placeholder="Type a message..."
            onChange={(e) => setinput(e.target.value)}
          />
          <button className="p-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none">
            <Send size={24} />
          </button>
        </div>
      </form>
    </div>
  </>
}