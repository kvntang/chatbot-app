import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';

// MessageBubble Component
const MessageBubble = ({ message, isDragging, isHovered }) => {
  if (!message) {
    return null;
  }

  // Determine the CSS class based on the sender of the message
  const bubbleClass = message.sender === 'user' ? 'user-message' : 'bot-message';

  // Handle extra classes for dragging, merged, or hovered messages
  const draggingClass = isDragging && !message.isMerged ? 'dragging' : '';
  const mergedClass = message.isMerged ? 'merged-message' : '';
  const hoveredClass = isHovered ? 'hovered' : '';

  return (
    <div className={`message-bubble ${bubbleClass} ${draggingClass} ${mergedClass} ${hoveredClass}`}>
      {message.text}
    </div>
  );
};

// TrashCan Component
function TrashCan() {
  const { setNodeRef } = useDroppable({
    id: 'trash-drop',
  });

  return (
    <div id="trash-drop" ref={setNodeRef} className="trash-can">
      🍂 Forget
    </div>
  );
}

// SortableMessageBubble Component
const SortableMessageBubble = ({ message, activeId, overId }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: message.id,
    animateLayoutChanges: () => false, // Disable layout animations to prevent ResizeObserver errors
  });

  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: message.id === activeId ? 0 : 1, // Hide the original item when dragging
      zIndex: message.id === activeId ? 1000 : 'auto', // Ensure the dragged item is above others
    }),
    [transform, transition, activeId, message.id]
  );

  // Determine if the message is being hovered over
  const isHovered = message.id === overId && activeId;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <MessageBubble
        message={message}
        isDragging={message.id === activeId}
        isHovered={isHovered}
      />
    </div>
  );
};

// ChatBox Component
const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');

  // State for tracking the active draggable item
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null); // New state for hovered item

  // Ref for the messages end
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
          `${process.env.REACT_APP_API_BASE_URL}/generic_bot`,
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
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/merge`, {
        messageHistory,
      });
      console.log('Sent to merge API');

      return response.data.reply; // Adjust based on your API's response structure
    } catch (error) {
      console.error(
        'Error merging messages:',
        error.response?.data || error.message
      );
      return `${message1} ${message2}`;
    }
  };

  // Function to generate future user messages via API
  const generateFutureUserMessage = async (messageHistory) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/user`, {
        messageHistory,
      });

      console.log('Generating future user message');

      return {
        id: Date.now().toString(),
        text: response.data.reply, // Adjust based on your API's response structure
        sender: 'user',
      };
    } catch (error) {
      console.error(
        'Error generating future user message:',
        error.response?.data || error.message
      );
      return null;
    }
  };

  // Function to generate future bot messages via API
  const generateFutureBotMessage = async (messageHistory) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/bot`, {
        messageHistory,
      });

      return {
        id: Date.now().toString(),
        text: response.data.reply, // Adjust based on your API's response structure
        sender: 'bot',
      };
    } catch (error) {
      console.error(
        'Error generating future bot message:',
        error.response?.data || error.message
      );
      return null;
    }
  };

  // Function to merge and update messages
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
    const messagesBeforeMerged = messages.slice(
      0,
      Math.min(activeIndex, overIndex)
    );

    // Determine how many new messages to generate
    const messagesToGenerateCount =
      messages.length - messagesBeforeMerged.length - 2;

    // Generate new messages asynchronously
    const startingSender = getOppositeSender(mergedMessage.sender);
    const newReplies = [];

    for (let i = 0; i < messagesToGenerateCount; i++) {
      const sender =
        i % 2 === 0 ? startingSender : getOppositeSender(startingSender);

      // Build the message history up to this point
      const messageHistory = [
        ...messagesBeforeMerged.map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
        })),
        {
          role: mergedMessage.sender === 'user' ? 'user' : 'assistant',
          content: mergedMessage.text,
        },
        ...newReplies.map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
        })),
      ];

      // Generate the next message using the appropriate API
      let newMessage;
      if (sender === 'user') {
        newMessage = await generateFutureUserMessage(messageHistory);
      } else {
        newMessage = await generateFutureBotMessage(messageHistory);
      }

      if (newMessage) {
        newReplies.push(newMessage);
      } else {
        // Stop generating messages if there's an error
        break;
      }
    }

    // Assemble the updated messages
    const updatedMessages = [
      ...messagesBeforeMerged,
      mergedMessage,
      ...newReplies,
    ];

    return updatedMessages;
  };

  // Drag event handlers
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
  };

  // New handleDragOver function
  const handleDragOver = (event) => {
    const { over } = event;
    if (over) {
      setOverId(over.id);
    } else {
      setOverId(null);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    setActiveId(null);
    setOverId(null); // Reset overId when drag ends

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
      // Merge messages and generate new ones via API
      reorderedMessages = await mergeAndUpdateMessages(
        messages,
        active.id,
        over.id
      );

      setMessages(updateMessageOrder(reorderedMessages));
    }
  };

  return (
    <div className="chat-box">
      <DndContext
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver} // Added this line
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={messages.map((message) => message.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="messages-container">
            {messages.map((message) => (
              <SortableMessageBubble
                key={message.id}
                message={message}
                activeId={activeId}
                overId={overId} // Pass overId to SortableMessageBubble
              />
            ))}
            {/* Scroll Anchor */}
            <div ref={messagesEndRef} />
            {/* Render trash can if something is being dragged */}
            {activeId && <TrashCan />}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeId ? (
            messages.find((message) => message.id === activeId) ? (
              <MessageBubble
                message={messages.find((message) => message.id === activeId)}
                isDragging={true}
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
