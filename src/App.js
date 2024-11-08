import React, { useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import './App.css';

const NODE_COUNT = 10;
const ROUND_DELAY = 5000; // milliseconds between rounds

const App = () => {
  const [nodes, setNodes] = useState([]);
  const [round, setRound] = useState(0);
  const [connections, setConnections] = useState([]);
  const [fanout, setFanout] = useState(2);
  const [nodeCount, setNodeCount] = useState(10);
  const [delayBetweenCycles, setDelayBetweenCycles] = useState(5000);
  const [isGossipRunning, setIsGossipRunning] = useState(false);
  const [currentGuideIndex, setCurrentGuideIndex] = useState(0);

  // Initialize nodes with random positions and status
  useEffect(() => {
    const initialNodes = Array.from({ length: nodeCount }, (_, i) => ({
      id: i,
      x: Math.random() * 500,
      y: Math.random() * 500,
      informed: i === 0, // Start with node 0 as informed
    }));
    setNodes(initialNodes);
  }, [nodeCount]);

  // Run the gossip rounds
  useEffect(() => {
    if (round === 0) return;

    const newNodes = [...nodes];
    const informedNodes = newNodes.filter(node => node.informed);
    const newConnections = [];

    informedNodes.forEach(node => {
      for (let i = 0; i < fanout; i++) {
        const targetNode = newNodes[Math.floor(Math.random() * nodeCount)];
        if (!targetNode.informed) {
          targetNode.informed = true;
          newConnections.push({ source: node, target: targetNode });
        }
      }
    });

    setNodes(newNodes);
    setConnections(newConnections);

    // Clear the connections after a short delay for fade-out effect
    setTimeout(() => setConnections([]), delayBetweenCycles / 2);

  }, [round, nodeCount, fanout, delayBetweenCycles]);

  // Start gossip rounds with delays
  useEffect(() => {
    if (isGossipRunning && round < 10) {
      const timer = setTimeout(() => setRound(round + 1), delayBetweenCycles);
      return () => clearTimeout(timer);
    }
  }, [round, isGossipRunning, delayBetweenCycles]);

  const toggleGossip = useCallback(() => {
    setIsGossipRunning(!isGossipRunning);
  }, [isGossipRunning]);

  const handlePrevGuide = useCallback(() => {
    setCurrentGuideIndex(prev => (prev === 0 ? guideContent.length - 1 : prev - 1));
  }, []);

  const handleNextGuide = useCallback(() => {
    setCurrentGuideIndex(prev => (prev + 1) % guideContent.length);
  }, []);

  const guideContent = [
    "Welcome to GossipScope! Click on nodes to infect them.",
    "Use the controls to manage the gossip simulation.",
    "Adjust parameters to see how they affect the spread of information.",
  ];

  return (
    <div className="App">
      <div className="demo-section">
        <h1>Gossip Scope: A Visual Aid for Learners</h1>

        <div className="parameters">
          <h2>Parameters</h2>
          <label>
            Nodes:
            <input
              type="number"
              value={nodeCount}
              onChange={(e) => setNodeCount(Math.max(parseInt(e.target.value) || 1, 1))}
              min="1"
              style={{ width: '60px' }}
            />
          </label>

          <label>
            Fanout:
            <input
              type="number"
              value={fanout}
              onChange={(e) => setFanout(Math.max(parseInt(e.target.value) || 1, 1))}
              min="1"
              style={{ width: '60px' }}
            />
          </label>

          <label>
            Delay Between Cycles (ms):
            <input
              type="number"
              value={delayBetweenCycles}
              onChange={(e) => setDelayBetweenCycles(Math.max(parseInt(e.target.value) || 1000, 1000))}
              min="1000"
              style={{ width: '60px' }}
            />
          </label>
        </div>

        <svg width="600" height="600" className="network">
          {connections.map((conn, index) => (
            <line
              key={index}
              x1={conn.source.x}
              y1={conn.source.y}
              x2={conn.target.x}
              y2={conn.target.y}
              stroke="orange"
              strokeWidth="2"
              opacity="0.6"
            />
          ))}
          {nodes.map((node, index) => (
            <circle
              key={index}
              cx={node.x}
              cy={node.y}
              r={10}
              fill={node.informed ? 'green' : 'gray'}
              stroke="black"
              strokeWidth={1}
            />
          ))}
        </svg>
        <div className="round">Round: {round}</div>
        <button onClick={toggleGossip}>
          {isGossipRunning ? 'Pause Gossip' : 'Start Gossip'}
        </button>
      </div>

      <div className="learners-guide">
        <h2>Learner's Guide</h2>
        <div className="guide-content">{guideContent[currentGuideIndex]}</div>
        <div className="carousel-controls">
          <button onClick={handlePrevGuide}>Previous</button>
          <button onClick={handleNextGuide}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default App;
