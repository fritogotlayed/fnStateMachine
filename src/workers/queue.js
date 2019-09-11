function Queue() { this.data = []; }
Queue.prototype.enqueue = function enqueue(item) { this.data.unshift(item); };
Queue.prototype.dequeue = function dequeue() { return this.data.pop(); };
Queue.prototype.first = function first() { return this.data[0]; };
Queue.prototype.last = function last() { return this.data[this.data.length - 1]; };
Queue.prototype.size = function size() { return this.data.length; };

module.exports = Queue;
