import React, { useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import './App.css';

const GOSSIP_SPEED = 1000; // Duration for dot animation

const App = () => {
  const [nodes, setNodes] = useState([]);
  const [round, setRound] = useState(0);
  const [fanout, setFanout] = useState(2);
  const [nodeCount, setNodeCount] = useState(10);
  const [delayBetweenCycles, setDelayBetweenCycles] = useState(5000);
  const [isGossipRunning, setIsGossipRunning] = useState(false);
  const [currentGuideIndex, setCurrentGuideIndex] = useState(0);
  const [gossipDots, setGossipDots] = useState([]);

  // Function to reset all states to initial values
  const resetAllStates = useCallback(() => {
    // Reset nodes with initial state
    const initialNodes = Array.from({ length: nodeCount }, (_, i) => ({
      id: i,
      x: Math.random() * 500,
      y: Math.random() * 500,
      informed: i === 0, // Start with node 0 as informed
    }));

    // Reset all states to their initial values
    setNodes(initialNodes);
    setRound(0);
    setFanout(2);
    setDelayBetweenCycles(5000);
    setIsGossipRunning(false);
    setCurrentGuideIndex(0);
    setGossipDots([]);
  }, [nodeCount]);


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
    const newGossipDots = [];

    informedNodes.forEach(node => {
      for (let i = 0; i < fanout; i++) {
        const targetNode = newNodes[Math.floor(Math.random() * nodeCount)];
        if (!targetNode.informed) {
          targetNode.informed = true;
          newGossipDots.push({
            source: node,
            target: targetNode,
            id: `${node.id}-${targetNode.id}-${round}-${i}`,
          });
        }
      }
    });

    setNodes(newNodes);
    setGossipDots(newGossipDots);

    // Clear the dots after each round
    setTimeout(() => setGossipDots([]), GOSSIP_SPEED);

  }, [round, nodeCount, fanout]);

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

  // Function to handle node click and change its informed status
  const handleNodeClick = useCallback((nodeId) => {
    const updatedNodes = nodes.map(node =>
      node.id === nodeId
        ? { ...node, informed: true }
        : node
    );
    setNodes(updatedNodes);
  }, [nodes]);

  const guideContent = [
    "Welcome to GossipScope! Click on nodes to infect them.",
    "Use the controls to manage the gossip simulation.",
    "Adjust parameters to see how they affect the spread of information.",
  ];

  return (
    <div className="App">
      <div className="demo-section">
        <h1>Gossip Scope: A Visual Aid for Learners</h1>


        <div className="action">
          <h2>Actions</h2>
          <button onClick={resetAllStates}>Reset Nodes</button>
        </div>


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
          {nodes.map((node, index) => (
            <g key={index} onClick={() => handleNodeClick(node.id)}>
              <circle
                key={index}
                cx={node.x}
                cy={node.y}
                r={15}
                fill={node.informed ? 'green' : 'gray'}
                style={{ cursor: 'pointer' }}
                stroke="black"
                strokeWidth={1} />

              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                fill="white"
                fontSize="8"
                fontWeight="bold"
                pointerEvents="none"
              >
                N{node.id}
              </text></g>
          ))}
          {gossipDots.map((dot, index) => (
            <image
              key={dot.id}
              xlinkHref="/mail-svgrepo-com.svg" // path to your message icon
              x={dot.source.x}
              y={dot.source.y}
              width={20}
              height={20}
            >
              {/* Animate each dot from the source to the target */}
              <animate
                attributeName="x"
                from={dot.source.x}
                to={dot.target.x}
                dur={`${GOSSIP_SPEED / 1000}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="y"
                from={dot.source.y}
                to={dot.target.y}
                dur={`${GOSSIP_SPEED / 1000}s`}
                repeatCount="indefinite"
              />
            </image>
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
