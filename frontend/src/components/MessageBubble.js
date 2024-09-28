// this is the component that renders the message bubbles in the chat window

import React from 'react';

const MessageBubble = ({ message, isActive, isOver }) => {
  let bubbleClass = message.sender === 'user' 
    ? 'user-message' 
    : message.sender === 'bot' 
      ? 'bot-message' 
      : 'merged-message';

  // Add the dropzone class if the message is being hovered over
  const dropzoneClass = isOver ? 'dropzone' : '';

  if (isOver && !isActive) {
    console.log('Message is being hovered over (potential drop target)');
  }

  if (isActive) {
    console.log('Message is being dragged');
  }

  return (
    <div className={`message-bubble ${bubbleClass} ${dropzoneClass}`}>
      {message.text}
    </div>
  );
};

export default MessageBubble;
