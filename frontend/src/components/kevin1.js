import React, { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
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
    if (inputValue.trim() === '') return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
    };

    setMessages((prevMessages) => [
      ...prevMessages,
      { ...newMessage, order: prevMessages.length + 1 },
    ]);
    setInputValue('');

    // Simulate bot response
    setTimeout(() => {
      const botReply = {
        id: (Date.now() + 1).toString(),
        text: `Hello ${inputValue}`,
        sender: 'bot',
      };
      setMessages((prevMessages) => [
        ...prevMessages,
        { ...botReply, order: prevMessages.length + 1 },
      ]);
    }, 1000);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    console.log('Active:', active); //for debugging
    console.log('Over:', over);

    // If active and over are the same, no need to merge
    if (!over || active.id === over.id) {
      console.log('No merge needed'); //for debugging
      return;
    }

    const activeMessage = messages.find((msg) => msg.id === active.id);
    const overMessage = messages.find((msg) => msg.id === over.id);
    console.log('Active Message:', activeMessage); //for debugging
    console.log('Over Message:', overMessage); //for debugging

    // Merge messages
    const mergedMessage = {
      ...overMessage,
      text: `${overMessage.text} ${activeMessage.text}`, // Concatenate the text
    };
    console.log('Merged Message:', mergedMessage); //for debugging
    console.log('Merging at location:', overMessage.order); // Print the order of the target message

    // Remove the active (dragged) message and replace the over (target) message with the merged one
    const updatedMessages = messages.filter((msg) => msg.id !== active.id).map((msg) => {
      if (msg.id === over.id) {
        return mergedMessage; // Replace the target message with the merged one
      }
      return msg; // Keep other messages unchanged
    });

    // Update message order and set the new state
    const reorderedMessages = updatedMessages.map((msg, index) => ({
      ...msg,
      order: index + 1,
    }));
    reorderedMessages.forEach(msg => console.log(`Message: ${msg.text}, New Order: ${msg.order}`)); //for debugging

    setMessages(reorderedMessages);
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
