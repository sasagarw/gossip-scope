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
      failed: false,
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

    // Generate a single random data value at Node 0
    const initialData = Math.floor(Math.random() * 100);
    initialNodes[0].data.push(initialData); // Add data to Node 0
    setGlobalData(initialData);
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
      failed: false,
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
    const informedNodes = nodes.filter(node => node.informed && !node.failed);

    const randomTargets = informedNodes.flatMap(node => {
      const possibleTargets = nodes
        .filter(target =>
          target.id !== node.id && !target.informed && !target.failed
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
      const informedNodes = newNodes.filter(node => node.informed && !node.failed);
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

            if (nodeIndex !== -1 && !newNodes[nodeIndex].informed && !newNodes[nodeIndex].failed) {
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
  }, [fanout, globalData]);

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

  // Toggle failure status of a node when clicked
  const toggleNodeStatus = id => {
    setNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === id
          ? { ...node, failed: !node.failed, informed: node.failed ? node.informed : false } // Toggle failed state
          : node
      )
    );
  };

  const handlePrevGuide = useCallback(() => {
    setCurrentGuideIndex(prev => (prev === 0 ? guideContent.length - 1 : prev - 1));
  }, []);

  const handleNextGuide = useCallback(() => {
    setCurrentGuideIndex(prev => (prev + 1) % guideContent.length);
  }, []);

  const guideContent = [
    `
    <div>
    <p>
      <h2>Welcome to GossipScope! Let’s dive in and explore how it works interactively.</h2>
      <p>Dive into the fascinating world of gossip algorithms! This simulator allows you to interactively explore how information spreads through a network. The process runs in cycles, with nodes sharing data with each other at regular intervals.
      <h3>What do the colors signify?</h3>
      <li> By default in the network, nodes are <strong>Gray</strong> and uninformed.</li>
       <li>When a node is informed, it turns <strong>Green</strong>.</li>
        <li>Click on any node in the network to get started. Once you click, the node will turn <strong>Red</strong>, signifying that it's now "faulty".</li>
      </p>
    `,
    `<div>
    <h2>Modes of operation</h2>
     There are 2 modes of operation in the simulator:
    <ul>
     <li><strong>Start Gossip:</strong> Automatically running the gossip protocol for a set number of rounds</li>
      <li><strong>Send Message:</strong> Manually sending a message to a set of nodes</li>
    </ul>
    Note: Random Selection must be used before sending a message.
  </div>`,
    `<div>
    <h2>Information Spread</h2>
    Click <strong>Show Paths</strong> to visualize connections.
    <ul>
      <li>Adjust <strong>fanout</strong> to control spread.</li>
      A higher fanout increases the number of nodes informed per round, leading to faster propagation.
      <li>Use <strong>Random Selection</strong> to see probabilistic communication.</li>
      Click the Random Selection button to initiate the random selection of target nodes for information spread. Informed nodes will randomly choose other uninformed nodes to inform, based on the fanout value. The selected nodes will be connected by lines (green lines) to indicate the gossip flow.
    </ul>
  </div>`,
    `<div>
  <h2>Scaling</h2>
  <p>
    Gossip protocols are scalable because they take logarithmic time to propagate information across the network. The max number of rounds required to inform all nodes is calculated using the formula:
  <p style="font-family: monospace; font-size: 1.2em;">
    Rounds = log<sub>fanout</sub>(nodes)</p>
    Let’s see this in action. Try restarting the simulator, changing the number of nodes to 20. You'll notice that doubling the number of nodes results in only one additional cycle, demonstrating the logarithmic nature of the growth.
  </p>
</div>
`,
`
<div>
  <h2>Experimenting with Network Parameters</h2>
  <ul>
  <li><strong>Node Count:</strong> Increase or decrease the number of nodes in the network. A higher node count creates a larger network, increasing the complexity of the simulation.</li>
  <li><strong>Fanout:</strong> Adjust the fanout value to control how many nodes a single informed node can inform at once.</li>
  <li><strong>Delay Between Cycles:</strong> Modify the delay between rounds to observe how the gossip spread changes with different cycle times.</li>
  <li><strong>Failures:</strong> Toggle the failure status of nodes to simulate real-world conditions where certain nodes may fail and can no longer inform other nodes.</li>
  </ul>
</div>
`,
    `
   <div>
  <h2>Fault Tolerance in Gossip Protocols</h2>
  <h3>Node Failure</h3>
    Gossip protocols are fault-tolerant, meaning the system can still function even when some nodes fail. In the simulator, clicking a node turns it <strong>Red</strong>, indicating failure. Despite this, the other nodes continue to spread information. 
  <h3>Node Restoration</h3>
    You can restore a failed node by clicking it again, and it will turn <strong>Gray</strong> resume participating in the network. This illustrates how gossip protocols handle node failures and ensure updates reach all nodes, even when some are temporarily unavailable.
</div>
    `
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
            <g key={index}>
              <circle
                key={index}
                cx={node.x}
                cy={node.y}
                r={15}
                fill={node.failed ? 'red' : node.informed ? 'green' : 'gray'}
                onClick={() => toggleNodeStatus(node.id)} // Toggle node state on click
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

      {/* <div className="learners-guide">
        <h2>Learner's Guide</h2>
        <div className="guide-content">{guideContent[currentGuideIndex]}</div>
        <div className="carousel-controls">
          <button onClick={handlePrevGuide}>Previous</button>
          {" "}
          <button onClick={handleNextGuide}>Next</button>
        </div>
      </div> */}

      <div className="learners-guide">
        <h1>Learner's Guide</h1>
        <div className="guide-content">
          <p dangerouslySetInnerHTML={{ __html: guideContent[currentGuideIndex].replace(/\n/g, '<br />') }} />
        </div>
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
