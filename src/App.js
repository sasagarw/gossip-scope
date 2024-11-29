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
  const [showPaths, setShowPaths] = useState(false);
  const [randomSelectionTargets, setRandomSelectionTargets] = useState([]);
  const [messageDots, setMessageDots] = useState([]);
  const [globalData, setGlobalData] = useState(null);


  // Function to reset all states to initial values
  const resetAllStates = useCallback(() => {
    // Reset nodes with initial state
    const initialNodes = Array.from({ length: nodeCount }, (_, i) => ({
      id: i,
      x: Math.random() * 500,
      y: Math.random() * 500,
      informed: i === 0,
      data: [],
    }));

    // Reset all states to their initial values
    setNodes(initialNodes);
    setRound(0);
    // setFanout(2);
    // setDelayBetweenCycles(5000);
    setIsGossipRunning(false);
    setCurrentGuideIndex(0);
    setGossipDots([]);
    setRandomSelectionTargets([]);
    setGlobalData(null);
  }, [nodeCount]);

  const calculateMaxRounds = useCallback(() => {
    return Math.ceil(Math.log(nodeCount) / Math.log(fanout));
  }, [nodeCount, fanout]);

  // Initialize nodes with random positions and status
  useEffect(() => {
    const initialNodes = Array.from({ length: nodeCount }, (_, i) => ({
      id: i,
      x: Math.random() * 500,
      y: Math.random() * 500,
      informed: i === 0,
      data: [],
    }));
    setNodes(initialNodes);

    // Generate a single random data value at Node 0
    const initialData = Math.floor(Math.random() * 100);
    initialNodes[0].data.push(initialData); // Add data to Node 0
    setGlobalData(initialData);
  }, [nodeCount]);

  // Show Paths Action
  const handleShowPaths = useCallback(() => {
    setShowPaths(!showPaths);
  }, [showPaths]);

  // Random Selection/Fanout Action
  const handleRandomSelection = useCallback(() => {
    const informedNodes = nodes.filter(node => node.informed);

    const randomTargets = informedNodes.flatMap(node => {
      const possibleTargets = nodes
        .filter(target =>
          target.id !== node.id && !target.informed
        )
        .sort(() => 0.5 - Math.random())
        .slice(0, fanout);

      return possibleTargets.map(target => ({
        source: node,
        target: target
      }));
    });

    setRandomSelectionTargets(randomTargets);
  }, [nodes, fanout]);

  const runGossipRound = useCallback(() => {
    setNodes(prevNodes => {
      const newNodes = [...prevNodes];
      const informedNodes = newNodes.filter(node => node.informed);
      const uninformedNodes = newNodes.filter(node => !node.informed);
      const newGossipDots = [];
  
      // Probabilistic spread mechanism
      informedNodes.forEach(informedNode => {
        // Limit the number of nodes that can be informed per round
        const maxInformableNodes = Math.min(fanout, uninformedNodes.length);
        
        // Shuffle uninformed nodes to ensure randomness
        const shuffledUninformedNodes = uninformedNodes
          .sort(() => 0.5 - Math.random())
          .slice(0, maxInformableNodes);
  
        shuffledUninformedNodes.forEach(targetNode => {
          // Introduce a probability of information spread (e.g., 70% chance)
          if (Math.random() < 0.7) {
            const nodeIndex = newNodes.findIndex(n => n.id === targetNode.id);
            
            if (nodeIndex !== -1 && !newNodes[nodeIndex].informed) {
              targetNode.data.push(globalData);
              newNodes[nodeIndex].informed = true;
              
              newGossipDots.push({
                source: informedNode,
                target: targetNode,
                data: globalData,
                id: `${informedNode.id}-${targetNode.id}`
              });
            }
          }
        });
      });
  
      setGossipDots(newGossipDots);
      setTimeout(() => setGossipDots([]), GOSSIP_SPEED);
  
      return newNodes;
    });
  }, [fanout]);

  useEffect(() => {
    if (isGossipRunning) {
      const maxRounds = calculateMaxRounds();
      const allNodesInformed = nodes.every(node => node.informed);
      
      console.log("Round: ", round, "Max Rounds: ", maxRounds, "All Nodes Informed: ", allNodesInformed);
      
      if (round < maxRounds && !allNodesInformed) {
        const timer = setTimeout(() => {
          runGossipRound();
          setRound(prevRound => prevRound + 1);
        }, delayBetweenCycles);
        
        return () => clearTimeout(timer);
      } else {
        setIsGossipRunning(false);
      }
    }
  }, [round, isGossipRunning, delayBetweenCycles, nodes, calculateMaxRounds, runGossipRound]);


  
  const toggleGossip = useCallback(() => {
    setIsGossipRunning(prev => {
      if (!prev) {
        setRound(1);
      }
      return !prev;
    });
  }, []);



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

  // New Send Message Action
  const handleSendMessage = useCallback(() => {
    // If no random selection targets exist, do nothing
    if (randomSelectionTargets.length === 0) {
      console.log("No targets selected. Use 'Random Selection' first.");
      return;
    }

    // Increment round
    setRound(prevRound => prevRound + 1);

    // Create message dots for each random selection target
    const newMessageDots = randomSelectionTargets.map((link, index) => ({
      id: `message-${index}`,
      source: link.source,
      target: link.target,
      data: globalData,
      progress: 0
    }));

    // Update nodes and message dots
    const updatedNodes = [...nodes].map(node => {
      const targetFound = randomSelectionTargets.some(link => {
        if (link.target.id === node.id) {
          link.target.data.push(globalData)
          return true;
        }
      });
      return targetFound ? { ...node, informed: true } : node;
    });

    setNodes(updatedNodes);
    setMessageDots(newMessageDots);

    // Clear message dots after animation
    setTimeout(() => {
      setMessageDots([]);
    }, GOSSIP_SPEED);
  }, [randomSelectionTargets, nodes]);

  return (
    <div className="App">
      <div className="demo-section">
        <h1>Gossip Scope: A Visual Aid for Learners</h1>


        <div className="action">
          <h2>Actions</h2>
          <button onClick={resetAllStates}>Reset Nodes</button>
          {" "}
          <button onClick={handleShowPaths}>
            {showPaths ? 'Hide Paths' : 'Show Paths'}
          </button>
          {" "}
          <button onClick={handleRandomSelection}>Random Selection</button>
          {" "}
          <button
            onClick={handleSendMessage}
            disabled={randomSelectionTargets.length === 0}
          >
            Send Message
          </button>
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

          {/* Paths (Yellow Lines) */}
          {showPaths && nodes.map((node, sourceIndex) =>
            nodes.map((targetNode, targetIndex) =>
              node.informed && sourceIndex !== targetIndex ? (
                <line
                  key={`path-${sourceIndex}-${targetIndex}`}
                  x1={node.x}
                  y1={node.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke="yellow"
                  strokeWidth={2}
                  strokeOpacity={0.5}
                />
              ) : null
            )
          )}

          {/* Random Selection Lines (Green) */}
          {randomSelectionTargets.map((link, index) => (
            <line
              key={`random-${index}`}
              x1={link.source.x}
              y1={link.source.y}
              x2={link.target.x}
              y2={link.target.y}
              stroke="green"
              strokeWidth={3}
              strokeOpacity={0.7}
            />
          ))}

          {/* Nodes */}
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
              </text>

              <text
                x={node.x + 15}
                y={node.y}
                fill="black"
                fontSize="12"
              >
                {`[${node.data.join(', ')}]`}
              </text>
            </g>
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
                begin="0s"
                from={dot.source.x}
                to={dot.target.x}
                dur={`${GOSSIP_SPEED / 500}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="y"
                from={dot.source.y}
                to={dot.target.y}
                dur={`${GOSSIP_SPEED / 500}s`}
                repeatCount="indefinite"
              />
            </image>


          ))}
          {/* Message Dots */}
          {messageDots.map((dot) => (
            <image
              key={dot.id}
              xlinkHref="/mail-svgrepo-com.svg"
              x={dot.source.x}
              y={dot.source.y}
              width={20}
              height={20}
            >
              <animate
                attributeName="x"
                from={dot.source.x}
                to={dot.target.x}
                dur={`${GOSSIP_SPEED / 500}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="y"
                from={dot.source.y}
                to={dot.target.y}
                dur={`${GOSSIP_SPEED / 500}s`}
                repeatCount="indefinite"
              />
            </image>
          ))}
        </svg>
        <div className="max-rounds">
          Max Rounds: {calculateMaxRounds()}
        </div>

        <div className="round">Round: {round}</div>
        <div>
          <strong>Global Data (Generated at Node 0):</strong> {globalData}
        </div>
        <button onClick={toggleGossip}>
          {isGossipRunning ? 'Pause Gossip' : 'Start Gossip'}
        </button>
      </div>

      <div className="learners-guide">
        <h2>Learner's Guide</h2>
        <div className="guide-content">{guideContent[currentGuideIndex]}</div>
        <div className="carousel-controls">
          <button onClick={handlePrevGuide}>Previous</button>
          {" "}
          <button onClick={handleNextGuide}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default App;
