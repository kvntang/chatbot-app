import React, { useState } from 'react';
import { DndContext, rectIntersection } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


const MessageBubble = ({ message, isOver, isDragging }) => {
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
  
    return ( //return the message bubble in a div with the style and attributes of the message bubble
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <MessageBubble message={message} isDragging={isDragging} isOver={isOver}/>
      </div>
    );
  };
  

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

  const updateMessageOrder = (messages) => {
    return messages.map((msg, index) => ({
      ...msg,
      order: index + 1,
    }));
  };
  
  const mergeAndUpdateMessages = (messages, activeId, overId) => {
    const activeIndex = messages.findIndex(msg => msg.id === activeId);
    const overIndex = messages.findIndex(msg => msg.id === overId);
    const activeMessage = messages[activeIndex];
    const overMessage = messages[overIndex];

    const mergedMessage = {
      ...overMessage,
      text: `${overMessage.text} ${activeMessage.text}`,
      isMerged: true,
    };

    // Remove the active message and replace the over message with the merged message
    const updatedMessages = messages.filter(msg => msg.id !== activeId);
    updatedMessages[overIndex] = mergedMessage;

    return updatedMessages;
  };

  // Auto-generate new messages with delay
  const generateFutureUserMessage = (index) => {
    setTimeout(() => {
      const newUserMessage = {
        id: Date.now().toString() + index,
        text: `Alternate timeline message ${index + 1}`,
        sender: 'user',
      };

      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages, newUserMessage];
        return updateMessageOrder(updatedMessages);
      });
    }, 500); // Add a delay for the user message
  };

  const generateFutureBotMessage = (index) => {
    setTimeout(() => {
      const botReply = {
        id: (Date.now() + 1).toString() + index,
        text: `Bot reply to: Alternate timeline message ${index}`,
        sender: 'bot',
      };

      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages, botReply];
        return updateMessageOrder(updatedMessages);
      });
    }, 500); // Delay for bot response
  };
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeIndex = messages.findIndex((msg) => msg.id === active.id);
    const overIndex = messages.findIndex((msg) => msg.id === over.id);

    let reorderedMessages;
    const isOverThreshold = over.rect.top + over.rect.height * 0.7 > active.rect.current.translated.top;

    let insertionIndex;
    if (isOverThreshold) {
      // Merge messages
      reorderedMessages = mergeAndUpdateMessages(messages, active.id, over.id);
      insertionIndex = overIndex;
    } else {
      // Simple reorder
      reorderedMessages = arrayMove(messages, activeIndex, overIndex);
      insertionIndex = overIndex;
    }

    // remove the history
    const remove = reorderedMessages.length - insertionIndex -1;
    // Remove the last 'indexDifference - 1' number of messages
    if (remove > 1) {
      reorderedMessages = reorderedMessages.slice(0, -remove);
    }
    // Update the display by setting the new messages
    setMessages(updateMessageOrder(reorderedMessages));

    //get how many messages need to be generated
    const generateAmount = remove;
    console.log("Insertion at:", insertionIndex);
    console.log("need to generate:", remove);

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


    //print it
    console.log("New order:", reorderedMessages.map((msg, index) => ({
        index: index + 1,
        text: msg.text
      })));

  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



  return (
    <div className="chat-box">
      <DndContext collisionDetection={rectIntersection} onDragEnd={handleDragEnd}>
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

