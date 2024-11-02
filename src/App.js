import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import './App.css';

const NODE_COUNT = 5;
const ROUND_DELAY = 1000; // milliseconds between rounds

const App = () => {
  const [nodes, setNodes] = useState([]);
  const [round, setRound] = useState(0);

  // Initialize nodes with random positions and status
  useEffect(() => {
    const initialNodes = Array.from({ length: NODE_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 500,
      y: Math.random() * 500,
      informed: i === 0, // Start with node 0 as informed
    }));
    setNodes(initialNodes);
  }, []);

  // Run the gossip rounds
  useEffect(() => {
    if (round === 0) return;

    const newNodes = [...nodes];
    const informedNodes = newNodes.filter(node => node.informed);

    informedNodes.forEach(node => {
      // Each informed node informs 2 random neighbors
      for (let i = 0; i < 2; i++) {
        const targetNode = newNodes[Math.floor(Math.random() * NODE_COUNT)];
        if (!targetNode.informed) targetNode.informed = true;
      }
    });

    setNodes(newNodes);
  }, [round]);

  // Start gossip rounds with delays
  useEffect(() => {
    if (round < 10) {
      const timer = setTimeout(() => setRound(round + 1), ROUND_DELAY);
      return () => clearTimeout(timer);
    }
  }, [round]);

  return (
    <div className="App">
      <h1>Gossip Scope: A Visual Aid for Learners</h1>
      <svg width="600" height="600" className="network">
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
      <button onClick={() => setRound(1)} disabled={round !== 0}>
        Start Gossip
      </button>
    </div>
  );
};

export default App;
