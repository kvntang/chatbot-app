import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';

const MessageBubble = ({ message, isOver, isDragging }) => {
  if (!message) {
    return null;
  }

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

// Define a trash can droppable area
function TrashCan() {
  const { setNodeRef } = useDroppable({
    id: 'trash-drop',
  });

  return (
    <div id="trash-drop" ref={setNodeRef} className="trash-can">
      🗑️ Trash
    </div>
  );
}

const SortableMessageBubble = ({ message, activeId }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isOver,
  } = useSortable({ id: message.id });

  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: message.id === activeId ? 0 : 1, // Hide the item if it's being dragged
    }),
    [transform, transition, activeId, message.id]
  );

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <MessageBubble
        message={message}
        isDragging={message.id === activeId}
        isOver={isOver}
      />
    </div>
  );
};

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');

  // State for tracking the active draggable item
  const [activeId, setActiveId] = useState(null);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
    };

    const fetchGenericBotResponse = async (messages, inputValue) => {
      const messageHistory = [
        ...messages.map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
        })),
        { role: 'user', content: inputValue },
      ];

      try {
        const response = await axios.post(
          'http://localhost:3001/api/generic_bot',
          {
            messageHistory,
          }
        );

        return {
          id: (Date.now() + 1).toString(),
          text: response.data.reply,
          sender: 'bot',
        };
      } catch (error) {
        console.error('Error fetching reply from the backend:', error);
        return null;
      }
    };

    setMessages((prevMessages) => [
      ...prevMessages,
      { ...newMessage, order: prevMessages.length + 1 },
    ]);

    setInputValue('');

    const genericBotReply = await fetchGenericBotResponse(messages, inputValue);

    if (genericBotReply) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { ...genericBotReply, order: prevMessages.length + 1 },
      ]);
    }
  };

  const updateMessageOrder = (messages) => {
    return messages.map((msg, index) => ({
      ...msg,
      order: index + 1,
    }));
  };

  // Helper function to get the opposite sender
  const getOppositeSender = (sender) => {
    return sender === 'user' ? 'bot' : 'user';
  };

  // Function to merge messages via API
  const mergeMessagesViaAPI = async (message1, message2) => {
    const messageHistory = [
      { role: 'user', content: message1 },
      { role: 'user', content: message2 },
    ];

    try {
      const response = await axios.post('http://localhost:3001/api/merge', {
        messageHistory,
      });
      console.log('Sent to merge API');

      return response.data.reply;
    } catch (error) {
      console.error(
        'Error merging messages:',
        error.response?.data || error.message
      );
      return `${message1} ${message2}`;
    }
  };

  // Updated mergeAndUpdateMessages function
  const mergeAndUpdateMessages = async (messages, activeId, overId) => {
    const activeIndex = messages.findIndex((msg) => msg.id === activeId);
    const overIndex = messages.findIndex((msg) => msg.id === overId);

    if (activeIndex === -1 || overIndex === -1) return messages;

    const activeMessage = messages[activeIndex];
    const overMessage = messages[overIndex];

    // Get merged text via API
    const mergedText = await mergeMessagesViaAPI(
      overMessage.text,
      activeMessage.text
    );

    const mergedMessage = {
      ...overMessage,
      text: mergedText,
      isMerged: true,
    };

    // Keep messages before the merged message
    const messagesBeforeMerged = messages.slice(0, Math.min(activeIndex, overIndex));

    // Determine how many new messages to generate THIS MIGHT NEED TO CHANGE!!!
    const messagesToGenerateCount = messages.length - messagesBeforeMerged.length - 2;

    // Generate new messages
    const startingSender = getOppositeSender(mergedMessage.sender);
    const newReplies = [];
    for (let i = 0; i < messagesToGenerateCount; i++) {
      const sender = i % 2 === 0 ? startingSender : getOppositeSender(startingSender);
      const newMessage = {
        id: (Date.now() + i).toString(),
        text: `new message ${i + 1}`,
        sender,
      };
      newReplies.push(newMessage);
    }

    // Assemble the updated messages
    const updatedMessages = [...messagesBeforeMerged, mergedMessage, ...newReplies];

    return updatedMessages;
  };

  // Drag event handlers
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    console.log('Dropped over:', over.id);

    let reorderedMessages;

    // If dropped over the trash can
    if (over.id === 'trash-drop') {
      reorderedMessages = messages.filter((msg) => msg.id !== active.id);
      setMessages(updateMessageOrder(reorderedMessages));
      return;
    }
    // If dropped over another message, merge them
    else {
      const activeIndex = messages.findIndex((msg) => msg.id === active.id);
      const overIndex = messages.findIndex((msg) => msg.id === over.id);

      const isOverThreshold =
        over.rect.top + over.rect.height * 0.7 >
        active.rect.current.translated.top;

      if (isOverThreshold) {
        // Merge messages
        reorderedMessages = await mergeAndUpdateMessages(
          messages,
          active.id,
          over.id
        );
      } else {
        // Simple reorder
        reorderedMessages = arrayMove(messages, activeIndex, overIndex);
      }

      setMessages(updateMessageOrder(reorderedMessages));
    }
  };

  return (
    <div className="chat-box">
      <DndContext
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={messages.map((message) => message.id)}>
          <div className="messages-container">
            {messages.map((message) => (
              <SortableMessageBubble
                key={message.id}
                message={message}
                activeId={activeId}
              />
            ))}

            {/* Render trash can if something is being dragged */}
            {activeId && <TrashCan />}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeId ? (
            messages.find((message) => message.id === activeId) ? (
              <MessageBubble
                message={messages.find(
                  (message) => message.id === activeId
                )}
                isDragging={true}
                isOver={false}
              />
            ) : null
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
