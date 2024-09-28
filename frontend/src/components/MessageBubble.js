import React from 'react';

const MessageBubble = ({ message, isActive, isOver, isDragging }) => {
  let bubbleClass = message.sender === 'user' 
    ? 'user-message' 
    : message.sender === 'bot' 
      ? 'bot-message' 
      : 'merged-message';

  // Apply the `over-message` class if `isOver` is true and the current message is not the one being dragged (`!isDragging`)
  // Override the merged-message class with over-message if the message is both merged and being hovered over
  const dropzoneClass = isOver && !isDragging ? 'over-message' : '';

  // Add a blue background when the message is being dragged, unless it's already green (merged)
  const draggingClass = isDragging && !message.isMerged ? 'dragging' : '';

  // If the message is merged, keep it green even when dragging
  const mergedClass = message.isMerged ? 'merged-message' : '';

  return (
    <div className={`message-bubble ${bubbleClass} ${dropzoneClass} ${draggingClass} ${mergedClass}`}>
      {message.text}
    </div>
  );
};

export default MessageBubble;
