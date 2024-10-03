import React, { useState } from 'react';
import {
  DndContext,
  rectIntersection,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const MessageBubble = ({ message, isOver, isDragging }) => {
  let bubbleClass =
    message.sender === 'user'
      ? 'user-message'
      : message.sender === 'bot'
      ? 'bot-message'
      : 'merged-message';

  const dropzoneClass = isOver && !isDragging ? 'over-message' : '';
  const draggingClass = isDragging && !message.isMerged ? 'dragging' : '';
  const mergedClass = message.isMerged ? 'merged-message' : '';

  return (
    <div
      className={`message-bubble ${bubbleClass} ${dropzoneClass} ${draggingClass} ${mergedClass}`}
    >
      {message.text}
    </div>
  );
};

function TrashCan({ isOver }) {
  const { setNodeRef } = useDroppable({
    id: 'trash-drop',
  });

  return (
    <div
      id="trash-drop"
      ref={setNodeRef}
      className={isOver ? 'drag-over' : ''}
    >
      Trash
    </div>
  );
}

const SortableMessageBubble = ({ message, isDragging }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isOver,
  } = useSortable({ id: message.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0 : 1, // Make the bubble transparent when dragging
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <MessageBubble
        message={message}
        isDragging={isDragging}
        isOver={isOver}
      />
    </div>
  );
};

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isDragging, setDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [trashCanIsOver, setTrashCanIsOver] = useState(false);

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

    generateBotReply(inputValue);
  };

  const generateBotReply = (userInput) => {
    setTimeout(() => {
      const botReply = {
        id: (Date.now() + 1).toString(),
        text: `reply ${userInput}`,
        sender: 'bot',
      };
      setMessages((prevMessages) => [
        ...prevMessages,
        { ...botReply, order: prevMessages.length + 1 },
      ]);
    }, 500);
  };

  const updateMessageOrder = (messages) => {
    return messages.map((msg, index) => ({
      ...msg,
      order: index + 1,
    }));
  };

  // Function to get the opposite sender
  const getOppositeSender = (sender) => {
    return sender === 'user' ? 'bot' : 'user';
  };

  const mergeAndUpdateMessages = (messages, activeId, overId) => {
    const activeMessageIndex = messages.findIndex((msg) => msg.id === activeId);
    const overMessageIndex = messages.findIndex((msg) => msg.id === overId);

    if (activeMessageIndex === -1 || overMessageIndex === -1) return messages;

    const activeMessage = messages[activeMessageIndex];
    const overMessage = messages[overMessageIndex];

    // Combine texts and assign the sender of the over message
    const mergedMessage = {
      ...overMessage,
      text: `${overMessage.text} ${activeMessage.text}`,
      isMerged: true,
    };

    // Keep messages before the merged message
    const messagesBeforeMerged = messages.slice(0, Math.min(activeMessageIndex, overMessageIndex));

    // Determine how many new messages to generate
    const messagesToGenerateCount = messages.length - messagesBeforeMerged.length - 1;

    // Generate new messages
    const startingSender = getOppositeSender(mergedMessage.sender);
    const newReplies = generateNewReplies(messagesToGenerateCount, startingSender);

    // Assemble the updated messages
    const updatedMessages = [...messagesBeforeMerged, mergedMessage, ...newReplies];

    // Update the order
    const reorderedMessages = updateMessageOrder(updatedMessages);

    setMessages(reorderedMessages);
  };

  const generateNewReplies = (count, startingSender) => {
    const newReplies = [];
    let sender = startingSender;
    for (let i = 0; i < count; i++) {
      const newReply = {
        id: Date.now().toString() + i,
        text: `new message ${i + 1}`,
        sender: sender,
      };
      newReplies.push(newReply);
      // Alternate sender
      sender = getOppositeSender(sender);
    }
    return newReplies;
  };

  const handleDragStart = (event) => {
    setDragging(true);
    setDraggedItem(event.active.id);
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setDragging(false);
    setDraggedItem(null);
    setActiveId(null);
    setTrashCanIsOver(false);

    if (!over || active.id === over.id) {
      return;
    }

    if (over.id === 'trash-drop') {
      // Delete the message
      const activeMessageIndex = messages.findIndex(
        (msg) => msg.id === active.id
      );
      const updatedMessages = [...messages];
      updatedMessages.splice(activeMessageIndex, 1);

      const reorderedMessages = updateMessageOrder(updatedMessages);
      setMessages(reorderedMessages);
    } else {
      // Merge messages and generate new replies
      mergeAndUpdateMessages(messages, active.id, over.id);
    }
  };

  const handleDragOver = (event) => {
    const { over } = event;

    if (over && over.id === 'trash-drop') {
      setTrashCanIsOver(true);
    } else {
      setTrashCanIsOver(false);
    }
  };

  return (
    <div className="chat-box">
      <DndContext
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={messages}>
          <div className="messages-container">
            {messages.map((message) => (
              <SortableMessageBubble
                key={message.id}
                message={message}
                isDragging={isDragging && draggedItem === message.id}
              />
            ))}
          </div>
        </SortableContext>

        {/* Render TrashCan outside of messages-container */}
        {isDragging && <TrashCan isOver={trashCanIsOver} />}

        <DragOverlay>
          {activeId ? (
            <MessageBubble
              message={messages.find((msg) => msg.id === activeId)}
              isDragging={true}
              isOver={false}
            />
          ) : null}
        </DragOverlay>
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
