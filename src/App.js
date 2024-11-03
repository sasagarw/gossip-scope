import React, { useEffect, useState, useCallback } from 'react';
import './App.css';

const App = () => {
  const [nodes, setNodes] = useState([]);
  const [cycle, setCycle] = useState(0);
  const [fanout, setFanout] = useState(4);
  const [nodeCount, setNodeCount] = useState(40);
  const [delayBetweenCycles, setDelayBetweenCycles] = useState(1000);
  const [isGossipRunning, setIsGossipRunning] = useState(false);
  const [showPaths, setShowPaths] = useState(false);
  const [randomSelectionNodes, setRandomSelectionNodes] = useState([]);
  const [activeNodes, setActiveNodes] = useState([]);
  const [state, setState] = useState('INFECTIVE');
  const [currentGuideIndex, setCurrentGuideIndex] = useState(0);
  const [highlightedPaths, setHighlightedPaths] = useState([]);

  const colors = ['#5d8aa8', '#FCE374', '#35E81A', 'grey', '#705D07', '#88C76D', '#E87654', '#bcd4e6', '#89cff0', '#007fff', '#a1caf1', '#2C58E8', '#C7469C', 'DarkCyan', '#3BCCC2', '#7C5ACC', '#87CCA5', '#85727B', '#851B5A', '#857E1B'];

  const getColor = useCallback(() => colors[Math.floor(Math.random() * colors.length)], []);

  const initializeNodes = useCallback(() => {
    const center = [300, 300];
    const radius = 240;
    const slice = (2 * Math.PI) / nodeCount;
    
    const initialNodes = Array.from({ length: nodeCount }, (_, i) => {
      const angle = slice * i;
      const x = center[0] + radius * Math.cos(angle);
      const y = center[1] + radius * Math.sin(angle);
      return {
        id: i,
        x,
        y,
        informed: false,
        membership: [],
        paths: [],
        originalColor: getColor(),
        msg: Array(fanout).fill().map(() => ({ x, y, visible: false }))
      };
    });

    setNodes(initialNodes);
    setCycle(0);
    setIsGossipRunning(false);
    setRandomSelectionNodes([]);
    setActiveNodes([]);
    setHighlightedPaths([]);
  }, [nodeCount, fanout, getColor]);

  useEffect(() => {
    initializeNodes();
  }, [initializeNodes]);

  const createClusterMembership = useCallback(() => {
    const updatedNodes = nodes.map((node, i) => {
      const membership = [];
      const paths = [];

      nodes.forEach((otherNode, j) => {
        if (i !== j) {
          const distance = Math.sqrt(
            Math.pow(node.x - otherNode.x, 2) + Math.pow(node.y - otherNode.y, 2)
          );
          if (distance < 240) {
            membership.push(otherNode);
            paths.push({
              source: node,
              target: otherNode,
              visible: false,
              isDestination: false,
              strokeColor: node.originalColor,
              strokeWidth: 3,
              opacity: 0.6
            });
          }
        }
      });

      return { ...node, membership, paths };
    });

    setNodes(updatedNodes);
  }, [nodes]);

  useEffect(() => {
    createClusterMembership();
  }, [createClusterMembership]);

  const getUniqueRandom = useCallback((list, n, except) => {
    const selectedElements = [];
    while (selectedElements.length < n && selectedElements.length < list.length) {
      const randomIndex = Math.floor(Math.random() * list.length);
      const selected = list[randomIndex];
      if (!selectedElements.includes(selected) && selected !== except) {
        selectedElements.push(selected);
      }
    }
    return selectedElements;
  }, []);

  const infectNode = useCallback((nodeId) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId ? { ...node, informed: true } : node
      )
    );
    setActiveNodes(prevActiveNodes => {
      const nodeToAdd = nodes.find(node => node.id === nodeId);
      return nodeToAdd && !prevActiveNodes.some(n => n.id === nodeId) 
        ? [...prevActiveNodes, nodeToAdd] 
        : prevActiveNodes;
    });
  }, [nodes]);

  const toggleShowPaths = useCallback(() => {
    setShowPaths(!showPaths);
  }, [showPaths]);

  const randomSelection = useCallback(() => {
    const informedNodes = nodes.filter(node => node.informed);
    let selectedNodes = [];

    informedNodes.forEach(sourceNode => {
      const possibleTargets = sourceNode.membership.filter(node => !node.informed);
      const randomTargets = getUniqueRandom(possibleTargets, fanout, sourceNode);
      selectedNodes.push(...randomTargets);
    });

    setRandomSelectionNodes(selectedNodes);

    // Highlight selected paths
    const highlightedPaths = nodes.flatMap(node => 
      node.informed ? getUniqueRandom(node.paths, fanout).map(path => ({
        ...path,
        strokeWidth: 5,
        opacity: 1
      })) : []
    );

    setNodes(prevNodes => prevNodes.map(node => ({
      ...node,
      paths: node.paths.map(path => 
        highlightedPaths.some(hp => hp.source.id === path.source.id && hp.target.id === path.target.id)
          ? { ...path, strokeWidth: 5, opacity: 1 }
          : path
      )
    })));
  }, [nodes, fanout, getUniqueRandom]);

  const sendMessageToSelected = useCallback(() => {
    setNodes(prevNodes => prevNodes.map(node => {
      if (randomSelectionNodes.some(selectedNode => selectedNode.id === node.id)) {
        return { ...node, informed: true };
      }
      return node;
    }));

    setActiveNodes(prevActiveNodes => [
      ...prevActiveNodes,
      ...randomSelectionNodes.filter(node => !prevActiveNodes.some(an => an.id === node.id))
    ]);

    setRandomSelectionNodes([]);

    // Reset highlighted paths
    setNodes(prevNodes => prevNodes.map(node => ({
      ...node,
      paths: node.paths.map(path => ({ ...path, strokeWidth: 3, opacity: 0.6 }))
    })));
    setCycle(prevCycle => prevCycle + 1);
  }, [randomSelectionNodes]);

  const deleteNode = useCallback((nodeId) => {
    setNodes(prevNodes => prevNodes.filter(node => node.id !== nodeId));
    setActiveNodes(prevActiveNodes => prevActiveNodes.filter(node => node.id !== nodeId));

    // Update memberships and paths of remaining nodes
    setNodes(prevNodes => prevNodes.map(node => ({
      ...node,
      membership: node.membership.filter(member => member.id !== nodeId),
      paths: node.paths.filter(path => path.target.id !== nodeId)
    })));
  }, []);

  const restartSimulation = useCallback(() => {
    console.log('Restarting simulation...');
    initializeNodes();
    setState('INFECTIVE');
  }, [initializeNodes]);

  const toggleGossip = useCallback(() => {
    setIsGossipRunning(!isGossipRunning);
    setState(prev => prev === 'PLAY' ? 'INFECTIVE' : 'PLAY');
  }, [isGossipRunning]);

  useEffect(() => {
    let intervalId;

    if (isGossipRunning) {
      intervalId = setInterval(() => {
        if (state === 'PLAY') {
          if (activeNodes.length === nodes.length) return;
          randomSelection();
          sendMessageToSelected();
          // setCycle(prev => prev + 1);
        }
      }, delayBetweenCycles);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isGossipRunning, state, delayBetweenCycles, nodes.length, activeNodes.length, randomSelection, sendMessageToSelected]);

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

        <div className="actions">
          <h2>Actions</h2>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={toggleShowPaths} disabled={activeNodes.length === 0}>
              {showPaths ? 'Hide Paths' : 'Show Paths'}
            </button>
            <button onClick={randomSelection} disabled={activeNodes.length === 0}>
              Random Selection
            </button>
            <button
              onClick={() => {
                setState('SEND_TEST_MESSAGE');
                sendMessageToSelected();
              }}
              disabled={activeNodes.length === 0 || randomSelectionNodes.length === 0}
            >
              Send Message
            </button>
            <button
              onClick={() => {
                setState('REMOVING');
              }}
              disabled={activeNodes.length === 0}
            >
              Remove Node
            </button>
            <button onClick={restartSimulation}>Restart</button>
          </div>
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
          {showPaths && nodes.flatMap(node =>
            node.informed ? node.paths.map((path, index) => (
              <line
                key={`${node.id}-${index}`}
                x1={node.x}
                y1={node.y}
                x2={path.target.x}
                y2={path.target.y}
                stroke={path.strokeColor}
                strokeWidth={path.strokeWidth}
                opacity={path.opacity}
              />
            )) : []
          )}
          {nodes.map((node) => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={17}
                fill={node.informed ? 'red' : node.originalColor}
                stroke={node.informed ? 'red' : 'black'}
                strokeWidth={3}
                onClick={() => {
                  console.log('Node clicked:', node.id, state);
                  if (state === 'INFECTIVE') {
                    console.log('Infecting node', node.id);
                    infectNode(node.id);
                  } else if (state === 'REMOVING') {
                    deleteNode(node.id);
                  }
                }}
              />
              {node.msg.map((msg, index) => (
                <circle
                  key={`msg-${node.id}-${index}`}
                  cx={msg.x}
                  cy={msg.y}
                  r={10}
                  fill={node.originalColor}
                  stroke="red"
                  strokeWidth={2}
                  opacity={msg.visible ? 1 : 0}
                />
              ))}
            </g>
          ))}
        </svg>

        <div className="cycle">Cycle: {cycle}</div>

        <button onClick={toggleGossip} disabled={activeNodes.length === 0}>
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
