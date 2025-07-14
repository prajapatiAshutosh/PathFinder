class PathfindingVisualizer {
    constructor() {
        this.grid = [];
        this.rows = 25;
        this.cols = 25;
        this.startNode = { row: 5, col: 5 };
        this.endNode = { row: 20, col: 20 };
        this.isMouseDown = false;
        this.isRunning = false;
        this.speed = 50;
        this.movingNode = null; // Can be 'start', 'end', or null

        this.initializeGrid();
        this.setupEventListeners();
        this.updateGridSize();
    }

    initializeGrid() {
        this.grid = [];
        for (let row = 0; row < this.rows; row++) {
            const currentRow = [];
            for (let col = 0; col < this.cols; col++) {
                currentRow.push({
                    row,
                    col,
                    isStart: row === this.startNode.row && col === this.startNode.col,
                    isEnd: row === this.endNode.row && col === this.endNode.col,
                    isWall: false,
                    isVisited: false,
                    isPath: false,
                    distance: Infinity,
                    previousNode: null
                });
            }
            this.grid.push(currentRow);
        }
    }

    setupEventListeners() {
        document.getElementById('gridSize').addEventListener('input', (e) => {
            const size = parseInt(e.target.value);
            this.rows = size;
            this.cols = size;
            document.getElementById('gridSizeValue').textContent = `${size}x${size}`;
            this.updateGridSize();
        });

        document.getElementById('speed').addEventListener('input', (e) => {
            const speed = parseInt(e.target.value);
            this.speed = 110 - (speed * 10);
            document.getElementById('speedValue').textContent = speed;
        });

        document.getElementById('startBtn').addEventListener('click', () => {
            if (!this.isRunning) {
                this.startPathfinding();
            }
        });

        document.getElementById('clearPathBtn').addEventListener('click', () => {
            this.clearPath();
        });

        document.getElementById('clearAllBtn').addEventListener('click', () => {
            this.clearAll();
        });
        
        // Global listener for mouse up to stop drawing or moving
        document.addEventListener('mouseup', () => {
            this.isMouseDown = false;
            this.movingNode = null;
        });
    }

    updateGridSize() {
        const gridElement = document.getElementById('grid');
        gridElement.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        gridElement.innerHTML = '';

        this.startNode = { 
            row: Math.min(Math.floor(this.rows * 0.2), this.rows - 1), 
            col: Math.min(Math.floor(this.cols * 0.2), this.cols - 1) 
        };
        this.endNode = { 
            row: Math.min(Math.floor(this.rows * 0.8), this.rows - 1), 
            col: Math.min(Math.floor(this.cols * 0.8), this.cols - 1) 
        };

        this.initializeGrid();

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cellElement = document.createElement('div');
                cellElement.className = 'cell';
                cellElement.id = `cell-${row}-${col}`;
                
                if (row === this.startNode.row && col === this.startNode.col) {
                    cellElement.classList.add('start');
                }
                if (row === this.endNode.row && col === this.endNode.col) {
                    cellElement.classList.add('end');
                }

                cellElement.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.handleMouseDown(row, col);
                });

                cellElement.addEventListener('mouseenter', () => {
                    this.handleMouseEnter(row, col);
                });

                gridElement.appendChild(cellElement);
            }
        }
    }

    handleMouseDown(row, col) {
        if (this.isRunning) return;
        
        this.isMouseDown = true;
        const node = this.grid[row][col];
        
        if (node.isStart) {
            this.movingNode = 'start';
        } else if (node.isEnd) {
            this.movingNode = 'end';
        } else {
            this.toggleWall(row, col);
        }
    }

    handleMouseEnter(row, col) {
        if (this.isRunning || !this.isMouseDown) return;
        
        if (this.movingNode) {
            this.moveNode(row, col);
        } else {
            const node = this.grid[row][col];
            if (!node.isStart && !node.isEnd) {
                this.toggleWall(row, col);
            }
        }
    }
    
    moveNode(newRow, newCol) {
        const newTargetNode = this.grid[newRow][newCol];
        if (newTargetNode.isWall) return;

        if (this.movingNode === 'start') {
            if (newTargetNode.isEnd) return;
            
            const prevStartNodeData = this.grid[this.startNode.row][this.startNode.col];
            document.getElementById(`cell-${this.startNode.row}-${this.startNode.col}`).classList.remove('start');
            prevStartNodeData.isStart = false;

            this.startNode = { row: newRow, col: newCol };
            newTargetNode.isStart = true;
            document.getElementById(`cell-${newRow}-${newCol}`).classList.add('start');

        } else if (this.movingNode === 'end') {
            if (newTargetNode.isStart) return;
            
            const prevEndNodeData = this.grid[this.endNode.row][this.endNode.col];
            document.getElementById(`cell-${this.endNode.row}-${this.endNode.col}`).classList.remove('end');
            prevEndNodeData.isEnd = false;

            this.endNode = { row: newRow, col: newCol };
            newTargetNode.isEnd = true;
            document.getElementById(`cell-${newRow}-${newCol}`).classList.add('end');
        }
    }

    toggleWall(row, col) {
        const node = this.grid[row][col];
        const cellElement = document.getElementById(`cell-${row}-${col}`);
        
        if (!node.isWall) {
            node.isWall = true;
            cellElement.classList.add('wall');
        } else {
            node.isWall = false;
            cellElement.classList.remove('wall');
        }
    }

    async startPathfinding() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.clearPath();
        
        const algorithm = document.getElementById('algorithm').value;
        const startTime = performance.now();
        
        let result;
        switch (algorithm) {
            case 'dijkstra':
                result = await this.dijkstra();
                break;
            case 'bfs':
                result = await this.bfs();
                break;
            case 'dfs':
                result = await this.dfs();
                break;
        }
        
        const endTime = performance.now();
        const executionTime = (endTime - startTime).toFixed(2);
        
        if (result.pathFound) {
            await this.animatePath(result.path);
            document.getElementById('stats').textContent = 
                `Path found! Length: ${result.path.length}, Nodes visited: ${result.visitedCount}, Time: ${executionTime}ms`;
        } else {
            document.getElementById('stats').textContent = 
                `No path found. Nodes visited: ${result.visitedCount}, Time: ${executionTime}ms`;
        }
        
        this.isRunning = false;
    }

    async dijkstra() {
        const startNode = this.grid[this.startNode.row][this.startNode.col];
        const endNode = this.grid[this.endNode.row][this.endNode.col];
        
        startNode.distance = 0;
        const unvisitedNodes = this.getAllNodes();
        const visitedNodesInOrder = [];
        
        while (unvisitedNodes.length) {
            this.sortNodesByDistance(unvisitedNodes);
            const closestNode = unvisitedNodes.shift();
            
            if (closestNode.isWall) continue;
            if (closestNode.distance === Infinity) break;
            
            closestNode.isVisited = true;
            visitedNodesInOrder.push(closestNode);
            
            if (!closestNode.isStart && !closestNode.isEnd) {
                await this.animateVisited(closestNode);
            }
            
            if (closestNode === endNode) {
                return {
                    pathFound: true,
                    path: this.getShortestPath(endNode),
                    visitedCount: visitedNodesInOrder.length
                };
            }
            
            this.updateUnvisitedNeighbors(closestNode);
        }
        
        return {
            pathFound: false,
            path: [],
            visitedCount: visitedNodesInOrder.length
        };
    }

    async bfs() {
        const startNode = this.grid[this.startNode.row][this.startNode.col];
        const endNode = this.grid[this.endNode.row][this.endNode.col];
        
        const queue = [startNode];
        const visitedNodesInOrder = [];
        startNode.isVisited = true;
        
        while (queue.length > 0) {
            const currentNode = queue.shift();
            visitedNodesInOrder.push(currentNode);
            
            if (!currentNode.isStart && !currentNode.isEnd) {
                await this.animateVisited(currentNode);
            }
            
            if (currentNode === endNode) {
                return {
                    pathFound: true,
                    path: this.getShortestPath(endNode),
                    visitedCount: visitedNodesInOrder.length
                };
            }
            
            const neighbors = this.getUnvisitedNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (!neighbor.isVisited && !neighbor.isWall) {
                    neighbor.isVisited = true;
                    neighbor.previousNode = currentNode;
                    queue.push(neighbor);
                }
            }
        }
        
        return {
            pathFound: false,
            path: [],
            visitedCount: visitedNodesInOrder.length
        };
    }

    async dfs() {
        const startNode = this.grid[this.startNode.row][this.startNode.col];
        const endNode = this.grid[this.endNode.row][this.endNode.col];
        
        const stack = [startNode];
        const visitedNodesInOrder = [];
        
        while (stack.length > 0) {
            const currentNode = stack.pop();
            
            if (currentNode.isVisited || currentNode.isWall) continue;
            
            currentNode.isVisited = true;
            visitedNodesInOrder.push(currentNode);
            
            if (!currentNode.isStart && !currentNode.isEnd) {
                await this.animateVisited(currentNode);
            }
            
            if (currentNode === endNode) {
                return {
                    pathFound: true,
                    path: this.getShortestPath(endNode),
                    visitedCount: visitedNodesInOrder.length
                };
            }
            
            const neighbors = this.getUnvisitedNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (!neighbor.isVisited && !neighbor.isWall) {
                    neighbor.previousNode = currentNode;
                    stack.push(neighbor);
                }
            }
        }
        
        return {
            pathFound: false,
            path: [],
            visitedCount: visitedNodesInOrder.length
        };
    }

    getAllNodes() {
        const nodes = [];
        for (const row of this.grid) {
            for (const node of row) {
                nodes.push(node);
            }
        }
        return nodes;
    }

    sortNodesByDistance(unvisitedNodes) {
        unvisitedNodes.sort((nodeA, nodeB) => nodeA.distance - nodeB.distance);
    }

    updateUnvisitedNeighbors(node) {
        const unvisitedNeighbors = this.getUnvisitedNeighbors(node);
        for (const neighbor of unvisitedNeighbors) {
            neighbor.distance = node.distance + 1;
            neighbor.previousNode = node;
        }
    }

    getUnvisitedNeighbors(node) {
        const neighbors = [];
        const { col, row } = node;
        
        if (row > 0) neighbors.push(this.grid[row - 1][col]);
        if (row < this.rows - 1) neighbors.push(this.grid[row + 1][col]);
        if (col > 0) neighbors.push(this.grid[row][col - 1]);
        if (col < this.cols - 1) neighbors.push(this.grid[row][col + 1]);
        
        return neighbors.filter(neighbor => !neighbor.isVisited);
    }

    getShortestPath(endNode) {
        const nodesInShortestPathOrder = [];
        let currentNode = endNode;
        while (currentNode !== null) {
            nodesInShortestPathOrder.unshift(currentNode);
            currentNode = currentNode.previousNode;
        }
        return nodesInShortestPathOrder;
    }

    async animateVisited(node) {
        return new Promise(resolve => {
            setTimeout(() => {
                const cellElement = document.getElementById(`cell-${node.row}-${node.col}`);
                cellElement.classList.add('visited');
                resolve();
            }, this.speed);
        });
    }

    async animatePath(path) {
        for (let i = 0; i < path.length; i++) {
            const node = path[i];
            if (!node.isStart && !node.isEnd) {
                await new Promise(resolve => {
                    setTimeout(() => {
                        const cellElement = document.getElementById(`cell-${node.row}-${node.col}`);
                        cellElement.classList.add('path');
                        resolve();
                    }, 50);
                });
            }
        }
    }

    clearPath() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const node = this.grid[row][col];
                const cellElement = document.getElementById(`cell-${row}-${col}`);
                
                node.isVisited = false;
                node.distance = Infinity;
                node.previousNode = null;
                
                cellElement.classList.remove('visited', 'path', 'current');
            }
        }
        
        document.getElementById('stats').textContent = 
            'Click and drag to place walls. Click and drag Start 🚀 or End 🎯 nodes to move them.';
    }

    clearAll() {
        this.clearPath();
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const node = this.grid[row][col];
                const cellElement = document.getElementById(`cell-${row}-${col}`);
                
                if (!node.isStart && !node.isEnd) {
                    node.isWall = false;
                    cellElement.classList.remove('wall');
                }
            }
        }
    }
}

// Initialize the visualizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PathfindingVisualizer();
});