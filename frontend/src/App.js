// this is the main application file 

import React from 'react';

// import the ChatBox component; change the chatbot file to your own!! 
// make sure to save the iterations
import ChatBox from './components/kevin_gpt3_debug';
import './App.css';

const App = () => {
  return (
    <div className="app">
      <header className="app-header">
        {/* change our bot name here */}
        <h1> test1</h1>
      </header>
      <main className="app-main">
        <ChatBox />
      </main>
    </div>
  );
};

export default App;