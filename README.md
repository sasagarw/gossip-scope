# Gossip Scope
Gossip Scope is an interactive visualization tool designed to help learners, researchers, and developers understand the behavior of the Gossip Distributed Protocol. Inspired by tools like RaftScope, Gossip Scope provides real-time graphical simulations of how information propagates through a network using the Gossip protocol.

## 🚀 Features
* **Real-time Visualization**: Watch as nodes exchange information and messages propagate through the network.
* **Simulate Node Failures**: Test the protocol's fault tolerance by simulating node failures and recoveries.
* **Interactive Controls**: Modify parameters such as fanout size, cycle delay, and network topology to explore various scenarios.
* **Automated & Manual Modes**:
  * _Automated Mode_: Sit back and observe the protocol in action.
  * _Interactive Mode_: Manually experiment with message propagation for a hands-on learning experience.
* **Path Visualization**: Highlight communication paths between nodes to better understand message routes.
* **Educational Guide**: Includes a built-in learner's guide to explain key concepts and actions.

## 🛠️ Technology Stack
* **Frontend**: React.js for building the user interface.
* **Visualization**: D3.js for creating dynamic graph visualizations.
* **Backend**: JavaScript-based logic for simulating the Gossip protocol.

## 📚 About the Gossip Protocol
The Gossip protocol is widely used in distributed systems for decentralized, fault-tolerant information propagation. Its key features include:
* **Decentralization**: No central authority; nodes independently gossip with others.
* **Fault Tolerance**: Resilient to node failures and network partitions.
* **Scalability**: Efficient communication overhead, suitable for large networks.
* **Applications**: Used by major systems like DynamoDB (AWS), HashiCorp Consul, and Apache Cassandra.
