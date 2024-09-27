// this is the component that renders the chat window and the input box; however
// the input box only accepts numbers and will reply with the number + 1

import React, { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import MessageBubble from './MessageBubble';

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = () => {
    const userNumber = parseInt(inputValue.trim(), 10);
    if (isNaN(userNumber)) return; // only proceed if input is a valid number

    const newUserMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      number: userNumber, // store user input number
    };

    setMessages((prevMessages) => [
      ...prevMessages,
      { ...newUserMessage, order: prevMessages.length + 1 },
    ]);
    setInputValue('');

    // Bot reply with input number + 1
    setTimeout(() => {
      const botReply = {
        id: (Date.now() + 1).toString(),
        text: `${userNumber + 1}`, // bot replies with userNumber + 1
        sender: 'bot',
        number: userNumber + 1, // store bot reply number
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
      const reorderedMessages = newMessages.map((msg, index) => {
        // Shift the number of each message after reorder (both user and bot)
        return {
          ...msg,
          number: index + 1, // update the number based on new index
          text: `${index + 1}`, // update the text to reflect the new number
          order: index + 1, // update the order to maintain sorting
        };
      });

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
          placeholder="Type a number..."
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
