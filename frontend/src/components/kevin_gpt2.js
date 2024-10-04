import React, { useState } from 'react';
import { DndContext, rectIntersection, useDroppable } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';

const MessageBubble = ({ message, isOver, isDragging }) => {
  let bubbleClass =
    message.sender === 'user'
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

// Define a trash can droppable area
function TrashCan() {
  const { setNodeRef } = useDroppable({
    id: 'trash-drop',
  });

  return (
    <div id="trash-drop" ref={setNodeRef}>
      trash<br></br>
      trash
    </div>
  );
}

const SortableMessageBubble = ({ message }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: message.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    // Return the message bubble in a div with the style and attributes of the message bubble
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <MessageBubble message={message} isDragging={isDragging} isOver={isOver} />
    </div>
  );
};

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');

  // State for knowing if anything is being dragged
  const [isDragging, setDragging] = useState('');

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
      // Create the message history with roles for ChatGPT
      const messageHistory = [
        ...messages.map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
        })),
        { role: 'user', content: inputValue }, // Add the new message to the history
      ];

      try {
        // Send the user message and previous messages to the backend
        const response = await axios.post('http://localhost:3001/api/generic_bot', {
          messageHistory, // Send the full context including previous messages
        });

        // Return the bot's reply from the response
        return {
          id: (Date.now() + 1).toString(),
          text: response.data.reply, // Use the reply from the backend
          sender: 'bot',
        };
      } catch (error) {
        console.error('Error fetching reply from the backend:', error);
        return null; // Return null if there's an error
      }
    };

    setMessages((prevMessages) => [
      ...prevMessages,
      { ...newMessage, order: prevMessages.length + 1 },
    ]);

    setInputValue(''); // Clear input field after message is sent

    // Fetch the bot's reply by calling the new function
    const genericBotReply = await fetchGenericBotResponse(messages, inputValue);

    if (genericBotReply) {
      // Update the messages state with the bot's reply
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

  // Function to merge messages via API
  const mergeMessagesViaAPI = async (message1, message2) => {
    // Create the message history with roles for ChatGPT
    const messageHistory = [
      { role: 'user', content: message1 },
      { role: 'user', content: message2 },
    ];

    try {
      // Send the message history to the backend
      const response = await axios.post('http://localhost:3001/api/merge', {
        messageHistory, // Correctly send the messageHistory
      });
      console.log("send to merge api");
  
      // Return the merged text from the response
      return response.data.reply; // Adjust based on your API's response
    } catch (error) {
      console.error('Error merging messages:', error.response?.data || error.message);
      // Fallback to concatenated message if there's an error
      return `${message1} ${message2}`;
    }
  };

  

  const mergeAndUpdateMessages = async (messages, activeId, overId) => {
    const activeIndex = messages.findIndex((msg) => msg.id === activeId);
    const overIndex = messages.findIndex((msg) => msg.id === overId);
    const activeMessage = messages[activeIndex];
    const overMessage = messages[overIndex];

    // Make API POST request to merge messages
    const mergedText = await mergeMessagesViaAPI(overMessage.text, activeMessage.text);

    const mergedMessage = {
      ...overMessage,
      text: mergedText,
      isMerged: true,
    };

    // Remove the active message and replace the over message with the merged message
    const updatedMessages = messages.filter((msg) => msg.id !== activeId);
    updatedMessages[overIndex] = mergedMessage;

    return updatedMessages;
  };

  // Auto-generate new messages with delay
  const generateFutureUserMessage = (index) => {
    // TO-DO: replace with GPT response
    // fetchFutureUserResponse ...

    setTimeout(() => {
      const newUserMessage = {
        id: Date.now().toString() + index,
        text: `Alternate timeline message ${index + 1}`,
        sender: 'user',
      };

      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, newUserMessage];
        return updateMessageOrder(updatedMessages);
      });
    }, 500); // Add a delay for the user message
  };

  const generateFutureBotMessage = (index) => {
    // TO-DO: replace with GPT response
    // fetchFutureBotResponse ...

    setTimeout(() => {
      const botReply = {
        id: (Date.now() + 1).toString() + index,
        text: `Bot reply to: Alternate timeline message ${index}`,
        sender: 'bot',
      };

      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, botReply];
        return updateMessageOrder(updatedMessages);
      });
    }, 500); // Delay for bot response
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // If something is being dragged at any time
  const handleDragMove = () => {
    // Set state to know something is being dragged
    setDragging(true);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    // Set state to know nothing is being dragged
    setDragging(false);

    if (!over || active.id === over.id) {
      return;
    }

    console.log('intersect' + over.id);

    let reorderedMessages;
    let insertionIndex;
    const activeIndex = messages.findIndex((msg) => msg.id === active.id);

    // If the thing it intersects with on drop is the trash can
    // Delete the message and any after it
    if (over.id === 'trash-drop') {
      reorderedMessages = messages;
      insertionIndex = activeIndex;
      reorderedMessages.splice(insertionIndex);
    }
    // If the thing it intersects with on drop is a message, merge and then reorder
    else {
      const overIndex = messages.findIndex((msg) => msg.id === over.id);

      const isOverThreshold =
        over.rect.top + over.rect.height * 0.7 > active.rect.current.translated.top;

      if (isOverThreshold) {
        // Merge messages
        reorderedMessages = await mergeAndUpdateMessages(messages, active.id, over.id);
        insertionIndex = overIndex;
      } else {
        // Simple reorder
        reorderedMessages = arrayMove(messages, activeIndex, overIndex);
        insertionIndex = overIndex;
      }
    }

    // Remove the history
    const remove = reorderedMessages.length - insertionIndex - 1;
    // Remove the last 'indexDifference - 1' number of messages
    if (remove > 1) {
      reorderedMessages = reorderedMessages.slice(0, -remove);
    }
    // Update the display by setting the new messages
    setMessages(updateMessageOrder(reorderedMessages));

    // Get how many messages need to be generated
    const generateAmount = remove;
    console.log('Insertion at:', insertionIndex);
    console.log('need to generate:', remove);

    // Start generating messages with delay
    const baseIndex = reorderedMessages.length;
    let generatedCount = 0;
    let i = 0;
    while (generatedCount < generateAmount) {
      if (generatedCount % 2 === 0) {
        generateFutureUserMessage(baseIndex + i);
      } else {
        generateFutureBotMessage(baseIndex + i);
      }
      generatedCount++;
      i++;
    }

    // Print it
    console.log(
      'New order:',
      reorderedMessages.map((msg, index) => ({
        index: index + 1,
        text: msg.text,
      }))
    );
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <div className="chat-box">
      <DndContext collisionDetection={rectIntersection} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
        <SortableContext items={messages}>
          <div className="messages-container">
            {messages.map((message) => (
              <SortableMessageBubble key={message.id} message={message} />
            ))}

            {/* Render trash can if things are being dragged */}
            {isDragging && <TrashCan />}
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
