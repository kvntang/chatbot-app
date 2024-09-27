// this file is the component that renders the chat window and the input box
// the bot will reply from the list of preset replies

import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import MessageBubble from './MessageBubble';

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');

  // List of random bot replies
  const botReplies = [
    "I see. That's interesting.",
    "Can you tell me more about that?",
    "Okay, got it!"
  ];

  // Initialize the chat with a bot message when the component mounts
  useEffect(() => {
    const initialMessage = {
      id: Date.now().toString(),
      text: 'Hello, how can I help you today?',
      sender: 'bot',
      order: 1,
    };
    setMessages([initialMessage]);
  }, []);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return; // Prevent empty messages

    //I am trying to get the order number of the last message in the array here
    const newUserMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      order: messages.length + 1,
    };

    setMessages((prevMessages) => [
      ...prevMessages,
      { ...newUserMessage, order: prevMessages.length + 1 },
    ]);
    setInputValue('');

    // Simulate bot response with a random reply
    setTimeout(() => {
      const randomReply = botReplies[Math.floor(Math.random() * botReplies.length)];
      const botReply = {
        id: (Date.now() + 1).toString(),
        text: randomReply, // Bot picks a random reply
        sender: 'bot',
        order: messages.length + 2,
      };
      setMessages((prevMessages) => [
        ...prevMessages,
        { ...botReply, order: prevMessages.length + 1 },
      ]);
    }, 1000);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = messages.findIndex((msg) => msg.id === active.id);
      const newIndex = messages.findIndex((msg) => msg.id === over.id);

      const newMessages = arrayMove(messages, oldIndex, newIndex);

      // Reorder the messages and update the order numbers
      const reorderedMessages = newMessages.map((msg, index) => ({
        ...msg,
        order: index + 1,
      }));

      setMessages(reorderedMessages);
    }
  };

  return (
    <div className="chat-box">
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={messages}>
          <div className="messages-container">
            {messages.map((message) => (
              <SortableMessageBubble key={message.id} message={message} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="input-container">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Type your message..."
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatBox;

const SortableMessageBubble = ({ message }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: message.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <MessageBubble message={message} />
    </div>
  );
};
